/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/core/LayoutPrimitives.h>
#include <ABI47_0_0React/ABI47_0_0renderer/uimanager/UIManagerCommitHook.h>
#include <ABI47_0_0React/ABI47_0_0utils/Telemetry.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Represents a reference to a commit from the past.
 * The reference can be safely used to address a particular commit from non-core
 * code.
 */
class TimelineFrame final {
  friend class TimelineSnapshot;

  /*
   * Constructor is private and must be called by `TimelineSnapshot` only.
   */
  TimelineFrame(int index, TelemetryTimePoint timePoint) noexcept;

 public:
  using List = std::vector<TimelineFrame>;

  TimelineFrame() = delete;
  TimelineFrame(TimelineFrame const &timelineFrame) noexcept = default;
  TimelineFrame &operator=(TimelineFrame const &other) noexcept = default;

  int getIndex() const noexcept;
  TelemetryTimePoint getTimePoint() const noexcept;

 private:
  int index_;
  TelemetryTimePoint timePoint_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
