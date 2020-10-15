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

#include <folly/executors/Codel.h>

#include <folly/portability/GFlags.h>
#include <algorithm>
#include <stdexcept>

DEFINE_int32(codel_interval, 100, "Codel default interval time in ms");
DEFINE_int32(codel_target_delay, 5, "Target codel queueing delay in ms");

using namespace std::chrono;

namespace folly {

Codel::Codel()
    : Codel(Codel::Options()
                .setInterval(milliseconds(FLAGS_codel_interval))
                .setTargetDelay(milliseconds(FLAGS_codel_target_delay))) {}

Codel::Codel(const Options& options)
    : codelMinDelayNs_(0),
      codelIntervalTimeNs_(
          duration_cast<nanoseconds>(steady_clock::now().time_since_epoch())
              .count()),
      targetDelay_(options.targetDelay()),
      interval_(options.interval()),
      codelResetDelay_(true),
      overloaded_(false) {}

bool Codel::overloaded(nanoseconds delay) {
  bool ret = false;
  auto now = steady_clock::now();

  // Avoid another thread updating the value at the same time we are using it
  // to calculate the overloaded state
  auto minDelay = nanoseconds(codelMinDelayNs_);
  // Get a snapshot of the parameters to determine overload condition
  auto opts = getOptions();
  auto sloughTimeout = getSloughTimeout(opts.targetDelay());

  if (now > steady_clock::time_point(nanoseconds(codelIntervalTimeNs_)) &&
      // testing before exchanging is more cacheline-friendly
      (!codelResetDelay_.load(std::memory_order_acquire) &&
       !codelResetDelay_.exchange(true))) {
    codelIntervalTimeNs_ =
        duration_cast<nanoseconds>((now + opts.interval()).time_since_epoch())
            .count();

    if (minDelay > opts.targetDelay()) {
      overloaded_ = true;
    } else {
      overloaded_ = false;
    }
  }
  // Care must be taken that only a single thread resets codelMinDelay_,
  // and that it happens after the interval reset above
  if (codelResetDelay_.load(std::memory_order_acquire) &&
      codelResetDelay_.exchange(false)) {
    codelMinDelayNs_ = delay.count();
    // More than one request must come in during an interval before codel
    // starts dropping requests
    return false;
  } else if (delay < nanoseconds(codelMinDelayNs_)) {
    codelMinDelayNs_ = delay.count();
  }

  // Here is where we apply different logic than codel proper. Instead of
  // adapting the interval until the next drop, we slough off requests with
  // queueing delay > 2*target_delay while in the overloaded regime. This
  // empirically works better for our services than the codel approach of
  // increasingly often dropping packets.
  if (overloaded_ && delay > sloughTimeout) {
    ret = true;
  }

  return ret;
}

int Codel::getLoad() {
  // it might be better to use the average delay instead of minDelay, but we'd
  // have to track it. aspiring bootcamper?
  auto opts = getOptions();
  return std::min<int>(
      100, 100 * getMinDelay() / getSloughTimeout(opts.targetDelay()));
}

void Codel::setOptions(Options const& options) {
  // Carry out some basic sanity checks.
  auto delay = options.targetDelay();
  auto interval = options.interval();

  if (interval <= delay || delay <= milliseconds::zero() ||
      interval <= milliseconds::zero()) {
    throw std::invalid_argument("Invalid arguments provided");
  }
  interval_.store(interval, std::memory_order_relaxed);
  targetDelay_.store(delay, std::memory_order_relaxed);
}

const Codel::Options Codel::getOptions() const {
  auto interval = interval_.load(std::memory_order_relaxed);
  auto delay = targetDelay_.load(std::memory_order_relaxed);
  // Enforcing the invariant that targetDelay <= interval. A violation could
  // potentially occur if either parameter was updated by another concurrent
  // thread via the setOptions() method.
  delay = std::min(delay, interval);

  return Codel::Options().setTargetDelay(delay).setInterval(interval);
}

nanoseconds Codel::getMinDelay() {
  return nanoseconds(codelMinDelayNs_);
}

milliseconds Codel::getSloughTimeout(milliseconds delay) const {
  return delay * 2;
}

} // namespace folly
