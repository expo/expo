#pragma once

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/CallInvokerHolder.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <memory>

#include <JniPlatformContext.h>
#include <RNSkAndroidPlatformContext.h>
#include <RNSkLog.h>
#include <RNSkManager.h>

namespace RNSkia {

class RNSkManager;

namespace jsi = facebook::jsi;

using JSCallInvokerHolder =
    jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>;

using JavaPlatformContext = jni::alias_ref<JniPlatformContext::javaobject>;

class JniSkiaManager : public jni::HybridClass<JniSkiaManager> {
public:
  static auto constexpr kJavaDescriptor =
      "Lcom/shopify/reactnative/skia/SkiaManager;";
  static auto constexpr TAG = "ReactNativeSkia";

  static jni::local_ref<jni::HybridClass<JniSkiaManager>::jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis, jlong jsContext,
             JSCallInvokerHolder jsCallInvokerHolder,
             JavaPlatformContext platformContext);

  static void registerNatives();

  JniSkiaManager() {}
  ~JniSkiaManager() { RNSkLogger::logToConsole("JniSkiaManager dtor"); }

  explicit JniSkiaManager(
      jni::alias_ref<JniSkiaManager::jhybridobject> jThis,
      jsi::Runtime *runtime,
      std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
      JniPlatformContext *platformContext)
      : _javaPart(jni::make_global(jThis)), _jsRuntime(runtime),
        _jsCallInvoker(jsCallInvoker),
        _context(std::make_shared<RNSkAndroidPlatformContext>(
            platformContext, runtime, jsCallInvoker)) {}

  std::shared_ptr<RNSkAndroidPlatformContext> getPlatformContext() {
    return _context;
  }
  std::shared_ptr<RNSkManager> getSkiaManager() { return _skManager; }

  void invalidate() {
    _context->stopDrawLoop();
    _context->notifyDrawLoop(true);
    _skManager = nullptr;
    _context = nullptr;
  }

private:
  friend HybridBase;

  std::shared_ptr<RNSkManager> _skManager;

  jni::global_ref<JniSkiaManager::javaobject> _javaPart;

  jsi::Runtime *_jsRuntime;
  std::shared_ptr<facebook::react::CallInvoker> _jsCallInvoker;
  std::shared_ptr<RNSkAndroidPlatformContext> _context;

  void initializeRuntime();
};

} // namespace RNSkia
