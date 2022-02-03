/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <chrono>
#include <thread>

#include <gtest/gtest.h>

#include <ABI43_0_0React/ABI43_0_0renderer/mounting/TransactionTelemetry.h>
#include <ABI43_0_0React/ABI43_0_0utils/Telemetry.h>

using namespace ABI43_0_0facebook::ABI43_0_0React;

#define ABI43_0_0EXPECT_EQ_WITH_THRESHOLD(a, b, threshold) \
  ABI43_0_0EXPECT_TRUE((a >= b - threshold) && (a <= b + threshold))

template <typename ClockT>
void sleep(double durationInSeconds) {
  auto timepoint = ClockT::now() +
      std::chrono::milliseconds((long long)(durationInSeconds * 1000));
  while (ClockT::now() < timepoint) {
  }
}

TEST(TransactionTelemetryTest, timepoints) {
  auto threshold = int64_t{70};

  auto timepointA = telemetryTimePointNow();
  sleep<TelemetryClock>(0.1);
  auto timepointB = telemetryTimePointNow();

  auto duration = telemetryDurationToMilliseconds(timepointB - timepointA);

  ABI43_0_0EXPECT_EQ_WITH_THRESHOLD(duration, 100, threshold);
}

TEST(TransactionTelemetryTest, normalUseCase) {
  auto threshold = int64_t{70};
  auto telemetry = TransactionTelemetry{};

  telemetry.setAsThreadLocal();

  telemetry.willCommit();
  sleep<TelemetryClock>(0.1);
  telemetry.willLayout();
  sleep<TelemetryClock>(0.2);

  telemetry.didMeasureText();
  TransactionTelemetry::threadLocalTelemetry()->didMeasureText();
  TransactionTelemetry::threadLocalTelemetry()->didMeasureText();

  telemetry.didLayout();
  sleep<TelemetryClock>(0.1);
  telemetry.didCommit();

  telemetry.setRevisionNumber(42);

  telemetry.unsetAsThreadLocal();

  sleep<TelemetryClock>(0.3);

  telemetry.willMount();
  sleep<TelemetryClock>(0.1);
  telemetry.didMount();

  auto commitDuration = telemetryDurationToMilliseconds(
      telemetry.getCommitEndTime() - telemetry.getCommitStartTime());
  auto layoutDuration = telemetryDurationToMilliseconds(
      telemetry.getLayoutEndTime() - telemetry.getLayoutStartTime());
  auto mountDuration = telemetryDurationToMilliseconds(
      telemetry.getMountEndTime() - telemetry.getMountStartTime());

  ABI43_0_0EXPECT_EQ_WITH_THRESHOLD(commitDuration, 400, threshold);
  ABI43_0_0EXPECT_EQ_WITH_THRESHOLD(layoutDuration, 200, threshold);
  ABI43_0_0EXPECT_EQ_WITH_THRESHOLD(mountDuration, 100, threshold);

  ABI43_0_0EXPECT_EQ(telemetry.getNumberOfTextMeasurements(), 3);
  ABI43_0_0EXPECT_EQ(telemetry.getRevisionNumber(), 42);
}

TEST(TransactionTelemetryTest, abnormalUseCases) {
  // Calling `did` before `will` should crash.
  ABI43_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.didDiff();
      },
      "diffStartTime_");

  ABI43_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.didCommit();
      },
      "commitStartTime_");

  ABI43_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.didMount();
      },
      "mountStartTime_");

  // Getting `start` *or* `end` timepoints before a pair of `will` and `did`
  // should crash.
  ABI43_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.willCommit();
        telemetry.getCommitStartTime();
      },
      "commitEndTime_");

  ABI43_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.willCommit();
        telemetry.getCommitEndTime();
      },
      "commitEndTime_");
}
