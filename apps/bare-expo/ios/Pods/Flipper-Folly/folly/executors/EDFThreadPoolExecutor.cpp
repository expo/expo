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

#include <algorithm>
#include <array>
#include <atomic>
#include <chrono>
#include <cstddef>
#include <exception>
#include <limits>
#include <memory>
#include <queue>
#include <utility>
#include <vector>

#include <folly/ScopeGuard.h>
#include <folly/executors/EDFThreadPoolExecutor.h>

namespace folly {
namespace {
constexpr folly::StringPiece executorName = "EDFThreadPoolExecutor";
}

class EDFThreadPoolExecutor::Task {
 public:
  explicit Task(Func&& f, int repeat, uint64_t deadline)
      : f_(std::move(f)), total_(repeat), deadline_(deadline) {}

  explicit Task(std::vector<Func>&& fs, uint64_t deadline)
      : fs_(std::move(fs)), total_(fs_.size()), deadline_(deadline) {}

  uint64_t getDeadline() const {
    return deadline_;
  }

  bool isDone() const {
    return iter_.load(std::memory_order_relaxed) >= total_;
  }

  int next() {
    if (isDone()) {
      return -1;
    }

    int result = iter_.fetch_add(1, std::memory_order_relaxed);
    return result < total_ ? result : -1;
  }

  void run(int i) {
    folly::RequestContextScopeGuard guard(context_);
    if (f_) {
      f_();
      if (i >= total_ - 1) {
        std::exchange(f_, nullptr);
      }
    } else {
      DCHECK(0 <= i && i < total_);
      fs_[i]();
      std::exchange(fs_[i], nullptr);
    }
  }

  Func f_;
  std::vector<Func> fs_;
  std::atomic<int> iter_{0};
  int total_;
  uint64_t deadline_;
  TaskStats stats_;
  std::shared_ptr<RequestContext> context_ = RequestContext::saveContext();
  std::chrono::steady_clock::time_point enqueueTime_ =
      std::chrono::steady_clock::now();
};

class EDFThreadPoolExecutor::TaskQueue {
 public:
  using TaskPtr = std::shared_ptr<Task>;

  // This is not a `Synchronized` because we perform a few "peek" operations.
  struct Bucket {
    SharedMutex mutex;

    struct Compare {
      bool operator()(const TaskPtr& lhs, const TaskPtr& rhs) const {
        return lhs->getDeadline() > rhs->getDeadline();
      }
    };

    std::priority_queue<TaskPtr, std::vector<TaskPtr>, Compare> tasks;
    std::atomic<bool> empty{true};
  };

  static constexpr std::size_t kNumBuckets = 2 << 5;

  explicit TaskQueue()
      : buckets_{}, curDeadline_(kLatestDeadline), numItems_(0) {}

  void push(TaskPtr task) {
    auto deadline = task->getDeadline();
    auto& bucket = getBucket(deadline);
    {
      SharedMutex::WriteHolder guard(&bucket.mutex);
      bucket.tasks.push(std::move(task));
      bucket.empty.store(bucket.tasks.empty(), std::memory_order_relaxed);
    }

    numItems_.fetch_add(1, std::memory_order_seq_cst);

    // Update current earliest deadline if necessary
    uint64_t curDeadline = curDeadline_.load(std::memory_order_relaxed);
    do {
      if (curDeadline <= deadline) {
        break;
      }
    } while (!curDeadline_.compare_exchange_weak(
        curDeadline, deadline, std::memory_order_relaxed));
  }

  TaskPtr pop() {
    bool needDeadlineUpdate = false;
    for (;;) {
      if (numItems_.load(std::memory_order_seq_cst) == 0) {
        return nullptr;
      }

      auto curDeadline = curDeadline_.load(std::memory_order_relaxed);
      auto& bucket = getBucket(curDeadline);

      if (needDeadlineUpdate || bucket.empty.load(std::memory_order_relaxed)) {
        // Try setting the next earliest deadline. However no need to
        // enforce as there might be insertion happening.
        // If there is no next deadline, we set deadline to `kLatestDeadline`.
        curDeadline_.compare_exchange_weak(
            curDeadline,
            findNextDeadline(curDeadline),
            std::memory_order_relaxed);
        needDeadlineUpdate = false;
        continue;
      }

      {
        // Fast path. Take bucket reader lock.
        SharedMutex::ReadHolder guard(&bucket.mutex);
        if (bucket.tasks.empty()) {
          continue;
        }
        const auto& task = bucket.tasks.top();
        if (!task->isDone() && task->getDeadline() == curDeadline) {
          return task;
        }
        // If the task is finished already, fall through to remove it.
      }

      {
        // Take the writer lock to clean up the finished task.
        SharedMutex::WriteHolder guard(&bucket.mutex);
        if (bucket.tasks.empty()) {
          continue;
        }
        const auto& task = bucket.tasks.top();
        if (task->isDone()) {
          // Current task finished. Remove from the queue.
          bucket.tasks.pop();
          bucket.empty.store(bucket.tasks.empty(), std::memory_order_relaxed);
          numItems_.fetch_sub(1, std::memory_order_seq_cst);
        }
      }

      // We may have finished processing the current task / bucket. Going back
      // to the beginning of the loop to find the next bucket.
      needDeadlineUpdate = true;
    }
  }

