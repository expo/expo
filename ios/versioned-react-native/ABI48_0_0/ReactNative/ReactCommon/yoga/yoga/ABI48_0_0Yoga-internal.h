/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#include <algorithm>
#include <array>
#include <cmath>
#include <vector>
#include "ABI48_0_0CompactValue.h"
#include "ABI48_0_0Yoga.h"

using ABI48_0_0YGVector = std::vector<ABI48_0_0YGNodeRef>;

ABI48_0_0YG_EXTERN_C_BEGIN

void ABI48_0_0YGNodeCalculateLayoutWithContext(
    ABI48_0_0YGNodeRef node,
    float availableWidth,
    float availableHeight,
    ABI48_0_0YGDirection ownerDirection,
    void* layoutContext);

ABI48_0_0YG_EXTERN_C_END

namespace ABI48_0_0facebook {
namespace yoga {

inline bool isUndefined(float value) {
  return std::isnan(value);
}

inline bool isUndefined(double value) {
  return std::isnan(value);
}

} // namespace yoga
} // namespace ABI48_0_0facebook

using namespace ABI48_0_0facebook;

extern const std::array<ABI48_0_0YGEdge, 4> trailing;
extern const std::array<ABI48_0_0YGEdge, 4> leading;
extern const ABI48_0_0YGValue ABI48_0_0YGValueUndefined;
extern const ABI48_0_0YGValue ABI48_0_0YGValueAuto;
extern const ABI48_0_0YGValue ABI48_0_0YGValueZero;

struct ABI48_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI48_0_0YGMeasureMode widthMeasureMode;
  ABI48_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;

  ABI48_0_0YGCachedMeasurement()
      : availableWidth(-1),
        availableHeight(-1),
        widthMeasureMode(ABI48_0_0YGMeasureModeUndefined),
        heightMeasureMode(ABI48_0_0YGMeasureModeUndefined),
        computedWidth(-1),
        computedHeight(-1) {}

  bool operator==(ABI48_0_0YGCachedMeasurement measurement) const {
    bool isEqual = widthMeasureMode == measurement.widthMeasureMode &&
        heightMeasureMode == measurement.heightMeasureMode;

    if (!yoga::isUndefined(availableWidth) ||
        !yoga::isUndefined(measurement.availableWidth)) {
      isEqual = isEqual && availableWidth == measurement.availableWidth;
    }
    if (!yoga::isUndefined(availableHeight) ||
        !yoga::isUndefined(measurement.availableHeight)) {
      isEqual = isEqual && availableHeight == measurement.availableHeight;
    }
    if (!yoga::isUndefined(computedWidth) ||
        !yoga::isUndefined(measurement.computedWidth)) {
      isEqual = isEqual && computedWidth == measurement.computedWidth;
    }
    if (!yoga::isUndefined(computedHeight) ||
        !yoga::isUndefined(measurement.computedHeight)) {
      isEqual = isEqual && computedHeight == measurement.computedHeight;
    }

    return isEqual;
  }
};

// This value was chosen based on empirical data:
// 98% of analyzed layouts require less than 8 entries.
#define ABI48_0_0YG_MAX_CACHED_RESULT_COUNT 8

namespace ABI48_0_0facebook {
namespace yoga {
namespace detail {

template <size_t Size>
class Values {
private:
  std::array<CompactValue, Size> values_;

public:
  Values() = default;
  explicit Values(const ABI48_0_0YGValue& defaultValue) noexcept {
    values_.fill(defaultValue);
  }

  const CompactValue& operator[](size_t i) const noexcept { return values_[i]; }
  CompactValue& operator[](size_t i) noexcept { return values_[i]; }

  template <size_t I>
  ABI48_0_0YGValue get() const noexcept {
    return std::get<I>(values_);
  }

  template <size_t I>
  void set(ABI48_0_0YGValue& value) noexcept {
    std::get<I>(values_) = value;
  }

  template <size_t I>
  void set(ABI48_0_0YGValue&& value) noexcept {
    set<I>(value);
  }

  bool operator==(const Values& other) const noexcept {
    for (size_t i = 0; i < Size; ++i) {
      if (values_[i] != other.values_[i]) {
        return false;
      }
    }
    return true;
  }

  Values& operator=(const Values& other) = default;
};

} // namespace detail
} // namespace yoga
} // namespace ABI48_0_0facebook

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

extern bool ABI48_0_0YGFloatsEqual(const float a, const float b);

#endif
