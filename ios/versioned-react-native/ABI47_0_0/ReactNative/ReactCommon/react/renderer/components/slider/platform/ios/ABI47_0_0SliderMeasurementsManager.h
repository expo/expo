/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/core/ConcreteComponentDescriptor.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/LayoutConstraints.h>
#include <ABI47_0_0React/ABI47_0_0utils/ContextContainer.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/**
 * Class that manages slider measurements across platforms.
 * On iOS it is a noop, since the height is passed in from JS on iOS only.
 */
class SliderMeasurementsManager {
 public:
  SliderMeasurementsManager(ContextContainer::Shared const &contextContainer) {}

  static inline bool shouldMeasureSlider() {
    return false;
  }

  Size measure(SurfaceId surfaceId, LayoutConstraints layoutConstraints) const;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
