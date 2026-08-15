#pragma once

#include "../ExpoHeader.pch"
#include "../types/FrontendConverter.h"

#include <worklets/SharedItems/Synchronizable.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

/**
 * Converter from a worklets `Synchronizable` js value to
 * [expo.modules.kotlin.jni.worklets.Serializable].
 */
class SynchronizableFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

} // namespace expo
