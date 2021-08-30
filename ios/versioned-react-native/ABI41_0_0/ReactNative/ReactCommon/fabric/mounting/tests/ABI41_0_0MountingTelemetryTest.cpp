/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <chrono>
#include <thread>

#include <gtest/gtest.h>

#include <ABI41_0_0React/mounting/MountingTelemetry.h>
#include <ABI41_0_0React/utils/Telemetry.h>

using namespace ABI41_0_0facebook::ABI41_0_0React;

#define ABI41_0_0EXPECT_EQ_WITH_THRESHOLD(a, b, threshold) \
  ABI41_0_0EXPECT_TRUE((a >= b - threshold) && (a <= b + threshold))

TEST(MountingTelemetryTest, timepoints) {
  auto threshold = int64_t{100};

  auto timepointA = telemetryTimePointNow();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  auto timepointB = telemetryTimePointNow();

  auto duration = telemetryDurationToMilliseconds(timepointB - timepointA);

  ABI41_0_0EXPECT_EQ_WITH_THRESHOLD(duration, 100, threshold);
}

TEST(MountingTelemetryTest, normalUseCase) {
  auto threshold = int64_t{100};
  auto telemetry = MountingTelemetry{};

  telemetry.willCommit();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  telemetry.willLayout();
  std::this_thread::sleep_for(std::chrono::milliseconds(200));
  telemetry.didLayout();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  telemetry.didCommit();

  std::this_thread::sleep_for(std::chrono::milliseconds(300));

  telemetry.willMount();
  std::this_thread::sleep_for(std::chrono::milliseconds(100));
  telemetry.didMount();

  auto commitDuration = telemetryDurationToMilliseconds(
      telemetry.getCommitEndTime() - telemetry.getCommitStartTime());
  auto layoutDuration = telemetryDurationToMilliseconds(
      telemetry.getLayoutEndTime() - telemetry.getLayoutStartTime());
  auto mountDuration = telemetryDurationToMilliseconds(
      telemetry.getMountEndTime() - telemetry.getMountStartTime());

  ABI41_0_0EXPECT_EQ_WITH_THRESHOLD(commitDuration, 400, threshold * 2);
  ABI41_0_0EXPECT_EQ_WITH_THRESHOLD(layoutDuration, 200, threshold);
  ABI41_0_0EXPECT_EQ_WITH_THRESHOLD(mountDuration, 100, threshold);
}

TEST(MountingTelemetryTest, abnormalUseCases) {
  // Calling `did` before `will` should crash.
  ABI41_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.didDiff();
      },
      "diffStartTime_");

  ABI41_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.didCommit();
      },
      "commitStartTime_");

  ABI41_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.didMount();
      },
      "mountStartTime_");

  // Getting `start` *or* `end` timepoints before a pair of `will` and `did`
  // should crash.
  ABI41_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.willCommit();
        telemetry.getCommitStartTime();
      },
      "commitEndTime_");

  ABI41_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = MountingTelemetry{};
        telemetry.willCommit();
        telemetry.getCommitEndTime();
      },
      "commitEndTime_");
}
