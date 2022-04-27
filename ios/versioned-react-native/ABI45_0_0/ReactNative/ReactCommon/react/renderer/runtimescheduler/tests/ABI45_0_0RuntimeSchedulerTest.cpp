/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/API/hermes/hermes.h>
#include <ABI45_0_0jsi/ABI45_0_0jsi.h>
#include <ABI45_0_0React/ABI45_0_0renderer/runtimescheduler/RuntimeScheduler.h>
#include <memory>

#include "ABI45_0_0StubClock.h"
#include "ABI45_0_0StubErrorUtils.h"
#include "ABI45_0_0StubQueue.h"

namespace ABI45_0_0facebook::ABI45_0_0React {

using namespace std::chrono_literals;

class RuntimeSchedulerTest : public testing::Test {
 protected:
  void SetUp() override {
    hostFunctionCallCount_ = 0;
    runtime_ = ABI45_0_0facebook::hermes::makeHermesRuntime();
    stubErrorUtils_ = StubErrorUtils::createAndInstallIfNeeded(*runtime_);
    stubQueue_ = std::make_unique<StubQueue>();

    RuntimeExecutor runtimeExecutor =
        [this](
            std::function<void(ABI45_0_0facebook::jsi::Runtime & runtime)> &&callback) {
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
            jsi::Runtime &,
            jsi::Value const &,
            jsi::Value const *arguments,
            size_t) -> jsi::Value {
          ++hostFunctionCallCount_;
          auto didUserCallbackTimeout = arguments[0].getBool();
          return callback(didUserCallbackTimeout);
        });
  }

  uint hostFunctionCallCount_;

  std::unique_ptr<ABI45_0_0facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<StubClock> stubClock_;
  std::unique_ptr<StubQueue> stubQueue_;
  std::unique_ptr<RuntimeScheduler> runtimeScheduler_;
  std::shared_ptr<StubErrorUtils> stubErrorUtils_;
};

TEST_F(RuntimeSchedulerTest, now) {
  stubClock_->setTimePoint(1ms);

  ABI45_0_0EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(1ms));

  stubClock_->advanceTimeBy(10ms);

  ABI45_0_0EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(11ms));

  stubClock_->advanceTimeBy(6s);

  ABI45_0_0EXPECT_EQ(runtimeScheduler_->now(), RuntimeSchedulerTimePoint(6011ms));
}

TEST_F(RuntimeSchedulerTest, getShouldYield) {
  // Always returns false for now.
  ABI45_0_0EXPECT_FALSE(runtimeScheduler_->getShouldYield());
}

