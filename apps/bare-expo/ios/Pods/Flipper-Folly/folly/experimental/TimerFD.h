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

#if defined(__linux__) && !defined(__ANDROID__)
#define FOLLY_HAVE_TIMERFD
#endif

#include <folly/io/async/EventBase.h>
#ifdef FOLLY_HAVE_TIMERFD
#include <folly/io/async/EventHandler.h>
#else
#include <folly/io/async/AsyncTimeout.h>
#endif
#include <chrono>

namespace folly {
#ifdef FOLLY_HAVE_TIMERFD
// timerfd wrapper
class TimerFD : public folly::EventHandler, public DelayedDestruction {
 public:
  explicit TimerFD(folly::EventBase* eventBase);
  ~TimerFD() override;

  virtual void onTimeout() noexcept = 0;
  void schedule(std::chrono::microseconds timeout);
  void cancel();

  // from folly::EventHandler
  void handlerReady(uint16_t events) noexcept override;

 protected:
  void close();

 private:
  TimerFD(folly::EventBase* eventBase, int fd);
  static int createTimerFd();

  // use 0 to stop the timer
  bool setTimer(std::chrono::microseconds useconds);

  int fd_{-1};
};
#else
// alternative implementation using a folly::AsyncTimeout
class TimerFD {
 public:
  explicit TimerFD(folly::EventBase* eventBase);
  virtual ~TimerFD();

  virtual void onTimeout() = 0;
  void schedule(std::chrono::microseconds timeout);
  void cancel();

 protected:
  void close() {}

 private:
  class TimerFDAsyncTimeout : public folly::AsyncTimeout {
   public:
    TimerFDAsyncTimeout(folly::EventBase* eventBase, TimerFD* timerFd);
    ~TimerFDAsyncTimeout() override = default;

    // from folly::AsyncTimeout
    void timeoutExpired() noexcept final;

   private:
    TimerFD* timerFd_;
  };

  TimerFDAsyncTimeout timeout_;
};
#endif
} // namespace folly
