/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/modal/ModalHostViewState.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/rncore/EventEmitters.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/rncore/Props.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ConcreteViewShadowNode.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

extern const char ModalHostViewComponentName[];

/*
 * `ShadowNode` for <ModalHostView> component.
 */
class ModalHostViewShadowNode final : public ConcreteViewShadowNode<
                                          ModalHostViewComponentName,
                                          ModalHostViewProps,
                                          ModalHostViewEventEmitter,
                                          ModalHostViewState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::RootNodeKind);
    return traits;
  }
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
