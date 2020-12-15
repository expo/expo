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
#include <folly/experimental/TimerFD.h>
#include <folly/io/async/DelayedDestruction.h>
#include <map>

namespace folly {
// generic TimerFD based timeout manager
class TimerFDTimeoutManager : public TimerFD {
 public:
  using UniquePtr =
      std::unique_ptr<TimerFDTimeoutManager, DelayedDestruction::Destructor>;
  using SharedPtr = std::shared_ptr<TimerFDTimeoutManager>;

 public:
  class Callback
      : public boost::intrusive::list_base_hook<
            boost::intrusive::link_mode<boost::intrusive::auto_unlink>> {
   public:
    Callback() = default;
    explicit Callback(TimerFDTimeoutManager* mgr) : mgr_(mgr) {}
    virtual ~Callback() = default;

    virtual void timeoutExpired() noexcept = 0;
    virtual void callbackCanceled() noexcept {
      timeoutExpired();
    }

    const std::chrono::microseconds& getExpirationTime() const {
      return expirationTime_;
    }

    void setExpirationTime(
        TimerFDTimeoutManager* mgr,
        const std::chrono::microseconds& expirationTime) {
      mgr_ = mgr;
      expirationTime_ = expirationTime;
    }

    std::chrono::microseconds getTimeRemaining() const {
      return getTimeRemaining(std::chrono::steady_clock::now());
    }

    std::chrono::microseconds getTimeRemaining(
        std::chrono::steady_clock::time_point now) const {
      auto nowMs = std::chrono::duration_cast<std::chrono::microseconds>(
          now.time_since_epoch());
      if (expirationTime_ > nowMs) {
        return std::chrono::duration_cast<std::chrono::microseconds>(
            expirationTime_ - nowMs);
      }

      return std::chrono::microseconds(0);
    }

    void scheduleTimeout(std::chrono::microseconds timeout) {
      if (mgr_) {
        mgr_->scheduleTimeout(this, timeout);
      }
    }

    bool cancelTimeout() {
      return mgr_->cancelTimeout(this);
    }

   private:
    TimerFDTimeoutManager* mgr_{nullptr};
    std::chrono::microseconds expirationTime_{0};
  };

  explicit TimerFDTimeoutManager(folly::EventBase* eventBase);
  ~TimerFDTimeoutManager() override;

  // from TimerFD
  void onTimeout() noexcept final;

  size_t cancelAll();
  void scheduleTimeout(Callback* callback, std::chrono::microseconds timeout);
  bool cancelTimeout(Callback* callback);

  template <class F>
  void scheduleTimeoutFn(F fn, std::chrono::microseconds timeout) {
    struct Wrapper : Callback {
      explicit Wrapper(F f) : fn_(std::move(f)) {}
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

  size_t count() const;

 private:
  void processExpiredTimers();
  void scheduleNextTimer();

  std::chrono::steady_clock::time_point getCurTime() {
    return std::chrono::steady_clock::now();
  }

  // we can attempt to schedule new entries while in processExpiredTimers
  // we want to reschedule the timers once we're done with the processing
  bool processingExpired_{false};

  typedef boost::intrusive::
      list<Callback, boost::intrusive::constant_time_size<false>>
          CallbackList;
  std::map<std::chrono::microseconds, CallbackList> callbacks_;
  CallbackList inProgressList_;
};
} // namespace folly
