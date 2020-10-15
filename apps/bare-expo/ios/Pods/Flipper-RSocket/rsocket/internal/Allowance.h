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

#include <cassert>
#include <cstddef>
#include <limits>

namespace rsocket {

class Allowance {
 public:
  using ValueType = size_t;

  Allowance() = default;

  explicit Allowance(ValueType initialValue) : value_(initialValue) {}

  bool tryConsume(ValueType n) {
    if (!canConsume(n)) {
      return false;
    }
    value_ -= n;
    return true;
  }

  ValueType add(ValueType n) {
    auto old_value = value_;
    value_ += n;
    if (old_value > value_) {
      value_ = max();
    }
    return old_value;
  }

  bool canConsume(ValueType n) const {
    return value_ >= n;
  }

  ValueType consumeAll() {
    return consumeUpTo(max());
  }

  ValueType consumeUpTo(ValueType limit) {
    if (limit > value_) {
      limit = value_;
    }
    value_ -= limit;
    return limit;
  }

  explicit operator bool() const {
    return value_;
  }

  ValueType get() const {
    return value_;
  }

  static ValueType max() {
    return std::numeric_limits<ValueType>::max();
  }

 private:
  static_assert(
      !std::numeric_limits<ValueType>::is_signed,
      "Allowance representation must be an unsigned type");
  static_assert(
      std::numeric_limits<ValueType>::is_integer,
      "Allowance representation must be an integer type");
  ValueType value_{0};
};
} // namespace rsocket
