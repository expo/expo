/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0NativeComponentRegistryBinding.h"

#include <stdexcept>
#include <string>

using namespace ABI48_0_0facebook;

namespace ABI48_0_0facebook::ABI48_0_0React {

/**
 * Public API to install the NativeComponentRegistryBinding.
 */
NativeComponentRegistryBinding::NativeComponentRegistryBinding(
    const HasComponentProviderFunctionType &&hasComponentProvider)
    : hasComponentProvider_(hasComponentProvider) {}

void NativeComponentRegistryBinding::install(
    jsi::Runtime &runtime,
    const HasComponentProviderFunctionType &&hasComponentProvider) {
  runtime.global().setProperty(
      runtime,
      "__nativeComponentRegistry__hasComponent",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(
              runtime, "__nativeComponentRegistry__hasComponent"),
          1,
          [binding = std::make_shared<NativeComponentRegistryBinding>(
               std::move(hasComponentProvider))](
              jsi::Runtime &rt,
              const jsi::Value &thisVal,
              const jsi::Value *args,
              size_t count) {
            return binding->jsProxy(rt, thisVal, args, count);
          }));
}

bool NativeComponentRegistryBinding::hasComponent(const std::string &name) {
  return hasComponentProvider_(name);
}

jsi::Value NativeComponentRegistryBinding::jsProxy(
    jsi::Runtime &runtime,
    const jsi::Value & /*thisVal*/,
    const jsi::Value *args,
    size_t count) {
  if (count != 1) {
    throw std::invalid_argument(
        "__nativeComponentRegistry__hasComponent must be called with 1 argument");
  }
  std::string moduleName = args[0].getString(runtime).utf8(runtime);
  jsi::Value nullSchema = jsi::Value::undefined();

  bool result = hasComponent(moduleName);

  return {result};
}

} // namespace ABI48_0_0facebook::ABI48_0_0React
