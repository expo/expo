// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class BSPatch : public jni::JavaClass<BSPatch> {
public:
  static constexpr auto kJavaDescriptor = "Lexpo/modules/updates/BSPatch;";

  static void registerNatives();

  static jint applyPatch(jni::alias_ref<jni::JClass>,
    jni::alias_ref<jni::JString> oldFilePath,
    jni::alias_ref<jni::JString> newFilePath,
    jni::alias_ref<jni::JString> patchFilePath);
};

}
