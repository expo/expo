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

#include <atomic>
#include <chrono>

#include <folly/portability/GFlags.h>

DECLARE_int32(codel_interval);
DECLARE_int32(codel_target_delay);

namespace folly {

/// CoDel (controlled delay) is an active queue management algorithm from
/// networking for battling bufferbloat.
///
/// Services also have queues (of requests, not packets) and suffer from
/// queueing delay when overloaded. This class adapts the codel algorithm for
/// services.
///
/// Codel is discussed in depth on the web [1,2], but a basic sketch of the
/// algorithm is this: if every request has experienced queueing delay greater
/// than the target (5ms) during the past interval (100ms), then we shed load.
///
/// We have adapted the codel algorithm. TCP sheds load by changing windows in
/// reaction to dropped packets. Codel in a network setting drops packets at
/// increasingly shorter intervals (100 / sqrt(n)) to achieve a linear change
/// in throughput. In our experience a different scheme works better for
/// services: when overloaded slough off requests that we dequeue which have
/// exceeded an alternate timeout (2 * target_delay).
///
/// So in summary, to use this class, calculate the time each request spent in
/// the queue and feed that delay to overloaded(), which will tell you whether
/// to expire this request.
///
/// You can also ask for an instantaneous load estimate and the minimum delay
/// observed during this interval.
///
///
/// 1. http://queue.acm.org/detail.cfm?id=2209336
/// 2. https://en.wikipedia.org/wiki/CoDel
class Codel {
 public:
  class Options {
   public:
    std::chrono::milliseconds interval() const {
      return interval_;
    }

    Options& setInterval(std::chrono::milliseconds value) {
      interval_ = value;
      return *this;
    }

    std::chrono::milliseconds targetDelay() const {
      return targetDelay_;
    }

    Options& setTargetDelay(std::chrono::milliseconds value) {
      targetDelay_ = value;
      return *this;
    }

   private:
    std::chrono::milliseconds interval_;
    std::chrono::milliseconds targetDelay_;
  };

  Codel();

  /// Preferable construction method
  explicit Codel(const Options& options);

  /// Returns true if this request should be expired to reduce overload.
  /// In detail, this returns true if min_delay > target_delay for the
  /// interval, and this delay > 2 * target_delay.
  ///
  /// As you may guess, we observe the clock so this is time sensitive. Call
  /// it promptly after calculating queueing delay.
  bool overloaded(std::chrono::nanoseconds delay);

  /// Get the queue load, as seen by the codel algorithm
  /// Gives a rough guess at how bad the queue delay is.
  ///
  ///   min(100%, min_delay / (2 * target_delay))
  ///
  /// Return:  0 = no delay, 100 = At the queueing limit
  int getLoad();

  /// Update the target delay and interval parameters by passing them
  /// in as an Options instance. Note that target delay must be strictly
  /// smaller than the interval. This is a no-op if invalid arguments are
  /// provided.
  ///
  /// NOTE : Calls to setOptions must be externally synchronized since there
  /// is no internal locking for parameter updates. Codel only guarantees
  /// internal synchronization between calls to getOptions() and other members
  /// but not between concurrent calls to getOptions().
  ///
  /// Throws std::runtime_error if arguments are invalid.
  void setOptions(Options const& options);

  /// Return a consistent snapshot of the two parameters used by Codel. Since
  /// parameters may be updated with the setOptions() method provided above,
  /// it is necessary to ensure that reads of the parameters return a consistent
  /// pair in which the invariant of targetDelay <= interval is guaranteed; the
  /// targetDelay value that is returned is the minimum of targetDelay and
  /// interval.
  const Options getOptions() const;

  std::chrono::nanoseconds getMinDelay();

  /// Returns the timeout condition for overload given a target delay period.
  std::chrono::milliseconds getSloughTimeout(
      std::chrono::milliseconds delay) const;

 private:
  std::atomic<uint64_t> codelMinDelayNs_;
  std::atomic<uint64_t> codelIntervalTimeNs_;

  std::atomic<std::chrono::milliseconds> targetDelay_;
  std::atomic<std::chrono::milliseconds> interval_;

  // flag to make overloaded() thread-safe, since we only want
  // to reset the delay once per time period
  std::atomic<bool> codelResetDelay_;

  std::atomic<bool> overloaded_;
};

} // namespace folly
