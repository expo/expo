#include <fbjni/fbjni.h>
#include "AmplitudeProcessor.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    expo::AmplitudeProcessor::registerNatives();
  });
}
