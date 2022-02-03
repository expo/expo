/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/progressbar/conversions.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/rncore/Props.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ConcreteComponentDescriptor.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/LayoutConstraints.h>
#include <ABI43_0_0React/ABI43_0_0utils/ContextContainer.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class AndroidProgressBarMeasurementsManager {
 public:
  AndroidProgressBarMeasurementsManager(
      const ContextContainer::Shared &contextContainer)
      : contextContainer_(contextContainer) {}

  Size measure(
      SurfaceId surfaceId,
      AndroidProgressBarProps props,
      LayoutConstraints layoutConstraints) const;

 private:
  const ContextContainer::Shared contextContainer_;
  mutable std::mutex mutex_;
  mutable bool hasBeenMeasured_ = false;
  mutable Size cachedMeasurement_{};
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