  std::size_t size() const {
    return numItems_.load(std::memory_order_seq_cst);
  }

 private:
  Bucket& getBucket(uint64_t deadline) {
    return buckets_[deadline % kNumBuckets];
  }

  uint64_t findNextDeadline(uint64_t prevDeadline) {
    auto begin = prevDeadline % kNumBuckets;

    uint64_t earliestDeadline = kLatestDeadline;
    for (std::size_t i = 0; i < kNumBuckets; ++i) {
      auto& bucket = buckets_[(begin + i) % kNumBuckets];

      // Peek without locking first.
      if (bucket.empty.load(std::memory_order_relaxed)) {
        continue;
      }

      SharedMutex::ReadHolder guard(&bucket.mutex);
      auto curDeadline = curDeadline_.load(std::memory_order_relaxed);
      if (prevDeadline != curDeadline) {
        // Bail out early if something already happened
        return curDeadline;
      }

      // Verify again after locking
      if (bucket.tasks.empty()) {
        continue;
      }

      const auto& task = bucket.tasks.top();
      auto deadline = task->getDeadline();

      if (deadline < earliestDeadline) {
        earliestDeadline = deadline;
      }

      if ((deadline <= prevDeadline) ||
          (deadline - prevDeadline < kNumBuckets)) {
        // Found the next highest priority, or new tasks were added.
        // No need to scan anymore.
        break;
      }
    }

    return earliestDeadline;
  }

  std::array<Bucket, kNumBuckets> buckets_;
  std::atomic<uint64_t> curDeadline_;

