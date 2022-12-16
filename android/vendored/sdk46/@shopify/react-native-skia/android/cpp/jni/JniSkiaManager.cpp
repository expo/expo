#include "JniSkiaManager.h"

#include <android/log.h>
#include <jni.h>
#include <string>
#include <utility>

#include "JniSkiaDrawView.h"
#include <RNSkManager.h>

namespace RNSkia {

using namespace facebook;

// JNI binding
void JniSkiaManager::registerNatives() {
    registerHybrid({
        makeNativeMethod("initHybrid", JniSkiaManager::initHybrid),
        makeNativeMethod(
            "initializeRuntime", JniSkiaManager::initializeRuntime),
        makeNativeMethod("registerSkiaView", JniSkiaManager::registerSkiaView),
        makeNativeMethod(
            "unregisterSkiaView", JniSkiaManager::unregisterSkiaView),
        makeNativeMethod(
            "invalidate", JniSkiaManager::invalidate),
    });
}

// JNI init
jni::local_ref<jni::HybridClass<JniSkiaManager>::jhybriddata> JniSkiaManager::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jlong jsContext,
    JSCallInvokerHolder jsCallInvokerHolder,
    JavaPlatformContext skiaContext) {

    // cast from JNI hybrid objects to C++ instances
    return makeCxxInstance(
        jThis,
        reinterpret_cast<jsi::Runtime *>(jsContext),
        jsCallInvokerHolder->cthis()->getCallInvoker(),
        skiaContext->cthis());
}

void JniSkiaManager::initializeRuntime() {
    // Create the cross platform skia manager
    _skManager = std::make_shared<RNSkManager>(_jsRuntime, _jsCallInvoker, _context);
}

void JniSkiaManager::registerSkiaView(int viewTag, JniSkiaDrawView *skiaView) {
    _skManager->registerSkiaDrawView(viewTag, skiaView->getDrawViewImpl());
}

void JniSkiaManager::unregisterSkiaView(int viewTag) {
    _skManager->unregisterSkiaDrawView(viewTag);
}

} // namespace RNSkia
