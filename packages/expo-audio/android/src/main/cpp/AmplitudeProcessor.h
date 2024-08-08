#pragma once

#include <fbjni/fbjni.h>

namespace jni = facebook::jni;

namespace expo {

class AmplitudeProcessor : public jni::HybridClass<AmplitudeProcessor> {
public:
  static constexpr auto kJavaDescriptor =
    "Lexpo/modules/audio/AmplitudeProcessor;";
  static auto constexpr TAG = "AmplitudeProcessorNative";

  static void registerNatives();

  jni::local_ref<jni::JArrayFloat>
  extractAmplitudesNative(jni::alias_ref<jni::JArrayByte> chunk, jint size);

private:
  static jni::local_ref<jhybriddata>
  initHybrid(jni::alias_ref<jhybridobject> jThis);

  friend HybridBase;
};

} // namespace expo
