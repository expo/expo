#pragma once

#include <condition_variable>
#include <mutex>
#include <queue>
#include <utility>

namespace reanimated {

//
// Copyright (c) 2013 Juan Palacios juan.palacios.puyana@gmail.com
// Subject to the BSD 2-Clause License
// - see < http://opensource.org/licenses/BSD-2-Clause>
//
template <typename T>
class ThreadSafeQueue {
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

} // namespace reanimated
