/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <cmath>
#include <limits>
#include "ABI33_0_0Yoga-internal.h"

struct ABI33_0_0YGFloatOptional {
private:
  float value_ = std::numeric_limits<float>::quiet_NaN();

public:
  explicit constexpr ABI33_0_0YGFloatOptional(float value) : value_(value) {}
  constexpr ABI33_0_0YGFloatOptional() = default;

  // returns the wrapped value, or a value x with ABI33_0_0YGIsUndefined(x) == true
  constexpr float unwrap() const {
    return value_;
  }

  bool isUndefined() const {
    return std::isnan(value_);
  }

  ABI33_0_0YGFloatOptional operator+(ABI33_0_0YGFloatOptional op) const {
    return ABI33_0_0YGFloatOptional{value_ + op.value_};
  }
  bool operator>(ABI33_0_0YGFloatOptional op) const {
    return value_ > op.value_;
  }
  bool operator<(ABI33_0_0YGFloatOptional op) const {
    return value_ < op.value_;
  }
  bool operator>=(ABI33_0_0YGFloatOptional op) const {
    return *this > op || *this == op;
  }
  bool operator<=(ABI33_0_0YGFloatOptional op) const {
    return *this < op || *this == op;
  }
  bool operator==(ABI33_0_0YGFloatOptional op) const {
    return value_ == op.value_ || (isUndefined() && op.isUndefined());
  }
  bool operator!=(ABI33_0_0YGFloatOptional op) const {
    return !(*this == op);
  }

  bool operator==(float val) const {
    return value_ == val || (isUndefined() && ABI33_0_0yoga::isUndefined(val));
  }
  bool operator!=(float val) const {
    return !(*this == val);
  }
};
