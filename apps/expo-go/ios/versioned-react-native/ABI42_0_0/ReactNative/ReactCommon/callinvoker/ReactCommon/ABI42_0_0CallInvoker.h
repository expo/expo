/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/**
 * An interface for a generic native-to-JS call invoker. See BridgeJSCallInvoker
 * for an implementation.
 */
class CallInvoker {
 public:
  virtual void invokeAsync(std::function<void()> &&func) = 0;
  virtual void invokeSync(std::function<void()> &&func) = 0;
  virtual ~CallInvoker() {}
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
