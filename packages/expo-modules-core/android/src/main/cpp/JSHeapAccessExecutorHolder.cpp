#include "JSHeapAccessExecutorHolder.h"

#include <fbjni/NativeRunnable.h>

#include <atomic>
#include <mutex>

namespace expo {

namespace {

void runOnQueueSync(
  jni::alias_ref<JSHeapAccessExecutorJavaClass::javaobject> self,
  jni::alias_ref<jni::JRunnable::javaobject> runnable
) {
  static const auto method = JSHeapAccessExecutorJavaClass::javaClassStatic()
    ->getMethod<void(jni::JRunnable::javaobject)>("runOnQueueSync");
  method(self, runnable.get());
}

bool runOnQueue(
  jni::alias_ref<JSHeapAccessExecutorJavaClass::javaobject> self,
  jni::alias_ref<jni::JRunnable::javaobject> runnable,
  jni::alias_ref<jni::JRunnable::javaobject> onCancellation
) {
  static const auto method = JSHeapAccessExecutorJavaClass::javaClassStatic()
    ->getMethod<jboolean(jni::JRunnable::javaobject, jni::JRunnable::javaobject)>("runOnQueue");
  return method(self, runnable.get(), onCancellation.get());
}

struct SyncCall {
  std::atomic<bool> abandoned{false};
  std::mutex exceptionMutex;
  std::exception_ptr exception;
  std::function<void()> body;
};

} // namespace

JSHeapAccessExecutorHolder::JSHeapAccessExecutorHolder(jni::alias_ref<jni::JObject> executor)
  : _executor(jni::make_global(executor)) {}

JSHeapAccessExecutorHolder::~JSHeapAccessExecutorHolder() {
  jni::ThreadScope::WithClassLoader([&] { _executor.reset(); });
}

void JSHeapAccessExecutorHolder::runSync(std::function<void()> body) {
  auto call = std::make_shared<SyncCall>();
  call->body = std::move(body);
  auto runnable = jni::JNativeRunnable::newObjectCxxArgs([call] {
    if (call->abandoned.load(std::memory_order_acquire)) {
      return;
    }
    try {
      call->body();
    } catch (...) {
      std::lock_guard<std::mutex> lock(call->exceptionMutex);
      call->exception = std::current_exception();
    }
  });

  auto executor = jni::static_ref_cast<JSHeapAccessExecutorJavaClass>(jni::make_local(_executor));
  try {
    runOnQueueSync(executor, runnable);
  } catch (...) {
    call->abandoned.store(true, std::memory_order_release);
    throw;
  }

  std::exception_ptr exception;
  {
    std::lock_guard<std::mutex> lock(call->exceptionMutex);
    exception = call->exception;
  }
  if (exception) {
    std::rethrow_exception(exception);
  }
}

void JSHeapAccessExecutorHolder::runAsync(
  std::function<void()> body,
  std::function<void()> onCancellation
) {
  auto runnable = jni::JNativeRunnable::newObjectCxxArgs([body = std::move(body)]() mutable {
    body();
  });
  auto cancellationRunnable = jni::JNativeRunnable::newObjectCxxArgs([
    onCancellation = std::move(onCancellation)
  ]() mutable {
    onCancellation();
  });

  auto executor = jni::static_ref_cast<JSHeapAccessExecutorJavaClass>(jni::make_local(_executor));
  runOnQueue(executor, runnable, cancellationRunnable);
}

} // namespace expo
