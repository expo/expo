/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI44_0_0React/ABI44_0_0renderer/components/iospicker/PickerEventEmitter.h>
#include <ABI44_0_0React/ABI44_0_0renderer/components/iospicker/PickerProps.h>
#include <ABI44_0_0React/ABI44_0_0renderer/components/iospicker/PickerState.h>
#include <ABI44_0_0React/ABI44_0_0renderer/components/view/ConcreteViewShadowNode.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

extern const char PickerComponentName[];

/*
 * `ShadowNode` for <Picker> component.
 */
class PickerShadowNode final : public ConcreteViewShadowNode<
                                   PickerComponentName,
                                   PickerProps,
                                   PickerEventEmitter,
                                   PickerState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