  // All operations performed on `numItems_` explicitly specify memory
  // ordering of `std::memory_order_seq_cst`. This is due to `numItems_`
  // performing Dekker's algorithm with `numIdleThreads_` prior to consumer
  // threads (workers) wait on `sem_`.
  std::atomic<std::size_t> numItems_;
};

EDFThreadPoolExecutor::EDFThreadPoolExecutor(
    std::size_t numThreads,
    std::shared_ptr<ThreadFactory> threadFactory)
    : ThreadPoolExecutor(numThreads, numThreads, std::move(threadFactory)),
      taskQueue_(std::make_unique<TaskQueue>()) {
  setNumThreads(numThreads);
  registerThreadPoolExecutor(this);
}

EDFThreadPoolExecutor::~EDFThreadPoolExecutor() {
  deregisterThreadPoolExecutor(this);
  stop();
}

void EDFThreadPoolExecutor::add(Func f) {
  add(std::move(f), kLatestDeadline);
}

void EDFThreadPoolExecutor::add(Func f, uint64_t deadline) {
  add(std::move(f), 1, deadline);
}

void EDFThreadPoolExecutor::add(Func f, std::size_t total, uint64_t deadline) {
  if (UNLIKELY(isJoin_.load(std::memory_order_relaxed) || total == 0)) {
    return;
  }

  taskQueue_->push(std::make_shared<Task>(std::move(f), total, deadline));

  auto numIdleThreads = numIdleThreads_.load(std::memory_order_seq_cst);
  if (numIdleThreads > 0) {
    // If idle threads are available notify them, otherwise all worker threads
    // are running and will get around to this task in time.
    sem_.post(std::min(total, numIdleThreads));
  }
}

void EDFThreadPoolExecutor::add(std::vector<Func> fs, uint64_t deadline) {
  if (UNLIKELY(fs.empty())) {
    return;
  }

  auto total = fs.size();
  taskQueue_->push(std::make_shared<Task>(std::move(fs), deadline));

  auto numIdleThreads = numIdleThreads_.load(std::memory_order_seq_cst);
  if (numIdleThreads > 0) {
    // If idle threads are available notify them, otherwise all worker threads
    // are running and will get around to this task in time.
    sem_.post(std::min(total, numIdleThreads));
  }
}

folly::Executor::KeepAlive<> EDFThreadPoolExecutor::deadlineExecutor(
    uint64_t deadline) {
  class DeadlineExecutor : public folly::Executor {
   public:
    static KeepAlive<> create(
        uint64_t deadline,
        KeepAlive<EDFThreadPoolExecutor> executor) {
      return makeKeepAlive(new DeadlineExecutor(deadline, std::move(executor)));
    }

    void add(folly::Func f) override {
      executor_->add(std::move(f), deadline_);
    }

    bool keepAliveAcquire() override {
      const auto count =
          keepAliveCount_.fetch_add(1, std::memory_order_relaxed);
      DCHECK_GT(count, 0);
      return true;
    }

    void keepAliveRelease() override {
      const auto count =
          keepAliveCount_.fetch_sub(1, std::memory_order_acq_rel);
      DCHECK_GT(count, 0);
      if (count == 1) {
        delete this;
      }
    }

   private:
    DeadlineExecutor(
        uint64_t deadline,
        KeepAlive<EDFThreadPoolExecutor> executor)
        : deadline_(deadline), executor_(std::move(executor)) {}

    std::atomic<size_t> keepAliveCount_{1};
    uint64_t deadline_;
    KeepAlive<EDFThreadPoolExecutor> executor_;
  };
  return DeadlineExecutor::create(deadline, getKeepAliveToken(this));
}

void EDFThreadPoolExecutor::threadRun(ThreadPtr thread) {
  this->threadPoolHook_.registerThread();
  auto guard = folly::makeBlockingDisallowedGuard(executorName);

  thread->startupBaton.post();
  for (;;) {
    auto task = take();

    // Handle thread stopping
    if (UNLIKELY(!task)) {
      // Actually remove the thread from the list.
      SharedMutex::WriteHolder w{&threadListLock_};
      for (auto& o : observers_) {
        o->threadStopped(thread.get());
      }
      threadList_.remove(thread);
      stoppedThreads_.add(thread);
      return;
    }

    int iter = task->next();
    if (UNLIKELY(iter < 0)) {
      // This task is already finished
      continue;
    }

    thread->idle = false;
    auto startTime = std::chrono::steady_clock::now();
    task->stats_.waitTime = startTime - task->enqueueTime_;
    try {
      task->run(iter);
    } catch (const std::exception& e) {
      LOG(ERROR) << "EDFThreadPoolExecutor: func threw unhandled "
                 << typeid(e).name() << " exception: " << e.what();
    } catch (...) {
      LOG(ERROR)
          << "EDFThreadPoolExecutor: func threw unhandled non-exception object";
    }
    task->stats_.runTime = std::chrono::steady_clock::now() - startTime;
    thread->idle = true;
    thread->lastActiveTime = std::chrono::steady_clock::now();
    thread->taskStatsCallbacks->callbackList.withRLock([&](auto& callbacks) {
      *thread->taskStatsCallbacks->inCallback = true;
      SCOPE_EXIT {
        *thread->taskStatsCallbacks->inCallback = false;
      };
      try {
        for (auto& callback : callbacks) {
          callback(task->stats_);
        }
      } catch (const std::exception& e) {
        LOG(ERROR) << "EDFThreadPoolExecutor: task stats callback threw "
                      "unhandled "
                   << typeid(e).name() << " exception: " << e.what();
      } catch (...) {
        LOG(ERROR) << "EDFThreadPoolExecutor: task stats callback threw "
                      "unhandled non-exception object";
      }
    });
  }
}

// threadListLock_ is writelocked.
void EDFThreadPoolExecutor::stopThreads(std::size_t numThreads) {
  threadsToStop_.fetch_add(numThreads, std::memory_order_relaxed);
  sem_.post(numThreads);
}

// threadListLock_ is read (or write) locked.
std::size_t EDFThreadPoolExecutor::getPendingTaskCountImpl() const {
  return taskQueue_->size();
}

bool EDFThreadPoolExecutor::shouldStop() {
  // in normal cases, only do a read (prevents cache line bounces)
  if (threadsToStop_.load(std::memory_order_relaxed) <= 0 ||
      isJoin_.load(std::memory_order_relaxed)) {
    return false;
  }
  // modify only if needed
  if (threadsToStop_.fetch_sub(1, std::memory_order_relaxed) > 0) {
    return true;
  } else {
    threadsToStop_.fetch_add(1, std::memory_order_relaxed);
    return false;
  }
}

std::shared_ptr<EDFThreadPoolExecutor::Task> EDFThreadPoolExecutor::take() {
  if (UNLIKELY(shouldStop())) {
    return nullptr;
  }

  if (auto task = taskQueue_->pop()) {
    return task;
  }

  if (UNLIKELY(isJoin_.load(std::memory_order_relaxed))) {
    return nullptr;
  }

  // No tasks on the horizon, so go sleep
  numIdleThreads_.fetch_add(1, std::memory_order_seq_cst);

  SCOPE_EXIT {
    numIdleThreads_.fetch_sub(1, std::memory_order_seq_cst);
  };

  for (;;) {
    if (UNLIKELY(shouldStop())) {
      return nullptr;
    }

    if (auto task = taskQueue_->pop()) {
      // It's possible to return a finished task here, in which case
      // the worker will call this function again.
      return task;
    }

    if (UNLIKELY(isJoin_.load(std::memory_order_relaxed))) {
      return nullptr;
    }

    sem_.wait();
  }
}

} // namespace folly
