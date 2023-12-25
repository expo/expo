#pragma once

#include <jsi/jsi.h>

#include <atomic>
#include <condition_variable>
#include <memory>
#include <queue>
#include <string>
#include <thread>
#include <utility>
#include <vector>

namespace reanimated {

struct AsyncQueueState {
  std::atomic_bool running{true};
  std::mutex mutex;
  std::condition_variable cv;
  std::queue<std::function<void()>> queue;
};

class AsyncQueue {
 public:
  explicit AsyncQueue(std::string name);

  ~AsyncQueue();

  void push(std::function<void()> &&job);

 private:
  const std::shared_ptr<AsyncQueueState> state_;
};

} // namespace reanimated