TEST_F(RuntimeSchedulerTest, scheduleSingleTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        ABI45_0_0EXPECT_FALSE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  ABI45_0_0EXPECT_FALSE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleImmediatePriorityTask) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        ABI45_0_0EXPECT_FALSE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  ABI45_0_0EXPECT_FALSE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, taskExpiration) {
  bool didRunTask = false;
  auto callback =
      createHostFunctionFromLambda([&didRunTask](bool didUserCallbackTimeout) {
        didRunTask = true;
        // Task has timed out but the parameter is deprecated and `false` is
        // hardcoded.
        ABI45_0_0EXPECT_FALSE(didUserCallbackTimeout);
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  // Task with normal priority has 5s timeout.
  stubClock_->advanceTimeBy(6s);

  ABI45_0_0EXPECT_FALSE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleTwoTasksWithSamePriority) {
  uint firstTaskCallOrder = 0;
  auto callbackOne =
      createHostFunctionFromLambda([this, &firstTaskCallOrder](bool) {
        firstTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callbackOne));

  uint secondTaskCallOrder;
  auto callbackTwo =
      createHostFunctionFromLambda([this, &secondTaskCallOrder](bool) {
        secondTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callbackTwo));

  ABI45_0_0EXPECT_EQ(firstTaskCallOrder, 0);
  ABI45_0_0EXPECT_EQ(secondTaskCallOrder, 0);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_EQ(firstTaskCallOrder, 1);
  ABI45_0_0EXPECT_EQ(secondTaskCallOrder, 2);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
  ABI45_0_0EXPECT_EQ(hostFunctionCallCount_, 2);
}

TEST_F(RuntimeSchedulerTest, scheduleTwoTasksWithDifferentPriorities) {
  uint lowPriorityTaskCallOrder = 0;
  auto callbackOne =
      createHostFunctionFromLambda([this, &lowPriorityTaskCallOrder](bool) {
        lowPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::LowPriority, std::move(callbackOne));

  uint userBlockingPriorityTaskCallOrder;
  auto callbackTwo = createHostFunctionFromLambda(
      [this, &userBlockingPriorityTaskCallOrder](bool) {
        userBlockingPriorityTaskCallOrder = hostFunctionCallCount_;
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::UserBlockingPriority, std::move(callbackTwo));

  ABI45_0_0EXPECT_EQ(lowPriorityTaskCallOrder, 0);
  ABI45_0_0EXPECT_EQ(userBlockingPriorityTaskCallOrder, 0);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_EQ(lowPriorityTaskCallOrder, 2);
  ABI45_0_0EXPECT_EQ(userBlockingPriorityTaskCallOrder, 1);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
  ABI45_0_0EXPECT_EQ(hostFunctionCallCount_, 2);
}

TEST_F(RuntimeSchedulerTest, cancelTask) {
  bool didRunTask = false;
  auto callback = createHostFunctionFromLambda([&didRunTask](bool) {
    didRunTask = true;
    return jsi::Value::undefined();
  });

  auto task = runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  ABI45_0_0EXPECT_FALSE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  runtimeScheduler_->cancelTask(*task);

  stubQueue_->tick();

  ABI45_0_0EXPECT_FALSE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, continuationTask) {
  bool didRunTask = false;
  bool didContinuationTask = false;

  auto callback = createHostFunctionFromLambda([&](bool) {
    didRunTask = true;
    return jsi::Function::createFromHostFunction(
        *runtime_,
        jsi::PropNameID::forUtf8(*runtime_, ""),
        1,
        [&](jsi::Runtime &runtime,
            jsi::Value const &,
            jsi::Value const *arguments,
            size_t) noexcept -> jsi::Value {
          didContinuationTask = true;
          return jsi::Value::undefined();
        });
  });

  auto task = runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  ABI45_0_0EXPECT_FALSE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(didRunTask);
  ABI45_0_0EXPECT_TRUE(didContinuationTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, getCurrentPriorityLevel) {
  auto callback =
      createHostFunctionFromLambda([this](bool didUserCallbackTimeout) {
        ABI45_0_0EXPECT_EQ(
            runtimeScheduler_->getCurrentPriorityLevel(),
            SchedulerPriority::ImmediatePriority);
        return jsi::Value::undefined();
      });

  ABI45_0_0EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  stubQueue_->tick();

  ABI45_0_0EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);

  callback = createHostFunctionFromLambda([this](bool didUserCallbackTimeout) {
    ABI45_0_0EXPECT_EQ(
        runtimeScheduler_->getCurrentPriorityLevel(),
        SchedulerPriority::IdlePriority);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::IdlePriority, std::move(callback));

  stubQueue_->tick();

  ABI45_0_0EXPECT_EQ(
      runtimeScheduler_->getCurrentPriorityLevel(),
      SchedulerPriority::NormalPriority);
}

TEST_F(RuntimeSchedulerTest, scheduleWork) {
  bool wasCalled = false;
  runtimeScheduler_->scheduleWork(
      [&](jsi::Runtime const &) { wasCalled = true; });

  ABI45_0_0EXPECT_FALSE(wasCalled);

  ABI45_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());

  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(wasCalled);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleWorkWithYielding) {
  bool wasCalled = false;
  runtimeScheduler_->scheduleWork(
      [&](jsi::Runtime const &) { wasCalled = true; });

  ABI45_0_0EXPECT_FALSE(wasCalled);

  ABI45_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());

  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(wasCalled);
  ABI45_0_0EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, normalTaskYieldsToPlatformEvent) {
  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool) {
    didRunJavaScriptTask = true;
    ABI45_0_0EXPECT_TRUE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](jsi::Runtime const &) {
    didRunPlatformWork = true;
    ABI45_0_0EXPECT_FALSE(didRunJavaScriptTask);
    ABI45_0_0EXPECT_FALSE(runtimeScheduler_->getShouldYield());
  });

  ABI45_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 2);

  stubQueue_->flush();

  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, expiredTaskDoesntYieldToPlatformEvent) {
  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool) {
    didRunJavaScriptTask = true;
    ABI45_0_0EXPECT_FALSE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](jsi::Runtime const &) {
    didRunPlatformWork = true;
    ABI45_0_0EXPECT_TRUE(didRunJavaScriptTask);
  });

  ABI45_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 2);

  stubClock_->advanceTimeBy(6s);

  stubQueue_->flush();

  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, immediateTaskDoesntYieldToPlatformEvent) {
  bool didRunJavaScriptTask = false;
  bool didRunPlatformWork = false;

  auto callback = createHostFunctionFromLambda([&](bool) {
    didRunJavaScriptTask = true;
    ABI45_0_0EXPECT_FALSE(didRunPlatformWork);
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::ImmediatePriority, std::move(callback));

  runtimeScheduler_->scheduleWork([&](jsi::Runtime const &) {
    didRunPlatformWork = true;
    ABI45_0_0EXPECT_TRUE(didRunJavaScriptTask);
  });

  ABI45_0_0EXPECT_TRUE(runtimeScheduler_->getShouldYield());
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 2);

  stubQueue_->flush();

  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, scheduleTaskFromTask) {
  bool didRunFirstTask = false;
  bool didRunSecondTask = false;
  auto firstCallback = createHostFunctionFromLambda(
      [this, &didRunFirstTask, &didRunSecondTask](bool didUserCallbackTimeout) {
        didRunFirstTask = true;
        ABI45_0_0EXPECT_FALSE(didUserCallbackTimeout);

        auto secondCallback = createHostFunctionFromLambda(
            [&didRunSecondTask](bool didUserCallbackTimeout) {
              didRunSecondTask = true;
              ABI45_0_0EXPECT_FALSE(didUserCallbackTimeout);
              return jsi::Value::undefined();
            });

        runtimeScheduler_->scheduleTask(
            SchedulerPriority::ImmediatePriority, std::move(secondCallback));
        return jsi::Value::undefined();
      });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(firstCallback));

  ABI45_0_0EXPECT_FALSE(didRunFirstTask);
  ABI45_0_0EXPECT_FALSE(didRunSecondTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(didRunFirstTask);
  ABI45_0_0EXPECT_TRUE(didRunSecondTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

TEST_F(RuntimeSchedulerTest, handlingError) {
  bool didRunTask = false;
  auto firstCallback = createHostFunctionFromLambda([this, &didRunTask](bool) {
    didRunTask = true;
    jsi::detail::throwJSError(*runtime_, "Test error");
    return jsi::Value::undefined();
  });

  runtimeScheduler_->scheduleTask(
      SchedulerPriority::NormalPriority, std::move(firstCallback));

  ABI45_0_0EXPECT_FALSE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(didRunTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
  ABI45_0_0EXPECT_EQ(stubErrorUtils_->getReportFatalCallCount(), 1);
}

TEST_F(RuntimeSchedulerTest, basicSameThreadExecution) {
  bool didRunSynchronousTask = false;
  std::thread t1([this, &didRunSynchronousTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunSynchronousTask](jsi::Runtime &rt) {
          ABI45_0_0EXPECT_TRUE(runtimeScheduler_->getIsSynchronous());
          didRunSynchronousTask = true;
        });
    ABI45_0_0EXPECT_FALSE(runtimeScheduler_->getIsSynchronous());
  });

  auto hasTask = stubQueue_->waitForTask(1ms);

  ABI45_0_0EXPECT_TRUE(hasTask);
  ABI45_0_0EXPECT_FALSE(didRunSynchronousTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  ABI45_0_0EXPECT_TRUE(didRunSynchronousTask);
}

TEST_F(RuntimeSchedulerTest, sameThreadTaskCreatesImmediatePriorityTask) {
  bool didRunSynchronousTask = false;
  bool didRunSubsequentTask = false;
  std::thread t1([this, &didRunSynchronousTask, &didRunSubsequentTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunSynchronousTask, &didRunSubsequentTask](
            jsi::Runtime &rt) {
          didRunSynchronousTask = true;

          auto callback = createHostFunctionFromLambda(
              [&didRunSubsequentTask](bool didUserCallbackTimeout) {
                didRunSubsequentTask = true;
                ABI45_0_0EXPECT_FALSE(didUserCallbackTimeout);
                return jsi::Value::undefined();
              });

          runtimeScheduler_->scheduleTask(
              SchedulerPriority::ImmediatePriority, std::move(callback));
        });
  });

  auto hasTask = stubQueue_->waitForTask(1ms);

  ABI45_0_0EXPECT_TRUE(hasTask);
  ABI45_0_0EXPECT_FALSE(didRunSynchronousTask);
  ABI45_0_0EXPECT_FALSE(didRunSubsequentTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  ABI45_0_0EXPECT_TRUE(didRunSynchronousTask);
  ABI45_0_0EXPECT_TRUE(didRunSubsequentTask);
}

TEST_F(RuntimeSchedulerTest, sameThreadTaskCreatesLowPriorityTask) {
  bool didRunSynchronousTask = false;
  bool didRunSubsequentTask = false;
  std::thread t1([this, &didRunSynchronousTask, &didRunSubsequentTask]() {
    runtimeScheduler_->executeNowOnTheSameThread(
        [this, &didRunSynchronousTask, &didRunSubsequentTask](
            jsi::Runtime &rt) {
          didRunSynchronousTask = true;

          auto callback = createHostFunctionFromLambda(
              [&didRunSubsequentTask](bool didUserCallbackTimeout) {
                didRunSubsequentTask = true;
                ABI45_0_0EXPECT_FALSE(didUserCallbackTimeout);
                return jsi::Value::undefined();
              });

          runtimeScheduler_->scheduleTask(
              SchedulerPriority::LowPriority, std::move(callback));
        });
  });

  auto hasTask = stubQueue_->waitForTask(1ms);

  ABI45_0_0EXPECT_TRUE(hasTask);
  ABI45_0_0EXPECT_FALSE(didRunSynchronousTask);
  ABI45_0_0EXPECT_FALSE(didRunSubsequentTask);
  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  t1.join();

  ABI45_0_0EXPECT_TRUE(didRunSynchronousTask);
  ABI45_0_0EXPECT_FALSE(didRunSubsequentTask);

  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 1);

  stubQueue_->tick();

  ABI45_0_0EXPECT_TRUE(didRunSubsequentTask);

  ABI45_0_0EXPECT_EQ(stubQueue_->size(), 0);
}

} // namespace ABI45_0_0facebook::ABI45_0_0React
