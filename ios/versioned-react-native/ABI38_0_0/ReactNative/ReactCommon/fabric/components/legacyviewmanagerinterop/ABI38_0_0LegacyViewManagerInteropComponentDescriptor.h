/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI38_0_0React/components/legacyviewmanagerinterop/LegacyViewManagerInteropShadowNode.h>
#include <ABI38_0_0React/core/ConcreteComponentDescriptor.h>

namespace ABI38_0_0facebook {
namespace ABI38_0_0React {

class LegacyViewManagerInteropComponentDescriptor final
    : public ConcreteComponentDescriptor<LegacyViewManagerInteropShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  LegacyViewManagerInteropComponentDescriptor(
      EventDispatcher::Weak const &eventDispatcher,
      ContextContainer::Shared const &contextContainer = {},
      ComponentDescriptor::Flavor const &flavor = {});
  /*
   * Returns `name` and `handle` based on a `flavor`, not on static data from
   * `LegacyViewManagerInteropShadowNode`.
   */
  ComponentHandle getComponentHandle() const override;
  ComponentName getComponentName() const override;

 protected:
  void adopt(ShadowNode::Unshared shadowNode) const override;

 private:
  std::shared_ptr<void> const _coordinator;
};

} // namespace ABI38_0_0React
} // namespace ABI38_0_0facebook
