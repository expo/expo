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

#include <folly/Traits.h>
#include <folly/functional/Invoke.h>
#include <glog/logging.h>
#include <algorithm>
#include <limits>
#include <vector>
#include "yarpl/flowable/Flowable.h"

namespace yarpl {
namespace flowable {

template <>
class Flowable<void> {
 public:
  /**
   * Emit the sequence of numbers [start, start + count).
   */
  static std::shared_ptr<Flowable<int64_t>> range(int64_t start, int64_t count);

  template <typename T>
  static std::shared_ptr<Flowable<T>> just(T&& value) {
    return Flowable<folly::remove_cvref_t<T>>::just(std::forward<T>(value));
  }

  template <typename T>
  static std::shared_ptr<Flowable<T>> justN(std::initializer_list<T> list) {
    return Flowable<folly::remove_cvref_t<T>>::justN(std::move(list));
  }

  // this will generate a flowable which can be subscribed to only once
  template <typename T>
  static std::shared_ptr<Flowable<T>> justOnce(T&& value) {
    return Flowable<folly::remove_cvref_t<T>>::justOnce(std::forward<T>(value));
  }

  template <typename T, typename... Args>
  static std::shared_ptr<Flowable<T>> concat(
      std::shared_ptr<Flowable<T>> first,
      Args... args) {
    return first->concatWith(args...);
  }

 private:
  Flowable() = delete;
};

} // namespace flowable
} // namespace yarpl
