#include <fbjni/fbjni.h>

#include "AndroidScheduler.h"
#include "LayoutAnimations.h"
#include "Logger.h"
#include "NativeProxy.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    reanimated::NativeProxy::registerNatives();
    reanimated::AnimationFrameCallback::registerNatives();
    reanimated::EventHandler::registerNatives();
    reanimated::AndroidScheduler::registerNatives();
    reanimated::LayoutAnimations::registerNatives();
    reanimated::SensorSetter::registerNatives();
  });
}
