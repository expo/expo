/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <ABI37_0_0ReactCommon/ABI37_0_0JSCallInvoker.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class Instance;

/**
 * A native-to-JS call invoker that uses the bridge ('Instance').
 * It guarantees that any calls from any thread are queued on the right JS
 * thread.
 *
 * For now, this is a thin-wrapper around existing bridge. Eventually,
 * it should be consolidated with Fabric implementation so there's only one
 * API to call JS from native, whether synchronously or asynchronously.
 * Also, this class should not depend on `Instance` in the future.
 */
class BridgeJSCallInvoker : public JSCallInvoker {
 public:
  BridgeJSCallInvoker(std::weak_ptr<Instance> ABI37_0_0ReactInstance);

  void invokeAsync(std::function<void()> &&func) override;
  // TODO: add sync support

 private:
  std::weak_ptr<Instance> ABI37_0_0ReactInstance_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
