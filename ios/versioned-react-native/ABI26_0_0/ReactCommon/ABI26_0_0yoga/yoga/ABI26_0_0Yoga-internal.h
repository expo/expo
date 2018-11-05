/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <vector>

#include "ABI26_0_0Yoga.h"

using ABI26_0_0YGVector = std::vector<ABI26_0_0YGNodeRef>;

ABI26_0_0YG_EXTERN_C_BEGIN

WIN_EXPORT float ABI26_0_0YGRoundValueToPixelGrid(const float value,
                                         const float pointScaleFactor,
                                         const bool forceCeil,
                                         const bool forceFloor);

ABI26_0_0YG_EXTERN_C_END

extern const std::array<ABI26_0_0YGEdge, 4> trailing;
extern const std::array<ABI26_0_0YGEdge, 4> leading;
extern bool ABI26_0_0YGValueEqual(const ABI26_0_0YGValue a, const ABI26_0_0YGValue b);
extern const ABI26_0_0YGValue ABI26_0_0YGValueUndefined;
extern const ABI26_0_0YGValue ABI26_0_0YGValueAuto;
extern const ABI26_0_0YGValue ABI26_0_0YGValueZero;

template <std::size_t size>
bool ABI26_0_0YGValueArrayEqual(
    const std::array<ABI26_0_0YGValue, size> val1,
    const std::array<ABI26_0_0YGValue, size> val2) {
  bool areEqual = true;
  for (uint32_t i = 0; i < size && areEqual; ++i) {
    areEqual = ABI26_0_0YGValueEqual(val1[i], val2[i]);
  }
  return areEqual;
}

struct ABI26_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI26_0_0YGMeasureMode widthMeasureMode;
  ABI26_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;

  bool operator==(ABI26_0_0YGCachedMeasurement measurement) const {
    bool isEqual = widthMeasureMode == measurement.widthMeasureMode &&
        heightMeasureMode == measurement.heightMeasureMode;

    if (!std::isnan(availableWidth) ||
        !std::isnan(measurement.availableWidth)) {
      isEqual = isEqual && availableWidth == measurement.availableWidth;
    }
    if (!std::isnan(availableHeight) ||
        !std::isnan(measurement.availableHeight)) {
      isEqual = isEqual && availableHeight == measurement.availableHeight;
    }
    if (!std::isnan(computedWidth) || !std::isnan(measurement.computedWidth)) {
      isEqual = isEqual && computedWidth == measurement.computedWidth;
    }
    if (!std::isnan(computedHeight) ||
        !std::isnan(measurement.computedHeight)) {
      isEqual = isEqual && computedHeight == measurement.computedHeight;
    }

    return isEqual;
  }
};

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define ABI26_0_0YG_MAX_CACHED_RESULT_COUNT 16

struct ABI26_0_0YGLayout {
  std::array<float, 4> position;
  std::array<float, 2> dimensions;
  std::array<float, 6> margin;
  std::array<float, 6> border;
  std::array<float, 6> padding;
  ABI26_0_0YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;
  bool hadOverflow;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI26_0_0YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  ABI26_0_0YGCachedMeasurement cachedMeasurements[ABI26_0_0YG_MAX_CACHED_RESULT_COUNT];
  std::array<float, 2> measuredDimensions;

  ABI26_0_0YGCachedMeasurement cachedLayout;
  bool didUseLegacyFlag;
  bool doesLegacyStretchFlagAffectsLayout;

