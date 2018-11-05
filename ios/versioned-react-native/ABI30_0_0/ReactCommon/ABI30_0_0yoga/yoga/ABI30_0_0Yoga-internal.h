/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>
#include "ABI30_0_0Yoga.h"

using ABI30_0_0YGVector = std::vector<ABI30_0_0YGNodeRef>;

ABI30_0_0YG_EXTERN_C_BEGIN

WIN_EXPORT float ABI30_0_0YGRoundValueToPixelGrid(const float value,
                                         const float pointScaleFactor,
                                         const bool forceCeil,
                                         const bool forceFloor);

ABI30_0_0YG_EXTERN_C_END

extern const std::array<ABI30_0_0YGEdge, 4> trailing;
extern const std::array<ABI30_0_0YGEdge, 4> leading;
extern bool ABI30_0_0YGValueEqual(const ABI30_0_0YGValue a, const ABI30_0_0YGValue b);
extern const ABI30_0_0YGValue ABI30_0_0YGValueUndefined;
extern const ABI30_0_0YGValue ABI30_0_0YGValueAuto;
extern const ABI30_0_0YGValue ABI30_0_0YGValueZero;

template <std::size_t size>
bool ABI30_0_0YGValueArrayEqual(
    const std::array<ABI30_0_0YGValue, size> val1,
    const std::array<ABI30_0_0YGValue, size> val2) {
  bool areEqual = true;
  for (uint32_t i = 0; i < size && areEqual; ++i) {
    areEqual = ABI30_0_0YGValueEqual(val1[i], val2[i]);
  }
  return areEqual;
}

struct ABI30_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI30_0_0YGMeasureMode widthMeasureMode;
  ABI30_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;

  ABI30_0_0YGCachedMeasurement()
      : availableWidth(0),
        availableHeight(0),
        widthMeasureMode((ABI30_0_0YGMeasureMode)-1),
        heightMeasureMode((ABI30_0_0YGMeasureMode)-1),
        computedWidth(-1),
        computedHeight(-1) {}

  bool operator==(ABI30_0_0YGCachedMeasurement measurement) const {
    bool isEqual = widthMeasureMode == measurement.widthMeasureMode &&
        heightMeasureMode == measurement.heightMeasureMode;

    if (!ABI30_0_0YGFloatIsUndefined(availableWidth) ||
        !ABI30_0_0YGFloatIsUndefined(measurement.availableWidth)) {
      isEqual = isEqual && availableWidth == measurement.availableWidth;
    }
    if (!ABI30_0_0YGFloatIsUndefined(availableHeight) ||
        !ABI30_0_0YGFloatIsUndefined(measurement.availableHeight)) {
      isEqual = isEqual && availableHeight == measurement.availableHeight;
    }
    if (!ABI30_0_0YGFloatIsUndefined(computedWidth) ||
        !ABI30_0_0YGFloatIsUndefined(measurement.computedWidth)) {
      isEqual = isEqual && computedWidth == measurement.computedWidth;
    }
    if (!ABI30_0_0YGFloatIsUndefined(computedHeight) ||
        !ABI30_0_0YGFloatIsUndefined(measurement.computedHeight)) {
      isEqual = isEqual && computedHeight == measurement.computedHeight;
    }

    return isEqual;
  }
};

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define ABI30_0_0YG_MAX_CACHED_RESULT_COUNT 16

struct ABI30_0_0YGConfig {
  bool experimentalFeatures[ABI30_0_0YGExperimentalFeatureCount + 1];
  bool useWebDefaults;
  bool useLegacyStretchBehaviour;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour;
  float pointScaleFactor;
  ABI30_0_0YGLogger logger;
  ABI30_0_0YGNodeClonedFunc cloneNodeCallback;
  void* context;
};

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

extern bool ABI30_0_0YGFloatsEqual(const float a, const float b);
extern bool ABI30_0_0YGValueEqual(const ABI30_0_0YGValue a, const ABI30_0_0YGValue b);
extern const ABI30_0_0YGValue* ABI30_0_0YGComputedEdgeValue(
    const std::array<ABI30_0_0YGValue, ABI30_0_0YGEdgeCount>& edges,
    const ABI30_0_0YGEdge edge,
    const ABI30_0_0YGValue* const defaultValue);
