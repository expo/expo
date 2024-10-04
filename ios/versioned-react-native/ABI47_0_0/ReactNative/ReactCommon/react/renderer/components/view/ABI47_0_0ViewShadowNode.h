/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/components/view/ConcreteViewShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/view/ViewProps.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

extern const char ViewComponentName[];

/**
 * Implementation of the ViewProps that propagates feature flag.
 */
class ViewShadowNodeProps final : public ViewProps {
 public:
  ViewShadowNodeProps() = default;
  ViewShadowNodeProps(
      const PropsParserContext &context,
      ViewShadowNodeProps const &sourceProps,
      RawProps const &rawProps);
};

/*
 * `ShadowNode` for <View> component.
 */
class ViewShadowNode final : public ConcreteViewShadowNode<
                                 ViewComponentName,
                                 ViewShadowNodeProps,
                                 ViewEventEmitter> {
 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::View);
    return traits;
  }

  ViewShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits);

  ViewShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment);

 private:
  void initialize() noexcept;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
