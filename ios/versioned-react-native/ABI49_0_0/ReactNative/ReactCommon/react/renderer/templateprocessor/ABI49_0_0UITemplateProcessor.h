/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>

#include <ABI49_0_0React/config/ABI49_0_0ReactNativeConfig.h>
#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorRegistry.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManagerDelegate.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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
  static ShadowNode::Shared buildShadowTree(
      const std::string &jsonStr,
      int surfaceId,
      const folly::dynamic &params,
      const ComponentDescriptorRegistry &componentDescriptorRegistry,
      const NativeModuleRegistry &nativeModuleRegistry,
      std::shared_ptr<const ABI49_0_0ReactNativeConfig> const &ABI49_0_0ReactNativeConfig);

 private:
  static ShadowNode::Shared runCommand(
      const folly::dynamic &command,
      Tag surfaceId,
      std::vector<ShadowNode::Shared> &nodes,
      std::vector<folly::dynamic> &registers,
      const ComponentDescriptorRegistry &componentDescriptorRegistry,
      const NativeModuleRegistry &nativeModuleRegistry,
      std::shared_ptr<const ABI49_0_0ReactNativeConfig> const &ABI49_0_0ReactNativeConfig);
};
} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
