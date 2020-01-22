/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI36_0_0ReactCommon/ABI36_0_0BridgeJSCallInvoker.h>
#include <ABI36_0_0cxxreact/ABI36_0_0Instance.h>

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

BridgeJSCallInvoker::BridgeJSCallInvoker(std::weak_ptr<Instance> ABI36_0_0ReactInstance)
    : ABI36_0_0ReactInstance_(ABI36_0_0ReactInstance) {}

void BridgeJSCallInvoker::invokeAsync(std::function<void()> &&func) {
  auto instance = ABI36_0_0ReactInstance_.lock();
  if (instance == nullptr) {
    return;
  }
  instance->invokeAsync(std::move(func));
}

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook
