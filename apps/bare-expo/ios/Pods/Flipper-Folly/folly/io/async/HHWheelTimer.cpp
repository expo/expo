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

#include <folly/io/async/HHWheelTimer.h>

#include <cassert>

#include <folly/Memory.h>
#include <folly/Optional.h>
#include <folly/ScopeGuard.h>
#include <folly/container/BitIterator.h>
#include <folly/io/async/Request.h>
#include <folly/lang/Bits.h>

namespace folly {
/**
 * We want to select the default interval carefully.
 * An interval of 10ms will give us 10ms * WHEEL_SIZE^WHEEL_BUCKETS
 * for the largest timeout possible, or about 497 days.
 *
 * For a lower bound, we want a reasonable limit on local IO, 10ms
 * seems short enough
 *
 * A shorter interval also has CPU implications, less than 1ms might
 * start showing up in cpu perf.  Also, it might not be possible to set
 * tick interval less than 10ms on older kernels.
 */

/*
 * For high res timers:
 * An interval of 200usec will give us 200usec * WHEEL_SIZE^WHEEL_BUCKETS
 * for the largest timeout possible, or about 9 days.
 */

template <class Duration>
int HHWheelTimerBase<Duration>::DEFAULT_TICK_INTERVAL =
    detail::HHWheelTimerDurationConst<Duration>::DEFAULT_TICK_INTERVAL;

template <class Duration>
HHWheelTimerBase<Duration>::Callback::Callback() = default;

template <class Duration>
HHWheelTimerBase<Duration>::Callback::~Callback() {
  if (isScheduled()) {
    cancelTimeout();
  }
}

template <class Duration>
void HHWheelTimerBase<Duration>::Callback::setScheduled(
    HHWheelTimerBase* wheel,
    std::chrono::steady_clock::time_point deadline) {
  assert(wheel_ == nullptr);
  assert(expiration_ == decltype(expiration_){});

  wheel_ = wheel;
  expiration_ = deadline;
}

template <class Duration>
void HHWheelTimerBase<Duration>::Callback::cancelTimeoutImpl() {
  if (--wheel_->count_ <= 0) {
    assert(wheel_->count_ == 0);
    wheel_->AsyncTimeout::cancelTimeout();
  }
  unlink();
  if ((-1 != bucket_) && (wheel_->buckets_[0][bucket_].empty())) {
    auto bi = makeBitIterator(wheel_->bitmap_.begin());
    *(bi + bucket_) = false;
  }

  wheel_ = nullptr;
  expiration_ = {};
}

template <class Duration>
HHWheelTimerBase<Duration>::HHWheelTimerBase(
    folly::TimeoutManager* timeoutMananger,
    Duration intervalDuration,
    AsyncTimeout::InternalEnum internal,
    Duration defaultTimeoutDuration)
    : AsyncTimeout(timeoutMananger, internal),
      interval_(intervalDuration),
      defaultTimeout_(defaultTimeoutDuration),
      expireTick_(1),
      count_(0),
      startTime_(getCurTime()),
      processingCallbacksGuard_(nullptr) {
  bitmap_.fill(0);
}

template <class Duration>
HHWheelTimerBase<Duration>::~HHWheelTimerBase() {
  // Ensure this gets done, but right before destruction finishes.
  auto destructionPublisherGuard = folly::makeGuard([&] {
    // Inform the subscriber that this instance is doomed.
    if (processingCallbacksGuard_) {
      *processingCallbacksGuard_ = true;
    }
  });
  cancelAll();
}

template <class Duration>
void HHWheelTimerBase<Duration>::scheduleTimeoutImpl(
    Callback* callback,
    int64_t dueTick,
    int64_t nextTickToProcess,
    int64_t nextTick) {
  int64_t diff = dueTick - nextTickToProcess;
  CallbackList* list;

  auto bi = makeBitIterator(bitmap_.begin());

  if (diff < 0) {
    list = &buckets_[0][nextTick & WHEEL_MASK];
    *(bi + (nextTick & WHEEL_MASK)) = true;
    callback->bucket_ = nextTick & WHEEL_MASK;
  } else if (diff < WHEEL_SIZE) {
    list = &buckets_[0][dueTick & WHEEL_MASK];
    *(bi + (dueTick & WHEEL_MASK)) = true;
    callback->bucket_ = dueTick & WHEEL_MASK;
  } else if (diff < 1 << (2 * WHEEL_BITS)) {
    list = &buckets_[1][(dueTick >> WHEEL_BITS) & WHEEL_MASK];
  } else if (diff < 1 << (3 * WHEEL_BITS)) {
    list = &buckets_[2][(dueTick >> 2 * WHEEL_BITS) & WHEEL_MASK];
  } else {
    /* in largest slot */
    if (diff > LARGEST_SLOT) {
      diff = LARGEST_SLOT;
      dueTick = diff + nextTickToProcess;
    }
    list = &buckets_[3][(dueTick >> 3 * WHEEL_BITS) & WHEEL_MASK];
  }
  list->push_back(*callback);
}

template <class Duration>
void HHWheelTimerBase<Duration>::scheduleTimeout(
    Callback* callback,
    Duration timeout) {
  // Make sure that the timeout is not negative.
  timeout = std::max(timeout, Duration::zero());
  // Cancel the callback if it happens to be scheduled already.
  callback->cancelTimeout();
  callback->requestContext_ = RequestContext::saveContext();

  count_++;

  auto now = getCurTime();
  auto nextTick = calcNextTick(now);
  callback->setScheduled(this, now + timeout);

  // There are three possible scenarios:
  //   - we are currently inside of HHWheelTimerBase<Duration>::timeoutExpired.
  //   In this case,
  //     we need to use its last tick as a base for computations
  //   - HHWheelTimerBase tick timeout is already scheduled. In this case,
  //     we need to use its scheduled tick as a base.
  //   - none of the above are true. In this case, it's safe to use the nextTick
  //     as a base.
  int64_t baseTick = nextTick;
  if (processingCallbacksGuard_ || isScheduled()) {
    baseTick = std::min(expireTick_, nextTick);
  }
  int64_t ticks = timeToWheelTicks(timeout);
  int64_t due = ticks + nextTick;
  scheduleTimeoutImpl(callback, due, baseTick, nextTick);

  /* If we're calling callbacks, timer will be reset after all
   * callbacks are called.
   */
  if (!processingCallbacksGuard_) {
    // Check if we need to reschedule the timer.
    // If the wheel timeout is already scheduled, then we need to reschedule
    // only if our due is earlier than the current scheduled one.
    // If it's not scheduled, we need to schedule it either for the first tick
    // of next wheel epoch or our due tick, whichever is earlier.
    if (!isScheduled() && !inSameEpoch(nextTick - 1, due)) {
      scheduleNextTimeout(nextTick, WHEEL_SIZE - ((nextTick - 1) & WHEEL_MASK));
    } else if (!isScheduled() || due < expireTick_) {
      scheduleNextTimeout(nextTick, ticks + 1);
    }
  }
}

template <class Duration>
void HHWheelTimerBase<Duration>::scheduleTimeout(Callback* callback) {
  CHECK(Duration(-1) != defaultTimeout_)
      << "Default timeout was not initialized";
  scheduleTimeout(callback, defaultTimeout_);
}

template <class Duration>
bool HHWheelTimerBase<Duration>::cascadeTimers(
    int bucket,
    int tick,
    const std::chrono::steady_clock::time_point curTime) {
  CallbackList cbs;
  cbs.swap(buckets_[bucket][tick]);
  auto nextTick = calcNextTick(curTime);
  while (!cbs.empty()) {
    auto* cb = &cbs.front();
    cbs.pop_front();
    scheduleTimeoutImpl(
        cb,
        nextTick + timeToWheelTicks(cb->getTimeRemaining(curTime)),
        expireTick_,
        nextTick);
  }

  // If tick is zero, timeoutExpired will cascade the next bucket.
  return tick == 0;
}

template <class Duration>
void HHWheelTimerBase<Duration>::scheduleTimeoutInternal(Duration timeout) {
  this->AsyncTimeout::scheduleTimeout(timeout);
}

template <class Duration>
void HHWheelTimerBase<Duration>::timeoutExpired() noexcept {
  auto curTime = getCurTime();
  auto nextTick = calcNextTick(curTime);

  // If the last smart pointer for "this" is reset inside the callback's
  // timeoutExpired(), then the guard will detect that it is time to bail from
  // this method.
  auto isDestroyed = false;
  // If scheduleTimeout is called from a callback in this function, it may
  // cause inconsistencies in the state of this object. As such, we need
  // to treat these calls slightly differently.
  CHECK(!processingCallbacksGuard_);
  processingCallbacksGuard_ = &isDestroyed;
  auto reEntryGuard = folly::makeGuard([&] {
    if (!isDestroyed) {
      processingCallbacksGuard_ = nullptr;
    }
  });

  // timeoutExpired() can only be invoked directly from the event base loop.
  // It should never be invoked recursively.
  //
  while (expireTick_ < nextTick) {
    int idx = expireTick_ & WHEEL_MASK;

    if (idx == 0) {
      // Cascade timers
      if (cascadeTimers(1, (expireTick_ >> WHEEL_BITS) & WHEEL_MASK, curTime) &&
          cascadeTimers(
              2, (expireTick_ >> (2 * WHEEL_BITS)) & WHEEL_MASK, curTime)) {
        cascadeTimers(
            3, (expireTick_ >> (3 * WHEEL_BITS)) & WHEEL_MASK, curTime);
      }
    }

    auto bi = makeBitIterator(bitmap_.begin());
    *(bi + idx) = false;

    expireTick_++;
    CallbackList* cbs = &buckets_[0][idx];
    while (!cbs->empty()) {
      auto* cb = &cbs->front();
      cbs->pop_front();
      timeoutsToRunNow_.push_back(*cb);
    }
  }

  while (!timeoutsToRunNow_.empty()) {
    auto* cb = &timeoutsToRunNow_.front();
    timeoutsToRunNow_.pop_front();
    count_--;
    cb->wheel_ = nullptr;
    cb->expiration_ = {};
    RequestContextScopeGuard rctx(cb->requestContext_);
    cb->timeoutExpired();
    if (isDestroyed) {
      // The HHWheelTimerBase itself has been destroyed. The other callbacks
      // will have been cancelled from the destructor. Bail before causing
      // damage.
      return;
    }
  }

  // We don't need to schedule a new timeout if there're nothing in the wheel.
  if (count_ > 0) {
    scheduleNextTimeout(expireTick_);
  }
}

template <class Duration>
size_t HHWheelTimerBase<Duration>::cancelAll() {
  size_t count = 0;

  if (count_ != 0) {
    const std::size_t numElements = WHEEL_BUCKETS * WHEEL_SIZE;
    auto maxBuckets = std::min(numElements, count_);
    auto buckets = std::make_unique<CallbackList[]>(maxBuckets);
    size_t countBuckets = 0;
    for (auto& tick : buckets_) {
      for (auto& bucket : tick) {
        if (bucket.empty()) {
          continue;
        }
        count += bucket.size();
        std::swap(bucket, buckets[countBuckets++]);
        if (count >= count_) {
          break;
        }
      }
    }

    for (size_t i = 0; i < countBuckets; ++i) {
      cancelTimeoutsFromList(buckets[i]);
    }
    // Swap the list to prevent potential recursion if cancelAll is called by
    // one of the callbacks.
    CallbackList timeoutsToRunNow;
    timeoutsToRunNow.swap(timeoutsToRunNow_);
    count += cancelTimeoutsFromList(timeoutsToRunNow);
  }

  return count;
}

template <class Duration>
void HHWheelTimerBase<Duration>::scheduleNextTimeout(int64_t nextTick) {
  int64_t tick = 1;

  if (nextTick & WHEEL_MASK) {
    auto bi = makeBitIterator(bitmap_.begin());
    auto bi_end = makeBitIterator(bitmap_.end());
    auto it = folly::findFirstSet(bi + (nextTick & WHEEL_MASK), bi_end);
    if (it == bi_end) {
      tick = WHEEL_SIZE - ((nextTick - 1) & WHEEL_MASK);
    } else {
      tick = std::distance(bi + (nextTick & WHEEL_MASK), it) + 1;
    }
  }

  scheduleNextTimeout(nextTick, tick);
}

template <class Duration>
void HHWheelTimerBase<Duration>::scheduleNextTimeout(
    int64_t nextTick,
    int64_t ticks) {
  scheduleTimeoutInternal(interval_ * ticks);
  expireTick_ = ticks + nextTick - 1;
}

template <class Duration>
size_t HHWheelTimerBase<Duration>::cancelTimeoutsFromList(
    CallbackList& timeouts) {
  size_t count = 0;
  while (!timeouts.empty()) {
    ++count;
    auto& cb = timeouts.front();
    cb.cancelTimeout();
    cb.callbackCanceled();
  }
  return count;
}

template <class Duration>
int64_t HHWheelTimerBase<Duration>::calcNextTick() {
  return calcNextTick(getCurTime());
}

template <class Duration>
int64_t HHWheelTimerBase<Duration>::calcNextTick(
    std::chrono::steady_clock::time_point curTime) {
  return (curTime - startTime_) / interval_;
}

// std::chrono::microseconds
template <>
void HHWheelTimerBase<std::chrono::microseconds>::scheduleTimeoutInternal(
    std::chrono::microseconds timeout) {
  this->AsyncTimeout::scheduleTimeoutHighRes(timeout);
}

// std::chrono::milliseconds
template class HHWheelTimerBase<std::chrono::milliseconds>;

// std::chrono::microseconds
template class HHWheelTimerBase<std::chrono::microseconds>;
} // namespace folly
