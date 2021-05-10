/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/components/unimplementedview/UnimplementedViewShadowNode.h>
#include <ABI41_0_0React/core/ConcreteComponentDescriptor.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * Descriptor for <UnimplementedView> component.
 */
class UnimplementedViewComponentDescriptor final
    : public ConcreteComponentDescriptor<UnimplementedViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  /*
   * Returns `name` and `handle` based on a `flavor`, not on static data from
   * `UnimplementedViewShadowNode`.
   */
  ComponentHandle getComponentHandle() const override;
  ComponentName getComponentName() const override;

  /*
   * In addtion to base implementation, stores a component name inside cloned
   * `Props` object.
   */
  Props::Shared cloneProps(Props::Shared const &props, RawProps const &rawProps)
      const override;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
