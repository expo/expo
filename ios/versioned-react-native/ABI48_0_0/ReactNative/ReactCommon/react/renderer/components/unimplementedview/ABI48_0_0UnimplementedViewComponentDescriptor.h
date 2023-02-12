/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/components/unimplementedview/UnimplementedViewShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ConcreteComponentDescriptor.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/PropsParserContext.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

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
  Props::Shared cloneProps(
      PropsParserContext const &context,
      Props::Shared const &props,
      RawProps const &rawProps) const override;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
