// Copyright 2015-present 650 Industries. All rights reserved.

#include <fbjni/fbjni.h>

#include "SQLite3Wrapper.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(
      vm, [] { expo::SQLite3Wrapper::registerNatives(); });
}
