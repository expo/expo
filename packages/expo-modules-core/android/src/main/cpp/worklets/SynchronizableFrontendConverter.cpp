#include "SynchronizableFrontendConverter.h"

#include "Serializable.h"
#include "../JSIContext.h"

namespace jsi = facebook::jsi;

namespace expo {

jobject SynchronizableFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  JSIContext *jsiContext = getJSIContext(rt);

  auto worklet = worklets::extractSerializableOrThrow(rt, value);
  return Serializable::newInstance(
    jsiContext,
    worklet
  ).release();
}

bool SynchronizableFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  try {
    // TODO(@lukmccall): find a better way to check this without throwing exception
    (void)worklets::extractSerializableOrThrow(rt, value);
    return true;
  } catch (...) {
    return false;
  }
}

} // namespace expo
