/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ConcreteComponentDescriptor.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class ViewComponentDescriptor
    : public ConcreteComponentDescriptor<ViewShadowNode> {
 public:
  ViewComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<ViewShadowNode>(parameters) {}
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
