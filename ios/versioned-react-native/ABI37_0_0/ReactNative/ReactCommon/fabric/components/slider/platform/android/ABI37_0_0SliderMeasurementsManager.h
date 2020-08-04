/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0React/core/ConcreteComponentDescriptor.h>
#include <ABI37_0_0React/core/LayoutConstraints.h>
#include <ABI37_0_0React/utils/ContextContainer.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

/**
 * Class that manages slider measurements across platforms.
 * On iOS it is a noop, since the height is passed in from JS on iOS only.
 */
class SliderMeasurementsManager {
 public:
  SliderMeasurementsManager(const ContextContainer::Shared &contextContainer)
      : contextContainer_(contextContainer) {}

  static inline bool shouldMeasureSlider() {
    return true;
  }

  Size measure(LayoutConstraints layoutConstraints) const;

 private:
  const ContextContainer::Shared contextContainer_;
  mutable std::mutex mutex_;
  mutable bool hasBeenMeasured_ = false;
  mutable Size cachedMeasurement_{};
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
