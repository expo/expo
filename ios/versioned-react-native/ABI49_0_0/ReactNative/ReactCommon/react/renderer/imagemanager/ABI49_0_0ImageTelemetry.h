/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#include <ABI49_0_0React/utils/ABI49_0_0Telemetry.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * Represents telemetry data associated with a image request
 * where the willRequestUrlTime is the time at ImageTelemetry's creation.
 */
class ImageTelemetry final {
 public:
  ImageTelemetry(SurfaceId const surfaceId) : surfaceId_(surfaceId) {
    willRequestUrlTime_ = telemetryTimePointNow();
  }

  TelemetryTimePoint getWillRequestUrlTime() const;

  SurfaceId getSurfaceId() const;

 private:
  TelemetryTimePoint willRequestUrlTime_;

  const SurfaceId surfaceId_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
