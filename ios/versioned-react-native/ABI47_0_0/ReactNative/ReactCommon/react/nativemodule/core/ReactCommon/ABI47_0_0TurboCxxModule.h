/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <ABI47_0_0cxxreact/ABI47_0_0CxxModule.h>

#include "ABI47_0_0TurboModule.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/**
 * A helper class to convert the legacy CxxModule instance to a TurboModule
 * instance. This should be used only for migration purpose (to TurboModule),
 * since it's not very performant due to a lot of back-and-forth value
 * conversions between folly::dynamic and jsi::Value.
 */
class JSI_EXPORT TurboCxxModule : public TurboModule {
 public:
  TurboCxxModule(
      std::unique_ptr<ABI47_0_0facebook::xplat::module::CxxModule> cxxModule,
      std::shared_ptr<CallInvoker> jsInvoker);

  ABI47_0_0facebook::jsi::Value get(
      ABI47_0_0facebook::jsi::Runtime &runtime,
      const ABI47_0_0facebook::jsi::PropNameID &propName) override;

  std::vector<ABI47_0_0facebook::jsi::PropNameID> getPropertyNames(
      ABI47_0_0facebook::jsi::Runtime &runtime) override;

  jsi::Value invokeMethod(
      jsi::Runtime &runtime,
      const std::string &methodName,
      const jsi::Value *args,
      size_t count);

 private:
  std::vector<ABI47_0_0facebook::xplat::module::CxxModule::Method> cxxMethods_;
  std::unique_ptr<ABI47_0_0facebook::xplat::module::CxxModule> cxxModule_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
