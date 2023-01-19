#include "JniPlatformContext.h"

#include <exception>
#include <thread>
#include <utility>

#include "SkData.h"
#include "SkRefCnt.h"
#include "SkStream.h"
#include "SkTypes.h"
#include <RNSkMeasureTime.h>

namespace RNSkia {

namespace jsi = facebook::jsi;

using TSelf = jni::local_ref<JniPlatformContext::jhybriddata>;

void JniPlatformContext::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JniPlatformContext::initHybrid),
      makeNativeMethod("notifyDrawLoop",
                       JniPlatformContext::notifyDrawLoopExternal),
      makeNativeMethod("notifyTaskReady",
                       JniPlatformContext::notifyTaskReadyExternal),
  });
}

TSelf JniPlatformContext::initHybrid(jni::alias_ref<jhybridobject> jThis,
                                     float pixelDensity) {
  return makeCxxInstance(jThis, pixelDensity);
}

void JniPlatformContext::startDrawLoop() {
  jni::ThreadScope ts;
  // Start drawing loop
  static auto method =
      javaPart_->getClass()->getMethod<void(void)>("beginDrawLoop");
  method(javaPart_.get());
}

void JniPlatformContext::stopDrawLoop() {
  jni::ThreadScope ts;
  // Stop drawing loop
  static auto method =
      javaPart_->getClass()->getMethod<void(void)>("endDrawLoop");
  method(javaPart_.get());
}

void JniPlatformContext::notifyDrawLoopExternal() {
  jni::ThreadScope ts;
  _onNotifyDrawLoop();
}

void JniPlatformContext::notifyTaskReadyExternal() {
  _taskMutex->lock();
  auto task = _taskCallbacks.front();
  if (task != nullptr) {
    _taskCallbacks.pop();
    _taskMutex->unlock();
    task();
  } else {
    _taskMutex->unlock();
  }
}

void JniPlatformContext::performStreamOperation(
    const std::string &sourceUri,
    const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) {
  auto measure = RNSkMeasureTime("JniPlatformContext::performStreamOperation");

  static auto method = javaPart_->getClass()->getMethod<jbyteArray(jstring)>(
      "getJniStreamFromSource");

  auto loader = [=]() -> void {
    jni::ThreadScope ts;
    jstring jstr =
        (*jni::Environment::current()).NewStringUTF(sourceUri.c_str());

    // Get the array with data from input stream from Java
    auto array = method(javaPart_.get(), jstr);

    if (array == nullptr) {
      printf("Calling getJniStreamFromSource failed\n");
      return;
    }

    // Allocate buffer for java byte array
    jsize num_bytes = jni::Environment::current()->GetArrayLength(array.get());
    char *buffer = reinterpret_cast<char *>(malloc(num_bytes + 1));

    if (!buffer) {
      printf("Buff Fail\n");
      return;
    }

    jbyte *elements =
        jni::Environment::current()->GetByteArrayElements(array.get(), nullptr);
    if (!elements) {
      printf("Element Fail\n");
      return;
    }

    // Copy data from java array to buffer
    memcpy(buffer, elements, num_bytes);
    buffer[num_bytes] = 0;

    jni::Environment::current()->ReleaseByteArrayElements(array.get(), elements,
                                                          JNI_ABORT);

    // Copy malloced data and give ownership to SkData
    auto data = SkData::MakeFromMalloc(buffer, num_bytes);
    auto skStream = SkMemoryStream::Make(data);

    // Perform operation
    op(std::move(skStream));
  };

  // Fire and forget the thread - will be resolved on completion
  std::thread(loader).detach();
}

void JniPlatformContext::raiseError(const std::exception &err) {
  jni::ThreadScope ts;
  static auto method =
      javaPart_->getClass()->getMethod<void(std::string)>("raise");
  method(javaPart_.get(), std::string(err.what()));
}

} // namespace RNSkia