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

#include <folly/synchronization/Baton.h>

/// Simple implementation of a latch synchronization primitive, for testing.
class Latch {
 public:
  explicit Latch(size_t limit) : limit_{limit} {}

  void wait() {
    baton_.wait();
  }

  bool timed_wait(std::chrono::milliseconds timeout) {
    return baton_.timed_wait(timeout);
  }

  void post() {
    auto const old = count_.fetch_add(1);
    if (old == limit_ - 1) {
      baton_.post();
    }
  }

 private:
  folly::Baton<> baton_;
  std::atomic<size_t> count_{0};
  const size_t limit_{0};
};
