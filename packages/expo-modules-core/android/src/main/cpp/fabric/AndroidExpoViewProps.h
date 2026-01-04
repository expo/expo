#pragma once

#include "ExpoViewProps.h"

#include <fbjni/fbjni.h>
#include <react/renderer/core/RawValue.h>

namespace react = facebook::react;
namespace jni = facebook::jni;

namespace expo {

class AndroidExpoViewProps : public ExpoViewProps {
public:
  AndroidExpoViewProps() = default;

  AndroidExpoViewProps(
    const facebook::react::PropsParserContext &context,
    const AndroidExpoViewProps &sourceProps,
    const facebook::react::RawProps &rawProps,
    const std::function<bool(const std::string &)> &filterObjectKeys = nullptr
  );

  ~AndroidExpoViewProps() override;

  mutable jni::global_ref <jni::JMap<jstring, jobject>> statePropsDiff;
};

} // expo
