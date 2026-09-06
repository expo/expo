#pragma once

#include <functional>
#include <memory>
#include <string>

namespace expo::ui {

// UI-thread-only execution policy, independent of Hermes and React.
// Background callers must first post to UI; this class never waits on a thread.
class UIExecutionQueue final {
 public:
  using Job = std::function<void()>;
  // Called on UI for queued job failures. Must not throw.
  using ErrorHandler = std::function<void(const std::string &)>;
  using Dispatcher = std::function<void(Job)>;

  explicit UIExecutionQueue(ErrorHandler onError);
  ~UIExecutionQueue();
  UIExecutionQueue(const UIExecutionQueue &) = delete;
  UIExecutionQueue &operator=(const UIExecutionQueue &) = delete;
  UIExecutionQueue(UIExecutionQueue &&) = delete;
  UIExecutionQueue &operator=(UIExecutionQueue &&) = delete;

  // Always deferred, FIFO. Jobs enqueued by a job go to the tail.
  void schedule(Job job);
  // A UI-only scheduling handle that does not keep the queue alive.
  // Calling it after close/destruction throws instead of dereferencing a wrapper.
  Dispatcher dispatcher() const;
  // Immediate, even ahead of pending jobs. Rejects recursive execution.
  // Errors propagate to this caller rather than the queued error handler.
  void runNow(Job job);
  // Cancels pending jobs. An already-running job is allowed to return.
  // Does NOT destroy a runtime or unmount a React root.
  void close();

 private:
  struct State;
  static void requireUIThread();
  static void postNext(std::shared_ptr<State> state);
  std::shared_ptr<State> state_;
};

} // namespace expo::ui
