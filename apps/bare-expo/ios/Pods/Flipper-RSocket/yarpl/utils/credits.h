// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#pragma once

#include <atomic>
#include <cstdint>
#include <limits>
#include <stdexcept>

namespace yarpl {
namespace credits {

constexpr int64_t kCanceled{std::numeric_limits<int64_t>::min()};
constexpr int64_t kNoFlowControl{std::numeric_limits<int64_t>::max()};

/**
 * Utility functions to help with handling request(int64_t n) since it can be
 * called concurrently and must handle rollover.
 *
 * Since Flowable Subscription must have an int64_t per Subscription, we also
 * leverage it for storing cancellation by setting to INT64_MIN so we don't have
 * to also deal with a separate boolean field per Subscription.
 *
 * These functions are thread-safe and intended to deal with concurrent
 * modification by all working off of std::atomic and using
 * compare_exchange_strong.
 */

/**
 * Add the new value 'n' to the 'current' atomic<int64_t>.
 *
 * Caps the result at INT64_MAX.
 *
 * Adding a negative number does nothing.
 *
 * If 'current' is set to "cancelled" using the magic number INT64_MIN it will
 * not be changed.
 *
 * Returns new value of credits.
 */
int64_t add(std::atomic<int64_t>*, int64_t);

/**
 * Version of add that works for non-atomic integers.
 */
int64_t add(int64_t, int64_t);

/**
 * Set 'current' to INT64_MIN as a magic number to represent "cancelled".
 *
 * Return true if this changed to cancelled, or false if it was already
 * cancelled.
 */
bool cancel(std::atomic<int64_t>*);

/**
 * Consume (remove) credits from the 'current' atomic<int64_t>.
 *
 * This MUST only be used to remove credits after emitting a value via onNext.
 *
 * Returns new value of credits.
 */
int64_t consume(std::atomic<int64_t>*, int64_t);

/**
 * Try Consume (remove) credits from the 'current' atomic<int64_t>.
 *
 * Returns true if consuming the credit was successful.
 */
bool tryConsume(std::atomic<int64_t>*, int64_t);

/**
 * Version of consume that works for non-atomic integers.
 */
int64_t consume(int64_t&, int64_t);

/**
 * Whether the current value represents a "cancelled" subscription.
 */
bool isCancelled(std::atomic<int64_t>*);

/**
 * If the requested value is MAX so we can ignore flow control.
 */
bool isInfinite(std::atomic<int64_t>*);

} // namespace credits
} // namespace yarpl
