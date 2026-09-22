// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "RuntimeHolder.h"

#include <jni.h>

// Registers the JNI bindings of the test-only `expo-modules-core-tests` library.
// It is built from source only for the package's own instrumentation tests, so the
// prebuilt `expo-modules-core` library can be used there too.
JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    expo::RuntimeHolder::registerNatives();
  });
}
