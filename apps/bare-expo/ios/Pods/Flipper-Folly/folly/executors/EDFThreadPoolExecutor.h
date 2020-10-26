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

#include <atomic>
#include <cstddef>
#include <memory>
#include <vector>

#include <folly/executors/SoftRealTimeExecutor.h>
#include <folly/executors/ThreadPoolExecutor.h>
#include <folly/synchronization/LifoSem.h>

namespace folly {

/**
 * `EDFThreadPoolExecutor` is a `SoftRealTimeExecutor` that implements
 * the earliest-deadline-first scheduling policy.
 */
class EDFThreadPoolExecutor : public SoftRealTimeExecutor,
                              public ThreadPoolExecutor {
 public:
  class Task;
  class TaskQueue;

  static constexpr uint64_t kEarliestDeadline = 0;
  static constexpr uint64_t kLatestDeadline =
      std::numeric_limits<uint64_t>::max();

  explicit EDFThreadPoolExecutor(
      std::size_t numThreads,
      std::shared_ptr<ThreadFactory> threadFactory =
          std::make_shared<NamedThreadFactory>("EDFThreadPool"));

  ~EDFThreadPoolExecutor() override;

  using ThreadPoolExecutor::add;

  void add(Func f) override;
  void add(Func f, uint64_t deadline) override;
  void add(Func f, std::size_t total, uint64_t deadline);
  void add(std::vector<Func> fs, uint64_t deadline);

  folly::Executor::KeepAlive<> deadlineExecutor(uint64_t deadline);

 protected:
  void threadRun(ThreadPtr thread) override;
  void stopThreads(std::size_t numThreads) override;
  std::size_t getPendingTaskCountImpl() const override final;

 private:
  bool shouldStop();
  std::shared_ptr<Task> take();

  std::unique_ptr<TaskQueue> taskQueue_;
  LifoSem sem_;
  std::atomic<int> threadsToStop_{0};

  // All operations performed on `numIdleThreads_` explicitly specify memory
  // ordering of `std::memory_order_seq_cst`. This is due to `numIdleThreads_`
  // performing Dekker's algorithm with `numItems` prior to consumer threads
  // (workers) wait on `sem_`.
  std::atomic<std::size_t> numIdleThreads_{0};
};

} // namespace folly
