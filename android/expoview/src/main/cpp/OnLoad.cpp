#include <fbjni/fbjni.h>

#include "NativeProxy.h"
#include "AndroidScheduler.h"
#include "Logger.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    reanimated::NativeProxy::registerNatives();
    reanimated::AnimationFrameCallback::registerNatives();
    reanimated::EventHandler::registerNatives();
    reanimated::AndroidScheduler::registerNatives();
  });
}