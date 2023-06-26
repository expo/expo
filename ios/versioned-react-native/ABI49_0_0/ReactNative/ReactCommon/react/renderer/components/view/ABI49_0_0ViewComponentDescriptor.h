/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ConcreteComponentDescriptor.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class ViewComponentDescriptor
    : public ConcreteComponentDescriptor<ViewShadowNode> {
 public:
  ViewComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<ViewShadowNode>(parameters) {}
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
