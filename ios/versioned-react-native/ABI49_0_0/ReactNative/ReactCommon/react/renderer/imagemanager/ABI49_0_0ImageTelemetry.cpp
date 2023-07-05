/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ImageTelemetry.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

SurfaceId ImageTelemetry::getSurfaceId() const {
  return surfaceId_;
}

TelemetryTimePoint ImageTelemetry::getWillRequestUrlTime() const {
  return willRequestUrlTime_;
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
