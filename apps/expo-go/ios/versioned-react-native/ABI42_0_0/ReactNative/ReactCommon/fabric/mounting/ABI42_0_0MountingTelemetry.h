/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <chrono>
#include <cstdint>

#include <ABI42_0_0React/utils/Telemetry.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Represent arbitrary telemetry data that can be associated with the
 * particular revision of `ShadowTree`.
 */
class MountingTelemetry final {
 public:
  /*
   * Signaling
   */
  void willDiff();
  void didDiff();
  void willCommit();
  void didCommit();
  void willLayout();
  void didLayout();
  void willMount();
  void didMount();

  /*
   * Reading
   */
  TelemetryTimePoint getDiffStartTime() const;
  TelemetryTimePoint getDiffEndTime() const;
  TelemetryTimePoint getLayoutStartTime() const;
  TelemetryTimePoint getLayoutEndTime() const;
  TelemetryTimePoint getCommitStartTime() const;
  TelemetryTimePoint getCommitEndTime() const;
  TelemetryTimePoint getMountStartTime() const;
  TelemetryTimePoint getMountEndTime() const;

  int getCommitNumber() const;

 private:
  TelemetryTimePoint diffStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint diffEndTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint commitStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint commitEndTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint layoutStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint layoutEndTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint mountStartTime_{kTelemetryUndefinedTimePoint};
  TelemetryTimePoint mountEndTime_{kTelemetryUndefinedTimePoint};

  int commitNumber_{0};
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
