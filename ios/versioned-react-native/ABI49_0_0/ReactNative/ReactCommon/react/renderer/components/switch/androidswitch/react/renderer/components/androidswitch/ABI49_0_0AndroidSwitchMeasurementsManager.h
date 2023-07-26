/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0ConcreteComponentDescriptor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutConstraints.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class AndroidSwitchMeasurementsManager {
 public:
  AndroidSwitchMeasurementsManager(
      const ContextContainer::Shared &contextContainer)
      : contextContainer_(contextContainer) {}

  Size measure(SurfaceId surfaceId, LayoutConstraints layoutConstraints) const;

 private:
  const ContextContainer::Shared contextContainer_;
  mutable std::mutex mutex_;
  mutable bool hasBeenMeasured_ = false;
  mutable Size cachedMeasurement_{};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
