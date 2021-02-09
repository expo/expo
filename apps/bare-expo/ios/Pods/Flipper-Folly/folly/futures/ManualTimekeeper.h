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

#include <folly/Synchronized.h>
#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>

#include <chrono>
#include <map>

namespace folly {

// Manually controlled Timekeeper for unit testing.
//
// We assume advance(), now(), and numScheduled() are called from only a single
// thread, while after() can safely be called from multiple threads.
class ManualTimekeeper : public folly::Timekeeper {
 public:
  explicit ManualTimekeeper();

  /// The returned future is completed when someone calls advance and pushes the
  /// executor's clock to a value greater than or equal to (now() + dur)
  SemiFuture<Unit> after(folly::HighResDuration dur) override;

  /// Advance the timekeeper's clock to (now() + dur).  All futures with target
  /// time points less than or equal to (now() + dur) are fulfilled after the
  /// call to advance() returns
  void advance(folly::Duration dur);

  /// Returns the current clock value in the timekeeper.  This is advanced only
  /// when someone calls advance()
  std::chrono::steady_clock::time_point now() const;

  /// Returns the number of futures that are pending and have not yet been
  /// fulfilled
  std::size_t numScheduled() const;

 private:
  Executor::KeepAlive<Executor> executor_;
  std::chrono::steady_clock::time_point now_;
  folly::Synchronized<
      std::multimap<std::chrono::steady_clock::time_point, Promise<Unit>>>
      schedule_;
};

} // namespace folly
