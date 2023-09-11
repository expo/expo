/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/components/inputaccessory/InputAccessoryState.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/rncore/EventEmitters.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/rncore/Props.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/view/ConcreteViewShadowNode.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

extern const char InputAccessoryComponentName[];

/*
 * `ShadowNode` for <InputAccessory> component.
 */
class InputAccessoryShadowNode final : public ConcreteViewShadowNode<
                                           InputAccessoryComponentName,
                                           InputAccessoryProps,
                                           InputAccessoryEventEmitter,
                                           InputAccessoryState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
