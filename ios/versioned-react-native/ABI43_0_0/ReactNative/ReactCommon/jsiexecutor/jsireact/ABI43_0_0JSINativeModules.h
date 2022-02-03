/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <ABI43_0_0cxxreact/ABI43_0_0ModuleRegistry.h>
#include <folly/Optional.h>
#include <ABI43_0_0jsi/ABI43_0_0jsi.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/**
 * Holds and creates JS representations of the modules in ModuleRegistry
 */
class JSINativeModules {
 public:
  explicit JSINativeModules(std::shared_ptr<ModuleRegistry> moduleRegistry);
  jsi::Value getModule(jsi::Runtime &rt, const jsi::PropNameID &name);
  void reset();

 private:
  folly::Optional<jsi::Function> m_genNativeModuleJS;
  std::shared_ptr<ModuleRegistry> m_moduleRegistry;
  std::unordered_map<std::string, jsi::Object> m_objects;

  folly::Optional<jsi::Object> createModule(
      jsi::Runtime &rt,
      const std::string &name);
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
