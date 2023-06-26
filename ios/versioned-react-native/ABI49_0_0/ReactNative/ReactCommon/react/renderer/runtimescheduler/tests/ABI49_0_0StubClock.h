/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeSchedulerClock.h>
#include <chrono>

namespace ABI49_0_0facebook::ABI49_0_0React {

class StubClock {
 public:
  RuntimeSchedulerTimePoint getNow() const {
    return timePoint_;
  }

  void setTimePoint(RuntimeSchedulerTimePoint timePoint) {
    timePoint_ = timePoint;
  }

  void setTimePoint(RuntimeSchedulerDuration duration) {
    timePoint_ = RuntimeSchedulerTimePoint(duration);
  }

  RuntimeSchedulerTimePoint getTimePoint() {
    return timePoint_;
  }

  void advanceTimeBy(RuntimeSchedulerDuration duration) {
    timePoint_ += duration;
  }

 private:
  RuntimeSchedulerTimePoint timePoint_;
};

} // namespace ABI49_0_0facebook::ABI49_0_0React
