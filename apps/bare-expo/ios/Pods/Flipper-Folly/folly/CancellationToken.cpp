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

#include <folly/CancellationToken.h>
#include <folly/Optional.h>
#include <folly/synchronization/detail/Sleeper.h>

#include <glog/logging.h>

#include <algorithm>
#include <new>
#include <thread>
#include <tuple>

namespace folly {
namespace detail {

CancellationState::~CancellationState() {
  DCHECK(head_ == nullptr);
  DCHECK(!isLocked(state_.load(std::memory_order_relaxed)));
  DCHECK(
      state_.load(std::memory_order_relaxed) < kTokenReferenceCountIncrement);
}

bool CancellationState::tryAddCallback(
    CancellationCallback* callback,
    bool incrementRefCountIfSuccessful) noexcept {
  // Try to acquire the lock, but abandon trying to acquire the lock if
  // cancellation has already been requested (we can just immediately invoke
  // the callback) or if cancellation can never be requested (we can just
  // skip registration).
  if (!tryLock([callback](std::uint64_t oldState) noexcept {
        if (isCancellationRequested(oldState)) {
          callback->invokeCallback();
          return false;
        }
        return canBeCancelled(oldState);
      })) {
    return false;
  }

  // We've acquired the lock and cancellation has not yet been requested.
  // Push this callback onto the head of the list.
  if (head_ != nullptr) {
    head_->prevNext_ = &callback->next_;
  }
  callback->next_ = head_;
  callback->prevNext_ = &head_;
  head_ = callback;

  if (incrementRefCountIfSuccessful) {
    // Combine multiple atomic operations into a single atomic operation.
    unlockAndIncrementTokenCount();
  } else {
    unlock();
  }

  // Successfully added the callback.
  return true;
}

void CancellationState::removeCallback(
    CancellationCallback* callback) noexcept {
  DCHECK(callback != nullptr);

  lock();

  if (callback->prevNext_ != nullptr) {
    // Still registered in the list => not yet executed.
    // Just remove it from the list.
    *callback->prevNext_ = callback->next_;
    if (callback->next_ != nullptr) {
      callback->next_->prevNext_ = callback->prevNext_;
    }

    unlockAndDecrementTokenCount();
    return;
  }

  unlock();

  // Callback has either already executed or is executing concurrently on
  // another thread.

  if (signallingThreadId_ == std::this_thread::get_id()) {
    // Callback executed on this thread or is still currently executing
    // and is deregistering itself from within the callback.
    if (callback->destructorHasRunInsideCallback_ != nullptr) {
      // Currently inside the callback, let the requestCancellation() method
      // know the object is about to be destructed and that it should
      // not try to access the object when the callback returns.
      *callback->destructorHasRunInsideCallback_ = true;
    }
  } else {
    // Callback is currently executing on another thread, block until it
    // finishes executing.
    folly::detail::Sleeper sleeper;
    while (!callback->callbackCompleted_.load(std::memory_order_acquire)) {
      sleeper.wait();
    }
  }

  removeTokenReference();
}

bool CancellationState::requestCancellation() noexcept {
  if (!tryLockAndCancelUnlessCancelled()) {
    // Was already marked as cancelled
    return true;
  }

  // This thread marked as cancelled and acquired the lock

  signallingThreadId_ = std::this_thread::get_id();

  while (head_ != nullptr) {
    // Dequeue the first item on the queue.
    CancellationCallback* callback = head_;
    head_ = callback->next_;
    const bool anyMore = head_ != nullptr;
    if (anyMore) {
      head_->prevNext_ = &head_;
    }
    // Mark this item as removed from the list.
    callback->prevNext_ = nullptr;

    // Don't hold the lock while executing the callback
    // as we don't want to block other threads from
    // deregistering callbacks.
    unlock();

    // TRICKY: Need to store a flag on the stack here that the callback
    // can use to signal that the destructor was executed inline
    // during the call.
    // If the destructor was executed inline then it's not safe to
    // dereference 'callback' after 'invokeCallback()' returns.
    // If the destructor runs on some other thread then the other
    // thread will block waiting for this thread to signal that the
    // callback has finished executing.
    bool destructorHasRunInsideCallback = false;
    callback->destructorHasRunInsideCallback_ = &destructorHasRunInsideCallback;

    callback->invokeCallback();

    if (!destructorHasRunInsideCallback) {
      callback->destructorHasRunInsideCallback_ = nullptr;
      callback->callbackCompleted_.store(true, std::memory_order_release);
    }

    if (!anyMore) {
      // This was the last item in the queue when we dequeued it.
      // No more items should be added to the queue after we have
      // marked the state as cancelled, only removed from the queue.
      // Avoid acquring/releasing the lock in this case.
      return false;
    }

    lock();
  }

  unlock();

  return false;
}

void CancellationState::lock() noexcept {
  folly::detail::Sleeper sleeper;
  std::uint64_t oldState = state_.load(std::memory_order_relaxed);
  do {
    while (isLocked(oldState)) {
      sleeper.wait();
      oldState = state_.load(std::memory_order_relaxed);
    }
  } while (!state_.compare_exchange_weak(
      oldState,
      oldState | kLockedFlag,
      std::memory_order_acquire,
      std::memory_order_relaxed));
}

void CancellationState::unlock() noexcept {
  state_.fetch_sub(kLockedFlag, std::memory_order_release);
}

void CancellationState::unlockAndIncrementTokenCount() noexcept {
  state_.fetch_sub(
      kLockedFlag - kTokenReferenceCountIncrement, std::memory_order_release);
}

void CancellationState::unlockAndDecrementTokenCount() noexcept {
  auto oldState = state_.fetch_sub(
      kLockedFlag + kTokenReferenceCountIncrement, std::memory_order_acq_rel);
  if (oldState < (kLockedFlag + 2 * kTokenReferenceCountIncrement)) {
    delete this;
  }
}

bool CancellationState::tryLockAndCancelUnlessCancelled() noexcept {
  folly::detail::Sleeper sleeper;
  std::uint64_t oldState = state_.load(std::memory_order_acquire);
  while (true) {
    if (isCancellationRequested(oldState)) {
      return false;
    } else if (isLocked(oldState)) {
      sleeper.wait();
      oldState = state_.load(std::memory_order_acquire);
    } else if (state_.compare_exchange_weak(
                   oldState,
                   oldState | kLockedFlag | kCancellationRequestedFlag,
                   std::memory_order_acq_rel,
                   std::memory_order_acquire)) {
      return true;
    }
  }
}

template <typename Predicate>
bool CancellationState::tryLock(Predicate predicate) noexcept {
  folly::detail::Sleeper sleeper;
  std::uint64_t oldState = state_.load(std::memory_order_acquire);
  while (true) {
    if (!predicate(oldState)) {
      return false;
    } else if (isLocked(oldState)) {
      sleeper.wait();
      oldState = state_.load(std::memory_order_acquire);
    } else if (state_.compare_exchange_weak(
                   oldState,
                   oldState | kLockedFlag,
                   std::memory_order_acquire)) {
      return true;
    }
  }
}

} // namespace detail
} // namespace folly
