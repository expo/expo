/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <ABI43_0_0ReactCommon/ABI43_0_0TurboModule.h>
#include <ABI43_0_0jsi/ABI43_0_0jsi.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class JSCallInvoker;

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
      const TurboModuleProviderFunctionType &&moduleProvider);

  TurboModuleBinding(const TurboModuleProviderFunctionType &&moduleProvider);
  virtual ~TurboModuleBinding();

  /**
   * Get an TurboModule instance for the given module name.
   */
  std::shared_ptr<TurboModule> getModule(
      const std::string &name,
      const jsi::Value *schema);

 private:
  /**
   * A lookup function exposed to JS to get an instance of a TurboModule
   * for the given name.
   */
  jsi::Value jsProxy(
      jsi::Runtime &runtime,
      const jsi::Value &thisVal,
      const jsi::Value *args,
      size_t count);

  TurboModuleProviderFunctionType moduleProvider_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
