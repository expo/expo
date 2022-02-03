/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0ImageTelemetry.h"

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

void ImageTelemetry::willRequestUrl() {
  assert(willRequestUrlTime_ == kTelemetryUndefinedTimePoint);
  willRequestUrlTime_ = telemetryTimePointNow();
}

SurfaceId ImageTelemetry::getSurfaceId() const {
  return surfaceId_;
}

TelemetryTimePoint ImageTelemetry::getWillRequestUrlTime() const {
  assert(willRequestUrlTime_ != kTelemetryUndefinedTimePoint);
  return willRequestUrlTime_;
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
