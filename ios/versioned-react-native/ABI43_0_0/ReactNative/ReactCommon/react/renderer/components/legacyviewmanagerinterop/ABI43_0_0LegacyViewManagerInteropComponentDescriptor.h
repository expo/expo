/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ConcreteComponentDescriptor.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class LegacyViewManagerInteropComponentDescriptor final
    : public ConcreteComponentDescriptor<LegacyViewManagerInteropShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  LegacyViewManagerInteropComponentDescriptor(
      ComponentDescriptorParameters const &parameters);
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

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
