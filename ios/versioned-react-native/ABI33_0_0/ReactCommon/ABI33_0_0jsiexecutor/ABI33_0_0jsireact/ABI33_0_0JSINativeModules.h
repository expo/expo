//  Copyright (c) Facebook, Inc. and its affiliates.
//
// This source code is licensed under the MIT license found in the
 // LICENSE file in the root directory of this source tree.

#pragma once

#include <memory>
#include <string>

#include <cxxReactABI33_0_0/ABI33_0_0ModuleRegistry.h>
#include <folly/Optional.h>
#include <ABI33_0_0jsi/ABI33_0_0jsi.h>

namespace facebook {
namespace ReactABI33_0_0 {

/**
 * Holds and creates JS representations of the modules in ModuleRegistry
 */
class ABI33_0_0JSINativeModules {
 public:
  explicit ABI33_0_0JSINativeModules(std::shared_ptr<ModuleRegistry> moduleRegistry);
  ABI33_0_0jsi::Value getModule(ABI33_0_0jsi::Runtime& rt, const ABI33_0_0jsi::PropNameID& name);
  void reset();

 private:
  folly::Optional<ABI33_0_0jsi::Function> m_genNativeModuleJS;
  std::shared_ptr<ModuleRegistry> m_moduleRegistry;
  std::unordered_map<std::string, ABI33_0_0jsi::Object> m_objects;

  folly::Optional<ABI33_0_0jsi::Object> createModule(
      ABI33_0_0jsi::Runtime& rt,
      const std::string& name);
};

} // namespace ReactABI33_0_0
} // namespace facebook
