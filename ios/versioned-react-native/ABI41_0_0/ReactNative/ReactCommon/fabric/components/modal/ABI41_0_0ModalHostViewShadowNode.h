/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/components/modal/ModalHostViewState.h>
#include <ABI41_0_0React/components/rncore/EventEmitters.h>
#include <ABI41_0_0React/components/rncore/Props.h>
#include <ABI41_0_0React/components/view/ConcreteViewShadowNode.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

extern const char ModalHostViewComponentName[];

/*
 * `ShadowNode` for <Slider> component.
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

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
