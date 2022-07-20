#pragma once

#include <ReactCommon/CallInvoker.h>
#include <condition_variable>
#include <functional>
#include <memory>
#include <mutex>
#include <queue>
#include <thread>
#include <utility>

namespace devmenureanimated {

//
// Copyright (c) 2013 Juan Palacios juan.palacios.puyana@gmail.com
// Subject to the BSD 2-Clause License
// - see < http://opensource.org/licenses/BSD-2-Clause>
//
template <typename T>
class Queue {
 public:
  T pop() {
    std::unique_lock<std::mutex> mlock(mutex_);
    while (queue_.empty()) {
      cond_.wait(mlock);
    }
    auto item = queue_.front();
    queue_.pop();
    return item;
  }

  void pop(T &item) {
    std::unique_lock<std::mutex> mlock(mutex_);
    while (queue_.empty()) {
      cond_.wait(mlock);
    }
    item = queue_.front();
    queue_.pop();
  }

  void push(const T &item) {
    std::unique_lock<std::mutex> mlock(mutex_);
    queue_.push(item);
    mlock.unlock();
    cond_.notify_one();
  }

  void push(T &&item) {
    std::unique_lock<std::mutex> mlock(mutex_);
    queue_.push(std::move(item));
    mlock.unlock();
    cond_.notify_one();
  }

  size_t getSize() {
    std::unique_lock<std::mutex> mlock(mutex_);
    const size_t res = queue_.size();
    mlock.unlock();
    cond_.notify_one();
    return res;
  }

 private:
  std::queue<T> queue_;
  std::mutex mutex_;
  std::condition_variable cond_;
};

class RuntimeManager;

class Scheduler {
 public:
  Scheduler();
  void scheduleOnJS(std::function<void()> job);
  void setJSCallInvoker(
      std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker);
  void setRuntimeManager(std::shared_ptr<RuntimeManager> runtimeManager);
  virtual void scheduleOnUI(std::function<void()> job);
  virtual void triggerUI();
  virtual ~Scheduler();

 protected:
  std::atomic<bool> scheduledOnUI{};
  Queue<std::function<void()>> uiJobs;
  std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;
  std::weak_ptr<RuntimeManager> runtimeManager;
};

} // namespace devmenureanimated
