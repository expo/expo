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

#include <folly/experimental/STTimerFDTimeoutManager.h>
#include <folly/futures/Future.h>
#include <folly/io/async/EventBase.h>
#include <folly/io/async/HHWheelTimer.h>
#include <thread>

namespace folly {

class ThreadWheelTimekeeperHighRes : public Timekeeper {
 public:
  explicit ThreadWheelTimekeeperHighRes(
      std::chrono::microseconds intervalDuration = std::chrono::microseconds(
          HHWheelTimerHighRes::DEFAULT_TICK_INTERVAL));
  ~ThreadWheelTimekeeperHighRes() override;

  /// Implement the Timekeeper interface
  SemiFuture<Unit> after(HighResDuration) override;

 protected:
  folly::EventBase eventBase_;
  STTimerFDTimeoutManager timeoutMgr_;
  std::thread thread_;
  HHWheelTimerHighRes::UniquePtr wheelTimer_;
};

} // namespace folly
