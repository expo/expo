#pragma once

#include <fbjni/fbjni.h>
#include <string>

namespace jni = facebook::jni;

namespace expo {

class BSPatch : public jni::HybridClass<BSPatch> {
public:
  static constexpr auto kJavaDescriptor = "Lexpo/modules/updates/BSPatch;";

  static void registerNatives();

  static jint applyPatch(jni::alias_ref<jni::JClass>,
                        jni::alias_ref<jni::JString> oldFilePath,
                        jni::alias_ref<jni::JString> newFilePath,
                        jni::alias_ref<jni::JString> patchFilePath);

private:
  explicit BSPatch(jni::alias_ref<BSPatch::jhybridobject> jThis)
      : javaPart_(jni::make_global(jThis)) {}

  static jni::local_ref<jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis);

private:
  friend HybridBase;

  jni::global_ref<BSPatch::javaobject> javaPart_;
};

}