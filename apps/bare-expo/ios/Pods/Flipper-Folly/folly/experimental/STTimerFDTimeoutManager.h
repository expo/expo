/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once
#include <folly/experimental/TimerFD.h>
#include <folly/io/async/TimeoutManager.h>

namespace folly {
// single timeout timerfd based TimeoutManager
class STTimerFDTimeoutManager : public TimeoutManager, TimerFD {
 public:
  explicit STTimerFDTimeoutManager(folly::EventBase* eventBase);
  ~STTimerFDTimeoutManager() override;

  /**
   * Attaches/detaches TimeoutManager to AsyncTimeout
   */
  void attachTimeoutManager(AsyncTimeout* obj, InternalEnum internal) final;
  void detachTimeoutManager(AsyncTimeout* obj) final;

  /**
   * Schedules AsyncTimeout to fire after `timeout` milliseconds
   */
  bool scheduleTimeout(AsyncTimeout* obj, timeout_type timeout) final;

  /**
   * Schedules AsyncTimeout to fire after `timeout` microseconds
   */
  bool scheduleTimeoutHighRes(AsyncTimeout* obj, timeout_type_high_res timeout)
      final;

  /**
   * Cancels the AsyncTimeout, if scheduled
   */
  void cancelTimeout(AsyncTimeout* obj) final;

  /**
   * This is used to mark the beginning of a new loop cycle by the
   * first handler fired within that cycle.
   */
  void bumpHandlingTime() final;

  /**
   * Helper method to know whether we are running in the timeout manager
   * thread
   */
  bool isInTimeoutManagerThread() final {
    return eventBase_->isInEventBaseThread();
  }

  // from TimerFD
  void onTimeout() noexcept final;

 private:
  static void setActive(AsyncTimeout* obj, bool active);

  folly::EventBase* eventBase_{nullptr};
  AsyncTimeout* obj_{nullptr};
};
} // namespace folly
