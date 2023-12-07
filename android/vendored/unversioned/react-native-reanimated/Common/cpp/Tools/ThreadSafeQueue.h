#pragma once

#include <condition_variable>
#include <mutex>
#include <queue>
#include <utility>

namespace reanimated {

//
// Copyright (c) 2013 Juan Palacios juan.palacios.puyana@gmail.com
// Subject to the BSD 2-Clause License
// - see < https://opensource.org/license/bsd-2-clause/ >
//
template <typename T>
class ThreadSafeQueue {
 public:
  T pop() {
    std::unique_lock<std::mutex> mlock(mutex_);
    while (queue_.empty()) {
      cond_.wait(mlock);
    }
    const auto item = queue_.front();
    queue_.pop();
    return item;
  }

  void push(T &&item) {
    std::unique_lock<std::mutex> mlock(mutex_);
    queue_.push(std::move(item));
    mlock.unlock();
    cond_.notify_one();
  }

  bool empty() const {
    std::unique_lock<std::mutex> mlock(mutex_);
    const auto res = queue_.empty();
    mlock.unlock();
    cond_.notify_one();
    return res;
  }

 private:
  std::queue<T> queue_;
  mutable std::mutex mutex_;
  mutable std::condition_variable cond_;
};

} // namespace reanimated