  bool operator==(ABI26_0_0YGLayout layout) const {
    bool isEqual = position == layout.position &&
        dimensions == layout.dimensions && margin == layout.margin &&
        border == layout.border && padding == layout.padding &&
        direction == layout.direction && hadOverflow == layout.hadOverflow &&
        lastParentDirection == layout.lastParentDirection &&
        nextCachedMeasurementsIndex == layout.nextCachedMeasurementsIndex &&
        cachedLayout == layout.cachedLayout;

    for (uint32_t i = 0; i < ABI26_0_0YG_MAX_CACHED_RESULT_COUNT && isEqual; ++i) {
      isEqual =
          isEqual && cachedMeasurements[i] == layout.cachedMeasurements[i];
    }

    if (!ABI26_0_0YGFloatIsUndefined(computedFlexBasis) ||
        !ABI26_0_0YGFloatIsUndefined(layout.computedFlexBasis)) {
      isEqual = isEqual && (computedFlexBasis == layout.computedFlexBasis);
    }
    if (!ABI26_0_0YGFloatIsUndefined(measuredDimensions[0]) ||
        !ABI26_0_0YGFloatIsUndefined(layout.measuredDimensions[0])) {
      isEqual =
          isEqual && (measuredDimensions[0] == layout.measuredDimensions[0]);
    }
    if (!ABI26_0_0YGFloatIsUndefined(measuredDimensions[1]) ||
        !ABI26_0_0YGFloatIsUndefined(layout.measuredDimensions[1])) {
      isEqual =
          isEqual && (measuredDimensions[1] == layout.measuredDimensions[1]);
    }

    return isEqual;
  }

  bool operator!=(ABI26_0_0YGLayout layout) const {
    return !(*this == layout);
  }
};

struct ABI26_0_0YGStyle {
  ABI26_0_0YGDirection direction;
  ABI26_0_0YGFlexDirection flexDirection;
  ABI26_0_0YGJustify justifyContent;
  ABI26_0_0YGAlign alignContent;
  ABI26_0_0YGAlign alignItems;
  ABI26_0_0YGAlign alignSelf;
  ABI26_0_0YGPositionType positionType;
  ABI26_0_0YGWrap flexWrap;
  ABI26_0_0YGOverflow overflow;
  ABI26_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI26_0_0YGValue flexBasis;
  std::array<ABI26_0_0YGValue, ABI26_0_0YGEdgeCount> margin;
  std::array<ABI26_0_0YGValue, ABI26_0_0YGEdgeCount> position;
  std::array<ABI26_0_0YGValue, ABI26_0_0YGEdgeCount> padding;
  std::array<ABI26_0_0YGValue, ABI26_0_0YGEdgeCount> border;
  std::array<ABI26_0_0YGValue, 2> dimensions;
  std::array<ABI26_0_0YGValue, 2> minDimensions;
  std::array<ABI26_0_0YGValue, 2> maxDimensions;

  // Yoga specific properties, not compatible with flexbox specification
  float aspectRatio;
  bool operator==(ABI26_0_0YGStyle style) {
    bool areNonFloatValuesEqual = direction == style.direction &&
        flexDirection == style.flexDirection &&
        justifyContent == style.justifyContent &&
        alignContent == style.alignContent && alignItems == style.alignItems &&
        alignSelf == style.alignSelf && positionType == style.positionType &&
        flexWrap == style.flexWrap && overflow == style.overflow &&
        display == style.display && ABI26_0_0YGValueEqual(flexBasis, style.flexBasis) &&
        ABI26_0_0YGValueArrayEqual(margin, style.margin) &&
        ABI26_0_0YGValueArrayEqual(position, style.position) &&
        ABI26_0_0YGValueArrayEqual(padding, style.padding) &&
        ABI26_0_0YGValueArrayEqual(border, style.border) &&
        ABI26_0_0YGValueArrayEqual(dimensions, style.dimensions) &&
        ABI26_0_0YGValueArrayEqual(minDimensions, style.minDimensions) &&
        ABI26_0_0YGValueArrayEqual(maxDimensions, style.maxDimensions);

    if (!(std::isnan(flex) && std::isnan(style.flex))) {
      areNonFloatValuesEqual = areNonFloatValuesEqual && flex == style.flex;
    }

    if (!(std::isnan(flexGrow) && std::isnan(style.flexGrow))) {
      areNonFloatValuesEqual =
          areNonFloatValuesEqual && flexGrow == style.flexGrow;
    }

    if (!(std::isnan(flexShrink) && std::isnan(style.flexShrink))) {
      areNonFloatValuesEqual =
          areNonFloatValuesEqual && flexShrink == style.flexShrink;
    }

    if (!(std::isnan(aspectRatio) && std::isnan(style.aspectRatio))) {
      areNonFloatValuesEqual =
          areNonFloatValuesEqual && aspectRatio == style.aspectRatio;
    }

    return areNonFloatValuesEqual;
  }

