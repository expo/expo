// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include <jni.h>
#include <fbjni/fbjni.h>
#include "JAVManager.h"
#include "JPlayerData.h"
#include <android/log.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    expo::av::JAVManager::registerNatives();
    expo::av::JPlayerData::registerNatives();
  });
}
