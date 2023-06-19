#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <fbjni/fbjni.h>

#include <exception>
#include <functional>
#include <memory>
#include <mutex>
#include <queue>
#include <string>

#include "RNSkPlatformContext.h"

class SkStreamAsset;
namespace RNSkia {

namespace jsi = facebook::jsi;
namespace jni = facebook::jni;

using JSCallInvokerHolder =
    jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;

class JniPlatformContext : public jni::HybridClass<JniPlatformContext> {
public:
  static auto constexpr kJavaDescriptor =
      "Lcom/shopify/reactnative/skia/PlatformContext;";

  static jni::local_ref<jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis, const float);

  static void registerNatives();

  void performStreamOperation(
      const std::string &sourceUri,
      const std::function<void(std::unique_ptr<SkStreamAsset>)> &op);

  void raiseError(const std::exception &err);

  void startDrawLoop();
  void stopDrawLoop();

  void notifyDrawLoopExternal();

  void notifyTaskReadyExternal();

  void runTaskOnMainThread(std::function<void()> task);

  float getPixelDensity() { return _pixelDensity; }

  sk_sp<SkImage> takeScreenshotFromViewTag(size_t tag);

  void setOnNotifyDrawLoop(const std::function<void(void)> &callback) {
    _onNotifyDrawLoop = callback;
  }

private:
  friend HybridBase;
  jni::global_ref<JniPlatformContext::javaobject> javaPart_;

  float _pixelDensity;

  std::function<void(void)> _onNotifyDrawLoop;

  std::queue<std::function<void()>> _taskCallbacks;

  std::shared_ptr<std::mutex> _taskMutex;

  explicit JniPlatformContext(
      jni::alias_ref<JniPlatformContext::jhybridobject> jThis,
      const float pixelDensity)
      : _taskMutex(std::make_shared<std::mutex>()),
        javaPart_(jni::make_global(jThis)), _pixelDensity(pixelDensity) {}
};
} // namespace RNSkia