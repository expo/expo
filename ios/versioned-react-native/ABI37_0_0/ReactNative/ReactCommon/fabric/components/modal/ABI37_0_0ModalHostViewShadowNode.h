/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0React/components/modal/ModalHostViewState.h>
#include <ABI37_0_0React/components/rncore/EventEmitters.h>
#include <ABI37_0_0React/components/rncore/Props.h>
#include <ABI37_0_0React/components/view/ConcreteViewShadowNode.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

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
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
