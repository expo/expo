// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptRuntime.h"

namespace expo {

namespace jsi = facebook::jsi;

JavaScriptRuntime::JavaScriptRuntime(jsi::Runtime *runtime) : runtime(runtime) {}

jsi::Runtime* JavaScriptRuntime::get() {
  return runtime;
}
} // namespace expo
