#include "JSHeapAccessExecutorHolder.h"

#include <fbjni/NativeRunnable.h>

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
  jni::alias_ref<jni::JRunnable::javaobject> runnable
) {
  static const auto method = JSHeapAccessExecutorJavaClass::javaClassStatic()
    ->getMethod<jboolean(jni::JRunnable::javaobject)>("runOnQueue");
  return method(self, runnable.get());
}

} // namespace

JSHeapAccessExecutorHolder::JSHeapAccessExecutorHolder(jni::alias_ref<jni::JObject> executor)
  : _executor(jni::make_global(executor)) {}

JSHeapAccessExecutorHolder::~JSHeapAccessExecutorHolder() {
  jni::ThreadScope::WithClassLoader([&] { _executor.reset(); });
}

void JSHeapAccessExecutorHolder::runSync(std::function<void()> &&body) {
  std::exception_ptr exception;
  auto runnable = jni::JNativeRunnable::newObjectCxxArgs([
    body = std::move(body),
    &exception
  ]() mutable {
    try {
      body();
    } catch (...) {
      exception = std::current_exception();
    }
  });

  auto executor = jni::static_ref_cast<JSHeapAccessExecutorJavaClass>(jni::make_local(_executor));
  runOnQueueSync(executor, runnable);

  if (exception) {
    std::rethrow_exception(exception);
  }
}

bool JSHeapAccessExecutorHolder::runAsync(std::function<void()> &&body) {
  auto runnable = jni::JNativeRunnable::newObjectCxxArgs([body = std::move(body)]() mutable {
    body();
  });

  auto executor = jni::static_ref_cast<JSHeapAccessExecutorJavaClass>(jni::make_local(_executor));
  return runOnQueue(executor, runnable);
}

} // namespace expo
