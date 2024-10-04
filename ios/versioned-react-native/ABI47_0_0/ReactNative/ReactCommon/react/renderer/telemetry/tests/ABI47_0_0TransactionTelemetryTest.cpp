/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <chrono>
#include <thread>

#include <gtest/gtest.h>

#include <ABI47_0_0React/ABI47_0_0renderer/telemetry/TransactionTelemetry.h>
#include <ABI47_0_0React/ABI47_0_0test_utils/MockClock.h>
#include <ABI47_0_0React/ABI47_0_0utils/Telemetry.h>

using namespace ABI47_0_0facebook::ABI47_0_0React;

MockClock::time_point MockClock::time_ = {};

/**
 * Ensures that the at least the specified time passes on a real clock.
 * Why at least? Because operating systems provide no guarantee that our thread
 * gets processing time after the specified time. What about using a busywait?
 * Busywait are also affected by the non-deterministic OS process scheduling.
 * The OS might decide right before the specified time elapsed to schedule
 * another thread/process, with the result that more time passes in reality than
 * the caller intended. Prefer the `MockClock` and only use this function to
 * verify that at least the specifid time has passed but wihtout making exact
 * verifications.
 */
static void sleepAtLeast(double durationInSeconds) {
  std::this_thread::sleep_for(
      std::chrono::milliseconds((long long)(durationInSeconds * 1000)));
}

TEST(TransactionTelemetryTest, timepoints) {
  auto timepointA = telemetryTimePointNow();
  sleepAtLeast(0.1);
  auto timepointB = telemetryTimePointNow();

  auto duration = telemetryDurationToMilliseconds(timepointB - timepointA);

  ABI47_0_0EXPECT_GE(duration, 100);
}

TEST(TransactionTelemetryTest, normalUseCase) {
  auto telemetry = TransactionTelemetry{[]() { return MockClock::now(); }};

  telemetry.setAsThreadLocal();

  telemetry.willCommit();
  MockClock::advance_by(std::chrono::milliseconds(100));
  telemetry.willLayout();
  MockClock::advance_by(std::chrono::milliseconds(200));

  TransactionTelemetry::threadLocalTelemetry()->willMeasureText();
  MockClock::advance_by(std::chrono::milliseconds(100));
  TransactionTelemetry::threadLocalTelemetry()->didMeasureText();

  TransactionTelemetry::threadLocalTelemetry()->willMeasureText();
  MockClock::advance_by(std::chrono::milliseconds(200));
  TransactionTelemetry::threadLocalTelemetry()->didMeasureText();

  TransactionTelemetry::threadLocalTelemetry()->willMeasureText();
  MockClock::advance_by(std::chrono::milliseconds(300));
  TransactionTelemetry::threadLocalTelemetry()->didMeasureText();

  telemetry.didLayout();
  MockClock::advance_by(std::chrono::milliseconds(100));
  telemetry.didCommit();

  telemetry.setRevisionNumber(42);

  telemetry.unsetAsThreadLocal();

  MockClock::advance_by(std::chrono::milliseconds(300));

  telemetry.willMount();
  MockClock::advance_by(std::chrono::milliseconds(100));
  telemetry.didMount();

  auto commitDuration = telemetryDurationToMilliseconds(
      telemetry.getCommitEndTime() - telemetry.getCommitStartTime());
  auto layoutDuration = telemetryDurationToMilliseconds(
      telemetry.getLayoutEndTime() - telemetry.getLayoutStartTime());
  auto mountDuration = telemetryDurationToMilliseconds(
      telemetry.getMountEndTime() - telemetry.getMountStartTime());

  ABI47_0_0EXPECT_EQ(commitDuration, 1000);
  ABI47_0_0EXPECT_EQ(layoutDuration, 800);
  ABI47_0_0EXPECT_EQ(mountDuration, 100);

  ABI47_0_0EXPECT_EQ(telemetry.getNumberOfTextMeasurements(), 3);
  ABI47_0_0EXPECT_EQ(
      telemetryDurationToMilliseconds(telemetry.getTextMeasureTime()), 600);
  ABI47_0_0EXPECT_EQ(telemetry.getRevisionNumber(), 42);
}

TEST(TransactionTelemetryTest, defaultImplementation) {
  auto telemetry = TransactionTelemetry{};

  telemetry.setAsThreadLocal();

  telemetry.willCommit();
  sleepAtLeast(0.1);
  telemetry.willLayout();
  sleepAtLeast(0.2);

  TransactionTelemetry::threadLocalTelemetry()->willMeasureText();
  sleepAtLeast(0.1);
  TransactionTelemetry::threadLocalTelemetry()->didMeasureText();

  telemetry.didLayout();
  sleepAtLeast(0.1);
  telemetry.didCommit();

  telemetry.unsetAsThreadLocal();

  telemetry.willMount();
  sleepAtLeast(0.1);
  telemetry.didMount();

  auto commitDuration = telemetryDurationToMilliseconds(
      telemetry.getCommitEndTime() - telemetry.getCommitStartTime());
  auto layoutDuration = telemetryDurationToMilliseconds(
      telemetry.getLayoutEndTime() - telemetry.getLayoutStartTime());
  auto mountDuration = telemetryDurationToMilliseconds(
      telemetry.getMountEndTime() - telemetry.getMountStartTime());

  ABI47_0_0EXPECT_GE(commitDuration, 500);
  ABI47_0_0EXPECT_GE(layoutDuration, 300);
  ABI47_0_0EXPECT_GE(mountDuration, 100);
}

TEST(TransactionTelemetryTest, abnormalUseCases) {
  // Calling `did` before `will` should crash.
  ABI47_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.didDiff();
      },
      "diffStartTime_");

  ABI47_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.didCommit();
      },
      "commitStartTime_");

  ABI47_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.didMount();
      },
      "mountStartTime_");

  // Getting `start` *or* `end` timepoints before a pair of `will` and `did`
  // should crash.
  ABI47_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.willCommit();
        telemetry.getCommitStartTime();
      },
      "commitEndTime_");

  ABI47_0_0EXPECT_DEATH_IF_SUPPORTED(
      {
        auto telemetry = TransactionTelemetry{};
        telemetry.willCommit();
        telemetry.getCommitEndTime();
      },
      "commitEndTime_");
}
