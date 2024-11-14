// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <folly/dynamic.h>

#include "JSDecorator.h"

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {

class JSConstantsDecorator : public JSDecorator {
public:
  void registerConstants(jni::alias_ref<react::NativeMap::javaobject> constants);

  void decorate(
    jsi::Runtime &runtime,
    jsi::Object &jsObject
  ) override;

private:
  /**
  * A constants map.
  */
  std::unordered_map<std::string, folly::dynamic> constants;
};

} // namespace expo
