/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI44_0_0React/ABI44_0_0renderer/components/iospicker/PickerShadowNode.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/ConcreteComponentDescriptor.h>

/*
 * Descriptor for <Picker> component.
 */
namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class PickerComponentDescriptor final
    : public ConcreteComponentDescriptor<PickerShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
