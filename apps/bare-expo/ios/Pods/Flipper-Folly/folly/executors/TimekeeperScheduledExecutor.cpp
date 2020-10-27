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

#include <folly/executors/TimekeeperScheduledExecutor.h>
#include <folly/futures/Future.h>

namespace folly {

/* static */ Executor::KeepAlive<TimekeeperScheduledExecutor>
TimekeeperScheduledExecutor::create(
    Executor::KeepAlive<> parent,
    Function<std::shared_ptr<Timekeeper>()> getTimekeeper) {
  return makeKeepAlive<TimekeeperScheduledExecutor>(
      new TimekeeperScheduledExecutor(
          std::move(parent), std::move(getTimekeeper)));
}

void TimekeeperScheduledExecutor::run(Func func) {
  try {
    func();
  } catch (std::exception const& ex) {
    LOG(ERROR) << "func threw unhandled exception " << folly::exceptionStr(ex);
  } catch (...) {
    LOG(ERROR) << "func threw unhandled non-exception object";
  }
}

void TimekeeperScheduledExecutor::add(Func func) {
  parent_->add(
      [keepAlive = getKeepAliveToken(this), f = std::move(func)]() mutable {
        keepAlive->run(std::move(f));
      });
}

void TimekeeperScheduledExecutor::scheduleAt(
    Func&& func,
    ScheduledExecutor::TimePoint const& t) {
  auto delay = std::chrono::duration_cast<folly::Duration>(
      t - std::chrono::steady_clock::now());
  if (delay.count() > 0) {
    auto tk = getTimekeeper_();
    if (UNLIKELY(!tk)) {
      throw TimekeeperScheduledExecutorNoTimekeeper();
    }
    tk->after(delay)
        .via(parent_.copy())
        .thenValue([keepAlive = getKeepAliveToken(this), f = std::move(func)](
                       auto&&) mutable { keepAlive->run(std::move(f)); });
  } else {
    add(std::move(func));
  }
}

bool TimekeeperScheduledExecutor::keepAliveAcquire() {
  auto keepAliveCounter =
      keepAliveCounter_.fetch_add(1, std::memory_order_relaxed);
  DCHECK(keepAliveCounter > 0);
  return true;
}

void TimekeeperScheduledExecutor::keepAliveRelease() {
  auto keepAliveCounter =
      keepAliveCounter_.fetch_sub(1, std::memory_order_acq_rel);
  DCHECK(keepAliveCounter > 0);
  if (keepAliveCounter == 1) {
    delete this;
  }
}

} // namespace folly
