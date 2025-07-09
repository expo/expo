// Copyright 2015-present 650 Industries. All rights reserved.

#include <fbjni/fbjni.h>

#include "NativeDatabaseBinding.h"
#include "NativeSessionBinding.h"
#include "NativeStatementBinding.h"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    expo::NativeDatabaseBinding::registerNatives();
    expo::NativeSessionBinding::registerNatives();
    expo::NativeStatementBinding::registerNatives();
  });
}
