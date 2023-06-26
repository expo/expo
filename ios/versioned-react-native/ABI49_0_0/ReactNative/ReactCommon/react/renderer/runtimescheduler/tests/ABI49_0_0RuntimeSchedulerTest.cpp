/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/ABI49_0_0hermes.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeScheduler.h>
#include <memory>

#include "ABI49_0_0StubClock.h"
#include "ABI49_0_0StubErrorUtils.h"
#include "ABI49_0_0StubQueue.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

using namespace std::chrono_literals;

class RuntimeSchedulerTest : public testing::Test {
 protected:
  void SetUp() override {
    hostFunctionCallCount_ = 0;
    runtime_ = ABI49_0_0facebook::ABI49_0_0hermes::makeHermesRuntime();
    stubErrorUtils_ = StubErrorUtils::createAndInstallIfNeeded(*runtime_);
    stubQueue_ = std::make_unique<StubQueue>();

    RuntimeExecutor runtimeExecutor =
        [this](
            std::function<void(ABI49_0_0facebook::jsi::Runtime & runtime)> &&callback) {
          stubQueue_->runOnQueue([this, callback = std::move(callback)]() {
            callback(*runtime_);
          });
        };

    stubClock_ = std::make_unique<StubClock>(StubClock());

    auto stubNow = [this]() -> RuntimeSchedulerTimePoint {
      return stubClock_->getNow();
    };

    runtimeScheduler_ =
        std::make_unique<RuntimeScheduler>(runtimeExecutor, stubNow);
  }

  jsi::Function createHostFunctionFromLambda(
      std::function<jsi::Value(bool)> callback) {
    return jsi::Function::createFromHostFunction(
        *runtime_,
        jsi::PropNameID::forUtf8(*runtime_, ""),
        3,
        [this, callback = std::move(callback)](
            jsi::Runtime & /*unused*/,
            jsi::Value const & /*unused*/,
            jsi::Value const *arguments,
            size_t /*unused*/) -> jsi::Value {
          ++hostFunctionCallCount_;
          auto didUserCallbackTimeout = arguments[0].getBool();
          return callback(didUserCallbackTimeout);
        });
  }

  uint hostFunctionCallCount_{};

  std::unique_ptr<ABI49_0_0facebook::ABI49_0_0hermes::HermesRuntime> runtime_;
  std::unique_ptr<StubClock> stubClock_;
  std::unique_ptr<StubQueue> stubQueue_;
  std::unique_ptr<RuntimeScheduler> runtimeScheduler_;
  std::shared_ptr<StubErrorUtils> stubErrorUtils_;
};

TEST_F(RuntimeSchedulerTest, now) {
  stubClock_->setTimePoint(1ms);

  ABI49_0_0EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(1ms));

  stubClock_->advanceTimeBy(10ms);

  ABI49_0_0EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(11ms));

  stubClock_->advanceTimeBy(6s);

  ABI49_0_0EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(6011ms));
}

TEST_F(RuntimeSchedulerTest, getShouldYield) {
  // Always returns false for now.
  ABI49_0_0EXPECT_FALSE(runtimeScheduler_->getShouldYield());
}

TEST_F(RuntimeSchedulerTest, scheduleSingleTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        ABI49_0_0EXPECT_FALSE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  ABI49_0_0EXPECT_FALSE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleImmediatePriorityTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        ABI49_0_0EXPECT_TRUE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  ABI49_0_0EXPECT_FALSE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, taskExpiration) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        ABI49_0_0EXPECT_TRUE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  // Task with normal priority has 5s timeout.
  stubClock_->advanceTimeBy(6s);

  ABI49_0_0EXPECT_FALSE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleTwoTasksWithSamePriority) {
  uint firstTaskCallOrder = 0;
  auto callbackOne = createHostFunctionFromLambda(
      [this, &firstTaskCallOrder](bool /*unused*/) {
        firstTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callbackOne));

  uint secondTaskCallOrder;
  auto callbackTwo = createHostFunctionFromLambda(
      [this, &secondTaskCallOrder](bool /*unused*/) {
        secondTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callbackTwo));

  ABI49_0_0EXPECT_EQ(firstTaskCallOrder, 0);
  ABI49_0_0EXPECT_EQ(secondTaskCallOrder, 0);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_EQ(firstTaskCallOrder, 1);
  ABI49_0_0EXPECT_EQ(secondTaskCallOrder, 2);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
  ABI49_0_0EXPECT_EQ(hostFunctionCallCount_, 2);
}

