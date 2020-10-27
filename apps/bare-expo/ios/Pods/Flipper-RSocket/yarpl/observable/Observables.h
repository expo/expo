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

#include <folly/functional/Invoke.h>
#include <limits>
#include "yarpl/observable/Observable.h"
#include "yarpl/observable/Subscription.h"

namespace yarpl {
namespace observable {

template <>
class Observable<void> {
 public:
  /**
   * Emit the sequence of numbers [start, start + count).
   */
  static std::shared_ptr<Observable<int64_t>> range(
      int64_t start,
      int64_t count);

  template <typename T>
  static std::shared_ptr<Observable<T>> just(T&& value) {
    return Observable<folly::remove_cvref_t<T>>::just(std::forward<T>(value));
  }

  template <typename T>
  static std::shared_ptr<Observable<T>> justN(std::initializer_list<T> list) {
    return Observable<folly::remove_cvref_t<T>>::justN(std::move(list));
  }

  // this will generate an observable which can be subscribed to only once
  template <typename T>
  static std::shared_ptr<Observable<T>> justOnce(T&& value) {
    return Observable<folly::remove_cvref_t<T>>::justOnce(
        std::forward<T>(value));
  }

 private:
  Observable() = delete;
};

} // namespace observable
} // namespace yarpl