  bool operator!=(ABI26_0_0YGStyle style) {
    return !(*this == style);
  }
};

struct ABI26_0_0YGConfig {
  bool experimentalFeatures[ABI26_0_0YGExperimentalFeatureCount + 1];
  bool useWebDefaults;
  bool useLegacyStretchBehaviour;
  bool shouldDiffLayoutWithoutLegacyStretchBehaviour;
  float pointScaleFactor;
  ABI26_0_0YGLogger logger;
  ABI26_0_0YGNodeClonedFunc cloneNodeCallback;
  void* context;
};

#define ABI26_0_0YG_UNDEFINED_VALUES \
  { .value = ABI26_0_0YGUndefined, .unit = ABI26_0_0YGUnitUndefined }

#define ABI26_0_0YG_AUTO_VALUES \
  { .value = ABI26_0_0YGUndefined, .unit = ABI26_0_0YGUnitAuto }

#define ABI26_0_0YG_DEFAULT_EDGE_VALUES_UNIT                                            \
  {                                                                            \
    [ABI26_0_0YGEdgeLeft] = ABI26_0_0YG_UNDEFINED_VALUES, [ABI26_0_0YGEdgeTop] = ABI26_0_0YG_UNDEFINED_VALUES,     \
    [ABI26_0_0YGEdgeRight] = ABI26_0_0YG_UNDEFINED_VALUES, [ABI26_0_0YGEdgeBottom] = ABI26_0_0YG_UNDEFINED_VALUES, \
    [ABI26_0_0YGEdgeStart] = ABI26_0_0YG_UNDEFINED_VALUES, [ABI26_0_0YGEdgeEnd] = ABI26_0_0YG_UNDEFINED_VALUES,    \
    [ABI26_0_0YGEdgeHorizontal] = ABI26_0_0YG_UNDEFINED_VALUES,                                  \
    [ABI26_0_0YGEdgeVertical] = ABI26_0_0YG_UNDEFINED_VALUES, [ABI26_0_0YGEdgeAll] = ABI26_0_0YG_UNDEFINED_VALUES, \
  }

#define ABI26_0_0YG_DEFAULT_DIMENSION_VALUES \
  { [ABI26_0_0YGDimensionWidth] = ABI26_0_0YGUndefined, [ABI26_0_0YGDimensionHeight] = ABI26_0_0YGUndefined, }

#define ABI26_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT       \
  {                                            \
    [ABI26_0_0YGDimensionWidth] = ABI26_0_0YG_UNDEFINED_VALUES,  \
    [ABI26_0_0YGDimensionHeight] = ABI26_0_0YG_UNDEFINED_VALUES, \
  }

#define ABI26_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT \
  { [ABI26_0_0YGDimensionWidth] = ABI26_0_0YG_AUTO_VALUES, [ABI26_0_0YGDimensionHeight] = ABI26_0_0YG_AUTO_VALUES, }

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

