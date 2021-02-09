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

#include <folly/futures/ManualTimekeeper.h>

namespace folly {

ManualTimekeeper::ManualTimekeeper() : now_{std::chrono::steady_clock::now()} {}

SemiFuture<Unit> ManualTimekeeper::after(HighResDuration dur) {
  auto contract = folly::makePromiseContract<Unit>();
  if (dur.count() == 0) {
    contract.first.setValue(folly::unit);
  } else {
    schedule_.withWLock([&contract, this, &dur](auto& schedule) {
      schedule.insert(std::make_pair(now_ + dur, std::move(contract.first)));
    });
  }
  return std::move(contract.second);
}

void ManualTimekeeper::advance(Duration dur) {
  now_ += dur;
  schedule_.withWLock([this](auto& schedule) {
    auto start = schedule.begin();
    auto end = schedule.upper_bound(now_);
    for (auto iter = start; iter != end; iter++) {
      iter->second.setValue(folly::unit);
    }
    schedule.erase(start, end);
  });
}

std::chrono::steady_clock::time_point ManualTimekeeper::now() const {
  return now_;
}

std::size_t ManualTimekeeper::numScheduled() const {
  return schedule_.withRLock([](const auto& sched) { return sched.size(); });
}

} // namespace folly
