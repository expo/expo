/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <ABI49_0_0ReactCommon/ABI49_0_0TurboModule.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

enum class TurboModuleBindingMode : uint8_t {
  HostObject = 0,
  Prototype = 1,
  Eager = 2,
};

/**
 * Represents the JavaScript binding for the TurboModule system.
 */
class TurboModuleBinding {
 public:
  /*
   * Installs TurboModuleBinding into JavaScript runtime.
   * Thread synchronization must be enforced externally.
   */
  static void install(
      jsi::Runtime &runtime,
      TurboModuleBindingMode bindingMode,
      TurboModuleProviderFunctionType &&moduleProvider);

 private:
  TurboModuleBinding(
      TurboModuleBindingMode bindingMode,
      TurboModuleProviderFunctionType &&moduleProvider);
  virtual ~TurboModuleBinding();

  /**
   * A lookup function exposed to JS to get an instance of a TurboModule
   * for the given name.
   */
  jsi::Value getModule(jsi::Runtime &runtime, const std::string &moduleName)
      const;

  TurboModuleBindingMode bindingMode_;
  TurboModuleProviderFunctionType moduleProvider_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
