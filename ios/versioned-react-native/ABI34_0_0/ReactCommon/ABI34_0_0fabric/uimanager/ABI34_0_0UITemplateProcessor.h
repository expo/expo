/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>

#include <ReactABI34_0_0/config/ReactABI34_0_0NativeConfig.h>
#include <ReactABI34_0_0/core/ShadowNode.h>
#include <ReactABI34_0_0/uimanager/ComponentDescriptorRegistry.h>
#include <ReactABI34_0_0/uimanager/UIManagerDelegate.h>

namespace facebook {
namespace ReactABI34_0_0 {

// Temporary NativeModuleRegistry definition
using NativeModuleCallFn =
    std::function<folly::dynamic(const std::string &, const folly::dynamic &)>;

class NativeModuleRegistry {
 public:
  void registerModule(
      const std::string &moduleName,
      NativeModuleCallFn callFn) {
    modules_.emplace(moduleName, callFn);
  }

  folly::dynamic call(
      const std::string &moduleName,
      const std::string &methodName,
      const folly::dynamic &args) const {
    return modules_.at(moduleName)(methodName, args);
  }

 private:
  std::unordered_map<std::string, NativeModuleCallFn> modules_;
};

class UITemplateProcessor {
 public:
  static SharedShadowNode buildShadowTree(
      const std::string &jsonStr,
      int rootTag,
      const folly::dynamic &params,
      const ComponentDescriptorRegistry &componentDescriptorRegistry,
      const NativeModuleRegistry &nativeModuleRegistry,
      const std::shared_ptr<const ReactABI34_0_0NativeConfig> ReactABI34_0_0NativeConfig);

 private:
  static SharedShadowNode runCommand(
      const folly::dynamic &command,
      Tag rootTag,
      std::vector<SharedShadowNode> &nodes,
      std::vector<folly::dynamic> &registers,
      const ComponentDescriptorRegistry &componentDescriptorRegistry,
      const NativeModuleRegistry &nativeModuleRegistry,
      const std::shared_ptr<const ReactABI34_0_0NativeConfig> ReactABI34_0_0NativeConfig);
};
} // namespace ReactABI34_0_0
} // namespace facebook