TEST_F(RuntimeSchedulerTest, scheduleTwoTasksWithDifferentPriorities) {
  uint lowPriorityTaskCallOrder = 0;
  auto callbackOne = createHostFunctionFromLambda(
      [this, &lowPriorityTaskCallOrder](bool /*unused*/) {
        lowPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::LowPriority, std::move(callbackOne));

  uint userBlockingPriorityTaskCallOrder;
  auto callbackTwo = createHostFunctionFromLambda(
      [this, &userBlockingPriorityTaskCallOrder](bool /*unused*/) {
        userBlockingPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::UserBlockingPriority, std::move(callbackTwo));

  ABI49_0_0EXPECT_EQ(lowPriorityTaskCallOrder, 0);
  ABI49_0_0EXPECT_EQ(userBlockingPriorityTaskCallOrder, 0);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_EQ(lowPriorityTaskCallOrder, 2);
  ABI49_0_0EXPECT_EQ(userBlockingPriorityTaskCallOrder, 1);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
  ABI49_0_0EXPECT_EQ(hostFunctionCallCount_, 2);
}

TEST_F(RuntimeSchedulerTest, cancelTask) {
  bool didRunTask = false;
  auto callback = createHostFunctionFromLambda([&didRunTask](bool /*unused*/) {
    didRunTask = true;
    return jsi::Value::undefined();
  });

  auto task = runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  ABI49_0_0EXPECT_FALSE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  runtimeScheduler_->cancelTask(*task);

  stubQueue_->tick();

  ABI49_0_0EXPECT_FALSE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, continuationTask) {
  bool didRunTask = false;
  bool didContinuationTask = false;

  auto callback = createHostFunctionFromLambda([&](bool /*unused*/) {
    didRunTask = true;
    return jsi::Function::createFromHostFunction(
        *runtime_,
        jsi::PropNameID::forUtf8(*runtime_, ""),
        1,
        [&](jsi::Runtime & /*runtime*/,
            jsi::Value const & /*unused*/,
            jsi::Value const * /*arguments*/,
            size_t /*unused*/) noexcept -> jsi::Value {
          didContinuationTask = true;
          return jsi::Value::undefined();
        });
  });

  auto task = runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  ABI49_0_0EXPECT_FALSE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(didRunTask);
  ABI49_0_0EXPECT_TRUE(didContinuationTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, getCurrentPriorityLevel) {
  auto callback =
      createHostFunctionFromLambda([this](bool /*didUserCallbackTimeout*/) {
        ABI49_0_0EXPECT_EQ(
            runtimeScheduler_->getCurrentPriorityLevel(),
            SchedulerPriority::ImmediatePriority);
        return jsi::Value::undefined();
      });

  ABI49_0_0EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  stubQueue_->tick();

  ABI49_0_0EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);

  callback =
      createHostFunctionFromLambda([this](bool /*didUserCallbackTimeout*/) {
        ABI49_0_0EXPECT_EQ(
            runtimeScheduler_->getCurrentPriorityLevel(),
            SchedulerPriority::IdlePriority);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::IdlePriority, std::move(callback));

  stubQueue_->tick();

  ABI49_0_0EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);
}

TEST_F(RuntimeSchedulerTest, scheduleWorkWithYielding) {
  bool wasCalled = false;
  runtimeScheduler_->scheduleWork(
      [&](jsi::Runtime const & /*unused*/) { wasCalled = true; });

  ABI49_0_0EXPECT_FALSE(wasCalled);

  ABI49_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());

  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(wasCalled);
  ABI49_0_0EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, normalTaskYieldsToPlatformEvent) {
  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool /*unused*/) {
    didRunJavaScriptTask = true;
    ABI49_0_0EXPECT_TRUE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](jsi::Runtime const & /*unused*/) {
    didRunPlatformWork = true;
    ABI49_0_0EXPECT_FALSE(didRunJavaScriptTask);
    ABI49_0_0EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  });

  ABI49_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 2);

  stubQueue_->flush();

  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, expiredTaskDoesntYieldToPlatformEvent) {
  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool /*unused*/) {
    didRunJavaScriptTask = true;
    ABI49_0_0EXPECT_FALSE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](jsi::Runtime const & /*unused*/) {
    didRunPlatformWork = true;
    ABI49_0_0EXPECT_TRUE(didRunJavaScriptTask);
  });

  ABI49_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 2);

  stubClock_->advanceTimeBy(6s);

  stubQueue_->flush();

  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, immediateTaskDoesntYieldToPlatformEvent) {
  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool /*unused*/) {
    didRunJavaScriptTask = true;
    ABI49_0_0EXPECT_FALSE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](jsi::Runtime const & /*unused*/) {
    didRunPlatformWork = true;
    ABI49_0_0EXPECT_TRUE(didRunJavaScriptTask);
  });

  ABI49_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 2);

  stubQueue_->flush();

  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleTaskFromTask) {
  bool didRunFirstTask = false;
  bool didRunSecondTask = false;
  auto firstCallback = createHostFunctionFromLambda(
      [this, &didRunFirstTask, &didRunSecondTask](bool didUserCallbackTimeout) {
        didRunFirstTask = true;
        ABI49_0_0EXPECT_FALSE(didUserCallbackTimeout);

        auto secondCallback = createHostFunctionFromLambda(
            [&didRunSecondTask](bool didUserCallbackTimeout) {
              didRunSecondTask = true;
              ABI49_0_0EXPECT_TRUE(didUserCallbackTimeout);
              return jsi::Value::undefined();
            });

        runtimeScheduler_->scheduleTask(
            SchedulerPriority::ImmediatePriority, std::move(secondCallback));
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(firstCallback));

  ABI49_0_0EXPECT_FALSE(didRunFirstTask);
  ABI49_0_0EXPECT_FALSE(didRunSecondTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(didRunFirstTask);
  ABI49_0_0EXPECT_TRUE(didRunSecondTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, handlingError) {
  bool didRunTask = false;
  auto firstCallback =
      createHostFunctionFromLambda([this, &didRunTask](bool /*unused*/) {
        didRunTask = true;
        throw jsi::JSError(*runtime_, "Test error");
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(firstCallback));

  ABI49_0_0EXPECT_FALSE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(didRunTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
  ABI49_0_0EXPECT_EQ(stubErrorUtils_->getReportFatalCallCount(), 1);
}

TEST_F(RuntimeSchedulerTest, basicSameThreadExecution) {
  bool didRunSynchronousTask = false;
  std::thread t1([this, &didRunSynchronousTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunSynchronousTask](jsi::Runtime & /*rt*/) {
          ABI49_0_0EXPECT_TRUE(runtimeScheduler_->getIsSynchronous());
          didRunSynchronousTask = true;
        });
    ABI49_0_0EXPECT_FALSE(runtimeScheduler_->getIsSynchronous());
  });

  auto hasTask = stubQueue_->waitForTask(1ms);

  ABI49_0_0EXPECT_TRUE(hasTask);
  ABI49_0_0EXPECT_FALSE(didRunSynchronousTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  ABI49_0_0EXPECT_TRUE(didRunSynchronousTask);
}

TEST_F(RuntimeSchedulerTest, sameThreadTaskCreatesImmediatePriorityTask) {
  bool didRunSynchronousTask = false;
  bool didRunSubsequentTask = false;
  std::thread t1([this, &didRunSynchronousTask, &didRunSubsequentTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunSynchronousTask, &didRunSubsequentTask](
            jsi::Runtime &runtime) {
          didRunSynchronousTask = true;

          auto callback = createHostFunctionFromLambda(
              [&didRunSubsequentTask](bool didUserCallbackTimeout) {
                didRunSubsequentTask = true;
                ABI49_0_0EXPECT_TRUE(didUserCallbackTimeout);
                return jsi::Value::undefined();
              });

          runtimeScheduler_->scheduleTask(
              SchedulerPriority::ImmediatePriority, std::move(callback));

          runtimeScheduler_->callExpiredTasks(runtime);
        });
  });

  auto hasTask = stubQueue_->waitForTask(1ms);

  ABI49_0_0EXPECT_TRUE(hasTask);
  ABI49_0_0EXPECT_FALSE(didRunSynchronousTask);
  ABI49_0_0EXPECT_FALSE(didRunSubsequentTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  ABI49_0_0EXPECT_TRUE(didRunSynchronousTask);
  ABI49_0_0EXPECT_TRUE(didRunSubsequentTask);
}

TEST_F(RuntimeSchedulerTest, sameThreadTaskCreatesLowPriorityTask) {
  bool didRunSynchronousTask = false;
  bool didRunSubsequentTask = false;
  std::thread t1([this, &didRunSynchronousTask, &didRunSubsequentTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunSynchronousTask, &didRunSubsequentTask](
            jsi::Runtime &runtime) {
          didRunSynchronousTask = true;

          auto callback = createHostFunctionFromLambda(
              [&didRunSubsequentTask](bool didUserCallbackTimeout) {
                didRunSubsequentTask = true;
                ABI49_0_0EXPECT_FALSE(didUserCallbackTimeout);
                return jsi::Value::undefined();
              });

          runtimeScheduler_->scheduleTask(
              SchedulerPriority::LowPriority, std::move(callback));
          runtimeScheduler_->callExpiredTasks(runtime);

          ABI49_0_0EXPECT_FALSE(didRunSubsequentTask);
        });
  });

  auto hasTask = stubQueue_->waitForTask(1ms);

  ABI49_0_0EXPECT_TRUE(hasTask);
  ABI49_0_0EXPECT_FALSE(didRunSynchronousTask);
  ABI49_0_0EXPECT_FALSE(didRunSubsequentTask);
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  ABI49_0_0EXPECT_TRUE(didRunSynchronousTask);
  ABI49_0_0EXPECT_FALSE(didRunSubsequentTask);

  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(didRunSubsequentTask);

  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, twoThreadsRequestAccessToTheRuntime) {
  bool didRunSynchronousTask = false;
  bool didRunWork = false;

  runtimeScheduler_->scheduleWork(
      [&didRunWork](jsi::Runtime & /*unused*/) { didRunWork = true; });

  std::thread t1([this, &didRunSynchronousTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [&didRunSynchronousTask](jsi::Runtime & /*runtime*/) {
          didRunSynchronousTask = true;
        });
  });

  auto hasTask = stubQueue_->waitForTasks(2, 1ms);

  ABI49_0_0EXPECT_TRUE(hasTask);
  ABI49_0_0EXPECT_FALSE(didRunWork);
  ABI49_0_0EXPECT_FALSE(didRunSynchronousTask);
  ABI49_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 2);

  stubQueue_->tick();

  ABI49_0_0EXPECT_TRUE(didRunWork);
  ABI49_0_0EXPECT_FALSE(didRunSynchronousTask);
  ABI49_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  ABI49_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  ABI49_0_0EXPECT_TRUE(didRunWork);
  ABI49_0_0EXPECT_TRUE(didRunSynchronousTask);
  ABI49_0_0EXPECT_FALSE(runtimeScheduler_->getShouldYield());
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
