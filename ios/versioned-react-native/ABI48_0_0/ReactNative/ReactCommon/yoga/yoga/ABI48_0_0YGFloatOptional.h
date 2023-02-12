/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#include <cmath>
#include <limits>
#include "ABI48_0_0Yoga-internal.h"

struct ABI48_0_0YGFloatOptional {
private:
  float value_ = std::numeric_limits<float>::quiet_NaN();

public:
  explicit constexpr ABI48_0_0YGFloatOptional(float value) : value_(value) {}
  constexpr ABI48_0_0YGFloatOptional() = default;

  // returns the wrapped value, or a value x with ABI48_0_0YGIsUndefined(x) == true
  constexpr float unwrap() const { return value_; }

  bool isUndefined() const { return std::isnan(value_); }
};

// operators take ABI48_0_0YGFloatOptional by value, as it is a 32bit value

inline bool operator==(ABI48_0_0YGFloatOptional lhs, ABI48_0_0YGFloatOptional rhs) {
  return lhs.unwrap() == rhs.unwrap() ||
      (lhs.isUndefined() && rhs.isUndefined());
}
inline bool operator!=(ABI48_0_0YGFloatOptional lhs, ABI48_0_0YGFloatOptional rhs) {
  return !(lhs == rhs);
}

inline bool operator==(ABI48_0_0YGFloatOptional lhs, float rhs) {
  return lhs == ABI48_0_0YGFloatOptional{rhs};
}
inline bool operator!=(ABI48_0_0YGFloatOptional lhs, float rhs) {
  return !(lhs == rhs);
}

inline bool operator==(float lhs, ABI48_0_0YGFloatOptional rhs) {
  return rhs == lhs;
}
inline bool operator!=(float lhs, ABI48_0_0YGFloatOptional rhs) {
  return !(lhs == rhs);
}

inline ABI48_0_0YGFloatOptional operator+(ABI48_0_0YGFloatOptional lhs, ABI48_0_0YGFloatOptional rhs) {
  return ABI48_0_0YGFloatOptional{lhs.unwrap() + rhs.unwrap()};
}

inline bool operator>(ABI48_0_0YGFloatOptional lhs, ABI48_0_0YGFloatOptional rhs) {
  return lhs.unwrap() > rhs.unwrap();
}

inline bool operator<(ABI48_0_0YGFloatOptional lhs, ABI48_0_0YGFloatOptional rhs) {
  return lhs.unwrap() < rhs.unwrap();
}

inline bool operator>=(ABI48_0_0YGFloatOptional lhs, ABI48_0_0YGFloatOptional rhs) {
  return lhs > rhs || lhs == rhs;
}

inline bool operator<=(ABI48_0_0YGFloatOptional lhs, ABI48_0_0YGFloatOptional rhs) {
  return lhs < rhs || lhs == rhs;
}

#endif
