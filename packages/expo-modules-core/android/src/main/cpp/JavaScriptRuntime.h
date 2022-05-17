// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jsi/jsi.h>

namespace expo {

namespace jsi = facebook::jsi;

class JavaScriptRuntime {
public:
  JavaScriptRuntime(jsi::Runtime *runtime);

  jsi::Runtime *get();

private:
  jsi::Runtime *runtime;
};
} // namespace expo
