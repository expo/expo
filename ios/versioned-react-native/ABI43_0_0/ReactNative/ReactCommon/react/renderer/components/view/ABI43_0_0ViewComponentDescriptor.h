/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/view/ViewShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ConcreteComponentDescriptor.h>
#include "ABI43_0_0ViewProps.h"
#include "ABI43_0_0ViewPropsInterpolation.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class ViewComponentDescriptor
    : public ConcreteComponentDescriptor<ViewShadowNode> {
 public:
  ViewComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor<ViewShadowNode>(parameters) {}

  virtual SharedProps interpolateProps(
      float animationProgress,
      const SharedProps &props,
      const SharedProps &newProps) const override {
    SharedProps interpolatedPropsShared = cloneProps(newProps, {});

    interpolateViewProps(
        animationProgress, props, newProps, interpolatedPropsShared);

    return interpolatedPropsShared;
  };
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
