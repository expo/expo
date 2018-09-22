/*
 * Copyright 2016 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <atomic>
#include <climits>
#include <functional>
#include <stdexcept>

#include <folly/Function.h>

namespace folly {

using Func = Function<void()>;

/// An Executor accepts units of work with add(), which should be
/// threadsafe.
class Executor {
 public:
  virtual ~Executor() = default;

  /// Enqueue a function to executed by this executor. This and all
  /// variants must be threadsafe.
  virtual void add(Func) = 0;

  /// Enqueue a function with a given priority, where 0 is the medium priority
  /// This is up to the implementation to enforce
  virtual void addWithPriority(Func, int8_t /*priority*/) {
    throw std::runtime_error(
        "addWithPriority() is not implemented for this Executor");
  }

  virtual uint8_t getNumPriorities() const {
    return 1;
  }

  static const int8_t LO_PRI  = SCHAR_MIN;
  static const int8_t MID_PRI = 0;
  static const int8_t HI_PRI  = SCHAR_MAX;

  /// A convenience function for shared_ptr to legacy functors.
  ///
  /// Sometimes you have a functor that is move-only, and therefore can't be
  /// converted to a std::function (e.g. std::packaged_task). In that case,
  /// wrap it in a shared_ptr (or maybe folly::MoveWrapper) and use this.
  template <class P>
  void addPtr(P fn) {
    this->add([fn]() mutable { (*fn)(); });
  }
};

} // folly