static const ABI26_0_0YGStyle gABI26_0_0YGNodeStyleDefaults = {
    .direction = ABI26_0_0YGDirectionInherit,
    .flexDirection = ABI26_0_0YGFlexDirectionColumn,
    .justifyContent = ABI26_0_0YGJustifyFlexStart,
    .alignContent = ABI26_0_0YGAlignFlexStart,
    .alignItems = ABI26_0_0YGAlignStretch,
    .alignSelf = ABI26_0_0YGAlignAuto,
    .positionType = ABI26_0_0YGPositionTypeRelative,
    .flexWrap = ABI26_0_0YGWrapNoWrap,
    .overflow = ABI26_0_0YGOverflowVisible,
    .display = ABI26_0_0YGDisplayFlex,
    .flex = ABI26_0_0YGUndefined,
    .flexGrow = ABI26_0_0YGUndefined,
    .flexShrink = ABI26_0_0YGUndefined,
    .flexBasis = ABI26_0_0YG_AUTO_VALUES,
    .margin = {{ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES}},
    .position = {{ABI26_0_0YG_UNDEFINED_VALUES,
                  ABI26_0_0YG_UNDEFINED_VALUES,
                  ABI26_0_0YG_UNDEFINED_VALUES,
                  ABI26_0_0YG_UNDEFINED_VALUES,
                  ABI26_0_0YG_UNDEFINED_VALUES,
                  ABI26_0_0YG_UNDEFINED_VALUES,
                  ABI26_0_0YG_UNDEFINED_VALUES,
                  ABI26_0_0YG_UNDEFINED_VALUES,
                  ABI26_0_0YG_UNDEFINED_VALUES}},
    .padding = {{ABI26_0_0YG_UNDEFINED_VALUES,
                 ABI26_0_0YG_UNDEFINED_VALUES,
                 ABI26_0_0YG_UNDEFINED_VALUES,
                 ABI26_0_0YG_UNDEFINED_VALUES,
                 ABI26_0_0YG_UNDEFINED_VALUES,
                 ABI26_0_0YG_UNDEFINED_VALUES,
                 ABI26_0_0YG_UNDEFINED_VALUES,
                 ABI26_0_0YG_UNDEFINED_VALUES,
                 ABI26_0_0YG_UNDEFINED_VALUES}},
    .border = {{ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES,
                ABI26_0_0YG_UNDEFINED_VALUES}},
    .dimensions = {{ABI26_0_0YG_AUTO_VALUES, ABI26_0_0YG_AUTO_VALUES}},
    .minDimensions = {{ABI26_0_0YG_UNDEFINED_VALUES, ABI26_0_0YG_UNDEFINED_VALUES}},
    .maxDimensions = {{ABI26_0_0YG_UNDEFINED_VALUES, ABI26_0_0YG_UNDEFINED_VALUES}},
    .aspectRatio = ABI26_0_0YGUndefined,
};

static const ABI26_0_0YGLayout gABI26_0_0YGNodeLayoutDefaults = {
    .position = {},
    .dimensions = {{ABI26_0_0YGUndefined, ABI26_0_0YGUndefined}},
    .margin = {},
    .border = {},
    .padding = {},
    .direction = ABI26_0_0YGDirectionInherit,
    .computedFlexBasisGeneration = 0,
    .computedFlexBasis = ABI26_0_0YGUndefined,
    .hadOverflow = false,
    .generationCount = 0,
    .lastParentDirection = (ABI26_0_0YGDirection)-1,
    .nextCachedMeasurementsIndex = 0,
    .cachedMeasurements = {},
    .measuredDimensions = {{ABI26_0_0YGUndefined, ABI26_0_0YGUndefined}},
    .cachedLayout =
        {
            .availableWidth = 0,
            .availableHeight = 0,
            .widthMeasureMode = (ABI26_0_0YGMeasureMode)-1,
            .heightMeasureMode = (ABI26_0_0YGMeasureMode)-1,
            .computedWidth = -1,
            .computedHeight = -1,
        },
    .didUseLegacyFlag = false,
    .doesLegacyStretchFlagAffectsLayout = false,
};

extern bool ABI26_0_0YGFloatsEqual(const float a, const float b);
extern bool ABI26_0_0YGValueEqual(const ABI26_0_0YGValue a, const ABI26_0_0YGValue b);
extern const ABI26_0_0YGValue* ABI26_0_0YGComputedEdgeValue(
    const std::array<ABI26_0_0YGValue, ABI26_0_0YGEdgeCount>& edges,
    const ABI26_0_0YGEdge edge,
    const ABI26_0_0YGValue* const defaultValue);
