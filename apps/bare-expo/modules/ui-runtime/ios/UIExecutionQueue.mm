#import <Foundation/Foundation.h>
#include "UIExecutionQueue.h"
#include <deque>
#include <stdexcept>
#include <utility>

namespace expo::ui {

struct UIExecutionQueue::State {
  std::deque<Job> pending;
  ErrorHandler onError;
  bool posted = false;
  bool running = false;
  bool closed = false;
};

namespace {
// Reset the reentrancy guard even when a synchronous job throws.
struct RunningScope {
  bool &running;
  explicit RunningScope(bool &value) : running(value) { running = true; }
  ~RunningScope() { running = false; }
};
}

void UIExecutionQueue::requireUIThread()
{
  if (!NSThread.isMainThread) {
    throw std::logic_error("UIExecutionQueue must be accessed on the UI thread");
  }
}

UIExecutionQueue::UIExecutionQueue(ErrorHandler onError)
{
  requireUIThread();
  if (!onError) throw std::invalid_argument("A queued error handler is required");
  state_ = std::make_shared<State>();
  state_->onError = std::move(onError);
}

UIExecutionQueue::~UIExecutionQueue()
{
  if (!NSThread.isMainThread) std::terminate();
  close();
}

void UIExecutionQueue::schedule(Job job)
{
  requireUIThread();
  if (state_->closed) throw std::logic_error("UIExecutionQueue is closed");
  if (!job) throw std::invalid_argument("A job is required");
  state_->pending.push_back(std::move(job));
  postNext(state_);
}

void UIExecutionQueue::runNow(Job job)
{
  requireUIThread();
  // Retain state locally: a job may close or destroy its queue wrapper.
  auto state = state_;
  if (state->closed) throw std::logic_error("UIExecutionQueue is closed");
  if (state->running) throw std::logic_error("Recursive UI execution is not allowed; schedule instead");
  if (!job) throw std::invalid_argument("A job is required");
  try {
    RunningScope scope(state->running);
    job();
  } catch (...) {
    postNext(state);
    throw;
  }
  postNext(state);
}

void UIExecutionQueue::postNext(std::shared_ptr<State> state)
{
  if (state->closed || state->posted || state->pending.empty()) return;
  state->posted = true;
  // Capture state, never `this`. A posted block can outlive a closed wrapper.
  dispatch_async(dispatch_get_main_queue(), ^{
    state->posted = false;
    if (state->closed || state->pending.empty()) return;
    // Also protect against a nested native run loop entering a posted block.
    if (state->running) return; // The outer execution will post again on exit.
    {
      auto job = std::move(state->pending.front());
      state->pending.pop_front();
      RunningScope scope(state->running);
      std::string error;
      bool failed = false;
      try { job(); }
      catch (const std::exception &exception) { failed = true; error = exception.what(); }
      catch (...) { failed = true; error = "Unknown queued C++ exception"; }
      if (failed) {
        // Never let a C++ exception escape a GCD callback. A throwing error
        // handler violates the contract and cannot be reported recursively.
        try { state->onError(error); }
        catch (...) { std::terminate(); }
      }
    }
    // One job per dispatch, not a drain-until-empty loop. This lets other
    // main-queue work interleave, but is NOT a frame deadline or preemption.
    postNext(state);
  });
}

void UIExecutionQueue::close()
{
  requireUIThread();
  state_->closed = true;
  state_->pending.clear();
}

} // namespace expo::ui
