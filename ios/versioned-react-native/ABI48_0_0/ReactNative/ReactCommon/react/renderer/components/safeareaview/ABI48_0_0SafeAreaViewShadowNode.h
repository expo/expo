/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/components/rncore/EventEmitters.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/rncore/Props.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/safeareaview/SafeAreaViewState.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ConcreteViewShadowNode.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

extern const char SafeAreaViewComponentName[];

/*
 * `ShadowNode` for <SafeAreaView> component.
 */
class SafeAreaViewShadowNode final : public ConcreteViewShadowNode<
                                         SafeAreaViewComponentName,
                                         SafeAreaViewProps,
                                         ViewEventEmitter,
                                         SafeAreaViewState> {
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

 public:
  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::DirtyYogaNode);
    return traits;
  }
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
