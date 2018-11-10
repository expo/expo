/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>
#include "ABI31_0_0Yoga.h"

using ABI31_0_0YGVector = std::vector<ABI31_0_0YGNodeRef>;

ABI31_0_0YG_EXTERN_C_BEGIN

WIN_EXPORT float ABI31_0_0YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

ABI31_0_0YG_EXTERN_C_END

namespace facebook {
namespace yoga {

inline bool isUndefined(float value) {
  // Value of a float in the case of it being not defined is 10.1E20. Earlier
  // it used to be NAN, the benefit of which was that if NAN is involved in any
  // mathematical expression the result was NAN. But since we want to have
  // `-ffast-math` flag being used by compiler which assumes that the floating
  // point values are not NAN and Inf, we represent ABI31_0_0YGUndefined as 10.1E20. But
  // now if ABI31_0_0YGUndefined is involved in any mathematical operations this
  // value(10.1E20) would change. So the following check makes sure that if the
  // value is outside a range (-10E8, 10E8) then it is undefined.
  return value >= 10E8 || value <= -10E8;
}

} // namespace yoga
} // namespace facebook

using namespace facebook;

extern const std::array<ABI31_0_0YGEdge, 4> trailing;
extern const std::array<ABI31_0_0YGEdge, 4> leading;
extern bool ABI31_0_0YGValueEqual(const ABI31_0_0YGValue a, const ABI31_0_0YGValue b);
extern const ABI31_0_0YGValue ABI31_0_0YGValueUndefined;
extern const ABI31_0_0YGValue ABI31_0_0YGValueAuto;
extern const ABI31_0_0YGValue ABI31_0_0YGValueZero;

template <std::size_t size>
bool ABI31_0_0YGValueArrayEqual(
    const std::array<ABI31_0_0YGValue, size> val1,
    const std::array<ABI31_0_0YGValue, size> val2) {
  bool areEqual = true;
  for (uint32_t i = 0; i < size && areEqual; ++i) {
    areEqual = ABI31_0_0YGValueEqual(val1[i], val2[i]);
  }
  return areEqual;
}

struct ABI31_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI31_0_0YGMeasureMode widthMeasureMode;
  ABI31_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;

  ABI31_0_0YGCachedMeasurement()
      : availableWidth(0),
        availableHeight(0),
        widthMeasureMode((ABI31_0_0YGMeasureMode)-1),
        heightMeasureMode((ABI31_0_0YGMeasureMode)-1),
        computedWidth(-1),
        computedHeight(-1) {}

  bool operator==(ABI31_0_0YGCachedMeasurement measurement) const {
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

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define ABI31_0_0YG_MAX_CACHED_RESULT_COUNT 16

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

extern bool ABI31_0_0YGFloatsEqual(const float a, const float b);
extern bool ABI31_0_0YGValueEqual(const ABI31_0_0YGValue a, const ABI31_0_0YGValue b);
extern const ABI31_0_0YGValue* ABI31_0_0YGComputedEdgeValue(
    const std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount>& edges,
    const ABI31_0_0YGEdge edge,
    const ABI31_0_0YGValue* const defaultValue);
