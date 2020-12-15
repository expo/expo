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

#include <folly/Optional.h>
#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/DelayedDestruction.h>
#include <folly/io/async/HHWheelTimer-fwd.h>

#include <boost/intrusive/list.hpp>
#include <glog/logging.h>

#include <array>
#include <chrono>
#include <cstddef>
#include <memory>

namespace folly {

namespace detail {
template <class Duration>
struct HHWheelTimerDurationConst;

template <>
struct HHWheelTimerDurationConst<std::chrono::milliseconds> {
  static constexpr int DEFAULT_TICK_INTERVAL = 10;
};

template <>
struct HHWheelTimerDurationConst<std::chrono::microseconds> {
  static constexpr int DEFAULT_TICK_INTERVAL = 200;
};
} // namespace detail

/**
 * Hashed Hierarchical Wheel Timer
 *
 * We model timers as the number of ticks until the next
 * due event.  We allow 32-bits of space to track this
 * due interval, and break that into 4 regions of 8 bits.
 * Each region indexes into a bucket of 256 lists.
 *
 * Bucket 0 represents those events that are due the soonest.
 * Each tick causes us to look at the next list in a bucket.
 * The 0th list in a bucket is special; it means that it is time to
 * flush the timers from the next higher bucket and schedule them
 * into a different bucket.
 *
 * This technique results in a very cheap mechanism for
 * maintaining time and timers.
 *
 * Unlike the original timer wheel paper, this implementation does
 * *not* tick constantly, and instead calculates the exact next wakeup
 * time.
 */
template <class Duration>
class HHWheelTimerBase : private folly::AsyncTimeout,
                         public folly::DelayedDestruction {
 public:
  using UniquePtr = std::unique_ptr<HHWheelTimerBase, Destructor>;
  using SharedPtr = std::shared_ptr<HHWheelTimerBase>;

  template <typename... Args>
  static UniquePtr newTimer(Args&&... args) {
    return UniquePtr(new HHWheelTimerBase(std::forward<Args>(args)...));
  }

  /**
   * A callback to be notified when a timeout has expired.
   */
  class Callback
      : public boost::intrusive::list_base_hook<
            boost::intrusive::link_mode<boost::intrusive::auto_unlink>> {
   public:
    Callback();
    virtual ~Callback();

    /**
     * timeoutExpired() is invoked when the timeout has expired.
     */
    virtual void timeoutExpired() noexcept = 0;

    /// This callback was canceled. The default implementation is to just
    /// proxy to `timeoutExpired` but if you care about the difference between
    /// the timeout finishing or being canceled you can override this.
    virtual void callbackCanceled() noexcept {
      timeoutExpired();
    }

    /**
     * Cancel the timeout, if it is running.
     *
     * If the timeout is not scheduled, cancelTimeout() does nothing.
     */
    void cancelTimeout() {
      if (wheel_ == nullptr) {
        // We're not scheduled, so there's nothing to do.
        return;
      }
      cancelTimeoutImpl();
    }

    /**
     * Return true if this timeout is currently scheduled, and false otherwise.
     */
    bool isScheduled() const {
      return wheel_ != nullptr;
    }

    /**
     * Get the time remaining until this timeout expires. Return 0 if this
     * timeout is not scheduled or expired. Otherwise, return expiration
     * time minus current time.
     */
    Duration getTimeRemaining() const {
      return getTimeRemaining(std::chrono::steady_clock::now());
    }

   private:
    // Get the time remaining until this timeout expires
    Duration getTimeRemaining(std::chrono::steady_clock::time_point now) const {
      if (now >= expiration_) {
        return Duration(0);
      }
      return std::chrono::duration_cast<Duration>(expiration_ - now);
    }

    void setScheduled(
        HHWheelTimerBase* wheel,
        std::chrono::steady_clock::time_point deadline);
    void cancelTimeoutImpl();

    HHWheelTimerBase* wheel_{nullptr};
    std::chrono::steady_clock::time_point expiration_{};
    int bucket_{-1};

    typedef boost::intrusive::
        list<Callback, boost::intrusive::constant_time_size<false>>
            List;

    std::shared_ptr<RequestContext> requestContext_;

    // Give HHWheelTimerBase direct access to our members so it can take care
    // of scheduling/cancelling.
    friend class HHWheelTimerBase;
  };

  /**
   * Create a new HHWheelTimerBase with the specified interval and the
   * default timeout value set.
   *
   * Objects created using this version of constructor can be used
   * to schedule both variable interval timeouts using
   * scheduleTimeout(callback, timeout) method, and default
   * interval timeouts using scheduleTimeout(callback) method.
   */
  static int DEFAULT_TICK_INTERVAL;
  explicit HHWheelTimerBase(
      folly::TimeoutManager* timeoutMananger,
      Duration intervalDuration = Duration(DEFAULT_TICK_INTERVAL),
      AsyncTimeout::InternalEnum internal = AsyncTimeout::InternalEnum::NORMAL,
      Duration defaultTimeoutDuration = Duration(-1));

  /**
   * Cancel all outstanding timeouts
   *
   * @returns the number of timeouts that were cancelled.
   */
  size_t cancelAll();

  /**
   * Get the tick interval for this HHWheelTimerBase.
   *
   * Returns the tick interval in milliseconds.
   */
  Duration getTickInterval() const {
    return interval_;
  }

  /**
   * Get the default timeout interval for this HHWheelTimerBase.
   *
   * Returns the timeout interval in milliseconds.
   */
  Duration getDefaultTimeout() const {
    return defaultTimeout_;
  }

  /**
   * Set the default timeout interval for this HHWheelTimerBase.
   */
  void setDefaultTimeout(Duration timeout) {
    defaultTimeout_ = timeout;
  }

  /**
   * Schedule the specified Callback to be invoked after the
   * specified timeout interval.
   *
   * If the callback is already scheduled, this cancels the existing timeout
   * before scheduling the new timeout.
   */
  void scheduleTimeout(Callback* callback, Duration timeout);

  /**
   * Schedule the specified Callback to be invoked after the
   * default timeout interval.
   *
   * If the callback is already scheduled, this cancels the existing timeout
   * before scheduling the new timeout.
   *
   * This method uses CHECK() to make sure that the default timeout was
   * specified on the object initialization.
   */
  void scheduleTimeout(Callback* callback);

  template <class F>
  void scheduleTimeoutFn(F fn, Duration timeout) {
    struct Wrapper : Callback {
      Wrapper(F f) : fn_(std::move(f)) {}
      void timeoutExpired() noexcept override {
        try {
          fn_();
        } catch (std::exception const& e) {
          LOG(ERROR) << "HHWheelTimerBase timeout callback threw an exception: "
                     << e.what();
        } catch (...) {
          LOG(ERROR)
              << "HHWheelTimerBase timeout callback threw a non-exception.";
        }
        delete this;
      }
      F fn_;
    };
    Wrapper* w = new Wrapper(std::move(fn));
    scheduleTimeout(w, timeout);
  }

  /**
   * Return the number of currently pending timeouts
   */
  std::size_t count() const {
    return count_;
  }

  bool isDetachable() const {
    return !folly::AsyncTimeout::isScheduled();
  }

  using folly::AsyncTimeout::attachEventBase;
  using folly::AsyncTimeout::detachEventBase;
  using folly::AsyncTimeout::getTimeoutManager;

 protected:
  /**
   * Protected destructor.
   *
   * Use destroy() instead.  See the comments in DelayedDestruction for more
   * details.
   */
  ~HHWheelTimerBase() override;

 private:
  // Forbidden copy constructor and assignment operator
  HHWheelTimerBase(HHWheelTimerBase const&) = delete;
  HHWheelTimerBase& operator=(HHWheelTimerBase const&) = delete;

  // Methods inherited from AsyncTimeout
  void timeoutExpired() noexcept override;

  Duration interval_;
  Duration defaultTimeout_;

  static constexpr int WHEEL_BUCKETS = 4;
  static constexpr int WHEEL_BITS = 8;
  static constexpr unsigned int WHEEL_SIZE = (1 << WHEEL_BITS);
  static constexpr unsigned int WHEEL_MASK = (WHEEL_SIZE - 1);
  static constexpr uint32_t LARGEST_SLOT = 0xffffffffUL;

  typedef typename Callback::List CallbackList;
  CallbackList buckets_[WHEEL_BUCKETS][WHEEL_SIZE];
  std::array<std::size_t, (WHEEL_SIZE / sizeof(std::size_t)) / 8> bitmap_;

  int64_t timeToWheelTicks(Duration t) {
    return t.count() / interval_.count();
  }

  bool cascadeTimers(
      int bucket,
      int tick,
      std::chrono::steady_clock::time_point curTime);
  void scheduleTimeoutInternal(Duration timeout);

  int64_t expireTick_;
  std::size_t count_;
  std::chrono::steady_clock::time_point startTime_;

  int64_t calcNextTick();
  int64_t calcNextTick(std::chrono::steady_clock::time_point curTime);

  static bool inSameEpoch(int64_t tickA, int64_t tickB) {
    return (tickA >> WHEEL_BITS) == (tickB >> WHEEL_BITS);
  }

  /**
   * Schedule a given timeout by putting it into the appropriate bucket of the
   * wheel.
   *
   * @param callback           Callback to fire after `timeout`
   * @param dueTick            Tick at which the timer is due.
   * @param nextTickToProcess  next tick that was not processed by the timer
   *                           yet. Can be less than nextTick if we're lagging.
   * @param nextTick           next tick based on the actual time
   */
  void scheduleTimeoutImpl(
      Callback* callback,
      int64_t dueTick,
      int64_t nextTickToProcess,
      int64_t nextTick);

  /**
   * Compute next required wheel tick to fire and schedule the timeout for that
   * tick.
   *
   * @param nextTick  next tick based on the actual time
   */
  void scheduleNextTimeout(int64_t nextTick);

  /**
   * Schedule next wheel timeout in a fixed number of wheel ticks.
   *
   * @param nextTick  next tick based on the actual time
   * @param ticks     number of ticks in which the timer should fire
   */
  void scheduleNextTimeout(int64_t nextTick, int64_t ticks);

  size_t cancelTimeoutsFromList(CallbackList& timeouts);

  bool* processingCallbacksGuard_;
  // Timeouts that we're about to run. They're already extracted from their
  // corresponding buckets, so we need this list for the `cancelAll` to be able
  // to cancel them.
  CallbackList timeoutsToRunNow_;

  std::chrono::steady_clock::time_point getCurTime() {
    return std::chrono::steady_clock::now();
  }
};

// std::chrono::milliseconds
using HHWheelTimer = HHWheelTimerBase<std::chrono::milliseconds>;
extern template class HHWheelTimerBase<std::chrono::milliseconds>;

// std::chrono::microseconds
template <>
void HHWheelTimerBase<std::chrono::microseconds>::scheduleTimeoutInternal(
    std::chrono::microseconds timeout);

using HHWheelTimerHighRes = HHWheelTimerBase<std::chrono::microseconds>;
extern template class HHWheelTimerBase<std::chrono::microseconds>;

} // namespace folly
