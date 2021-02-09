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

#include <glog/logging.h>

namespace folly {
namespace detail {
template <typename Callback>
class ExecutorWithPriorityImpl : public virtual Executor {
 public:
  static Executor::KeepAlive<ExecutorWithPriorityImpl<std::decay_t<Callback>>>
  create(Executor::KeepAlive<Executor> executor, Callback&& callback) {
    return makeKeepAlive(new ExecutorWithPriorityImpl<std::decay_t<Callback>>(
        executor, std::move(callback)));
  }
  ExecutorWithPriorityImpl(ExecutorWithPriorityImpl const&) = delete;
  ExecutorWithPriorityImpl& operator=(ExecutorWithPriorityImpl const&) = delete;
  ExecutorWithPriorityImpl(ExecutorWithPriorityImpl&&) = delete;
  ExecutorWithPriorityImpl& operator=(ExecutorWithPriorityImpl&&) = delete;

  void add(Func func) override {
    int8_t priority = callback_();
    executor_->addWithPriority(std::move(func), priority);
  }

 protected:
  bool keepAliveAcquire() override {
    auto keepAliveCounter =
        keepAliveCounter_.fetch_add(1, std::memory_order_relaxed);
    DCHECK(keepAliveCounter > 0);
    return true;
  }

  void keepAliveRelease() override {
    auto keepAliveCounter =
        keepAliveCounter_.fetch_sub(1, std::memory_order_acq_rel);
    DCHECK(keepAliveCounter > 0);
    if (keepAliveCounter == 1) {
      delete this;
    }
  }

 private:
  ExecutorWithPriorityImpl(
      Executor::KeepAlive<Executor> executor,
      Callback&& callback)
      : executor_(std::move(executor)), callback_(std::move(callback)) {}
  std::atomic<ssize_t> keepAliveCounter_{1};
  Executor::KeepAlive<Executor> executor_;
  Callback callback_;
};
} // namespace detail

template <typename Callback>
Executor::KeepAlive<> ExecutorWithPriority::createDynamic(
    Executor::KeepAlive<Executor> executor,
    Callback&& callback) {
  return detail::ExecutorWithPriorityImpl<std::decay_t<Callback>>::create(
      executor, std::move(callback));
}
} // namespace folly
