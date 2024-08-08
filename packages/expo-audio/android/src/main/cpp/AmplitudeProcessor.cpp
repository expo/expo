#include "AmplitudeProcessor.h"

namespace jni = facebook::jni;

namespace expo {

// static
void AmplitudeProcessor::registerNatives() {
  registerHybrid({
   makeNativeMethod("initHybrid", AmplitudeProcessor::initHybrid),
   makeNativeMethod("extractAmplitudesNative",
                    AmplitudeProcessor::extractAmplitudesNative)
 });
}

jni::local_ref<AmplitudeProcessor::jhybriddata>
AmplitudeProcessor::initHybrid(const jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

jni::local_ref<jni::JArrayFloat>
AmplitudeProcessor::extractAmplitudesNative(jni::alias_ref<jni::JArrayByte> chunk, jint size) {
  auto outputArray = jni::JArrayFloat::newArray(size);
  auto nativeOutput = outputArray->pin();

  std::vector<uint8_t> buffer(size);
  chunk->getRegion(0, size, reinterpret_cast<int8_t *>(buffer.data()));
  for (size_t ii = 0; ii < size; ii++) {
    double frame = (static_cast<double>(buffer[ii]) - 128) / 128.0;
    nativeOutput[ii] = frame;
  }

  nativeOutput.release();
  return outputArray;
}

} // namespace expo
