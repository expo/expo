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

#include <glog/logging.h>
#include <atomic>

#include <folly/executors/ScheduledExecutor.h>
#include <folly/futures/Future.h>

namespace folly {

struct FOLLY_EXPORT TimekeeperScheduledExecutorNoTimekeeper
    : public std::logic_error {
  TimekeeperScheduledExecutorNoTimekeeper()
      : std::logic_error("No Timekeeper available") {}
};

// This class turns a Executor into a ScheduledExecutor.
class TimekeeperScheduledExecutor : public ScheduledExecutor {
 public:
  TimekeeperScheduledExecutor(TimekeeperScheduledExecutor const&) = delete;
  TimekeeperScheduledExecutor& operator=(TimekeeperScheduledExecutor const&) =
      delete;
  TimekeeperScheduledExecutor(TimekeeperScheduledExecutor&&) = delete;
  TimekeeperScheduledExecutor& operator=(TimekeeperScheduledExecutor&&) =
      delete;

  static Executor::KeepAlive<TimekeeperScheduledExecutor> create(
      Executor::KeepAlive<> parent,
      Function<std::shared_ptr<Timekeeper>()> getTimekeeper =
          detail::getTimekeeperSingleton);

  virtual void add(Func func) override;

  virtual void scheduleAt(Func&& func, ScheduledExecutor::TimePoint const& t)
      override;

 protected:
  bool keepAliveAcquire() override;
  void keepAliveRelease() override;

 private:
  TimekeeperScheduledExecutor(
      KeepAlive<Executor>&& parent,
      Function<std::shared_ptr<Timekeeper>()> getTimekeeper)
      : parent_(std::move(parent)), getTimekeeper_(std::move(getTimekeeper)) {}

  ~TimekeeperScheduledExecutor() {
    DCHECK(!keepAliveCounter_);
  }

  void run(Func);

  KeepAlive<Executor> parent_;
  Function<std::shared_ptr<Timekeeper>()> getTimekeeper_;
  std::atomic<ssize_t> keepAliveCounter_{1};
};

} // namespace folly
