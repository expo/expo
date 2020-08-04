/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI37_0_0ReactCommon/ABI37_0_0BridgeJSCallInvoker.h>
#include <ABI37_0_0cxxreact/ABI37_0_0Instance.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

BridgeJSCallInvoker::BridgeJSCallInvoker(std::weak_ptr<Instance> ABI37_0_0ReactInstance)
    : ABI37_0_0ReactInstance_(ABI37_0_0ReactInstance) {}

void BridgeJSCallInvoker::invokeAsync(std::function<void()> &&func) {
  auto instance = ABI37_0_0ReactInstance_.lock();
  if (instance == nullptr) {
    return;
  }
  instance->invokeAsync(std::move(func));
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
