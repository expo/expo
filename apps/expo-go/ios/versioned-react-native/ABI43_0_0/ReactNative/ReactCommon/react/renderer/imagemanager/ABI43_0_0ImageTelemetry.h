/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/core/ABI43_0_0ReactPrimitives.h>
#include <ABI43_0_0React/ABI43_0_0utils/Telemetry.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * Represents telemetry data associated with a image request
 */
class ImageTelemetry final {
 public:
  ImageTelemetry(SurfaceId const surfaceId) : surfaceId_(surfaceId) {}

  /*
   * Signaling
   */
  void willRequestUrl();

  /*
   * Reading
   */
  TelemetryTimePoint getWillRequestUrlTime() const;

  SurfaceId getSurfaceId() const;

 private:
  TelemetryTimePoint willRequestUrlTime_{kTelemetryUndefinedTimePoint};

  const SurfaceId surfaceId_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
