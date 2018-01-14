/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include <vector>

#include "ABI25_0_0Yoga.h"

using ABI25_0_0YGVector = std::vector<ABI25_0_0YGNodeRef>;

ABI25_0_0YG_EXTERN_C_BEGIN

WIN_EXPORT float ABI25_0_0YGRoundValueToPixelGrid(const float value,
                                         const float pointScaleFactor,
                                         const bool forceCeil,
                                         const bool forceFloor);

ABI25_0_0YG_EXTERN_C_END

typedef struct ABI25_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI25_0_0YGMeasureMode widthMeasureMode;
  ABI25_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} ABI25_0_0YGCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define ABI25_0_0YG_MAX_CACHED_RESULT_COUNT 16

typedef struct ABI25_0_0YGLayout {
  float position[4];
  float dimensions[2];
  float margin[6];
  float border[6];
  float padding[6];
  ABI25_0_0YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;
  bool hadOverflow;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI25_0_0YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  ABI25_0_0YGCachedMeasurement cachedMeasurements[ABI25_0_0YG_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  ABI25_0_0YGCachedMeasurement cachedLayout;
} ABI25_0_0YGLayout;

typedef struct ABI25_0_0YGStyle {
  ABI25_0_0YGDirection direction;
  ABI25_0_0YGFlexDirection flexDirection;
  ABI25_0_0YGJustify justifyContent;
  ABI25_0_0YGAlign alignContent;
  ABI25_0_0YGAlign alignItems;
  ABI25_0_0YGAlign alignSelf;
  ABI25_0_0YGPositionType positionType;
  ABI25_0_0YGWrap flexWrap;
  ABI25_0_0YGOverflow overflow;
  ABI25_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI25_0_0YGValue flexBasis;
  ABI25_0_0YGValue margin[ABI25_0_0YGEdgeCount];
  ABI25_0_0YGValue position[ABI25_0_0YGEdgeCount];
  ABI25_0_0YGValue padding[ABI25_0_0YGEdgeCount];
  ABI25_0_0YGValue border[ABI25_0_0YGEdgeCount];
  ABI25_0_0YGValue dimensions[2];
  ABI25_0_0YGValue minDimensions[2];
  ABI25_0_0YGValue maxDimensions[2];

  // Yoga specific properties, not compatible with flexbox specification
  float aspectRatio;
} ABI25_0_0YGStyle;

typedef struct ABI25_0_0YGConfig {
  bool experimentalFeatures[ABI25_0_0YGExperimentalFeatureCount + 1];
  bool useWebDefaults;
  bool useLegacyStretchBehaviour;
  float pointScaleFactor;
  ABI25_0_0YGLogger logger;
  ABI25_0_0YGNodeClonedFunc cloneNodeCallback;
  void* context;
} ABI25_0_0YGConfig;

typedef struct ABI25_0_0YGNode {
  ABI25_0_0YGStyle style;
  ABI25_0_0YGLayout layout;
  uint32_t lineIndex;

  ABI25_0_0YGNodeRef parent;
  ABI25_0_0YGVector children;

  struct ABI25_0_0YGNode* nextChild;

  ABI25_0_0YGMeasureFunc measure;
  ABI25_0_0YGBaselineFunc baseline;
  ABI25_0_0YGPrintFunc print;
  ABI25_0_0YGConfigRef config;
  void* context;

  bool isDirty;
  bool hasNewLayout;
  ABI25_0_0YGNodeType nodeType;

  ABI25_0_0YGValue const* resolvedDimensions[2];
} ABI25_0_0YGNode;

#define ABI25_0_0YG_UNDEFINED_VALUES \
  { .value = ABI25_0_0YGUndefined, .unit = ABI25_0_0YGUnitUndefined }

#define ABI25_0_0YG_AUTO_VALUES \
  { .value = ABI25_0_0YGUndefined, .unit = ABI25_0_0YGUnitAuto }

#define ABI25_0_0YG_DEFAULT_EDGE_VALUES_UNIT                                            \
  {                                                                            \
    [ABI25_0_0YGEdgeLeft] = ABI25_0_0YG_UNDEFINED_VALUES, [ABI25_0_0YGEdgeTop] = ABI25_0_0YG_UNDEFINED_VALUES,     \
    [ABI25_0_0YGEdgeRight] = ABI25_0_0YG_UNDEFINED_VALUES, [ABI25_0_0YGEdgeBottom] = ABI25_0_0YG_UNDEFINED_VALUES, \
    [ABI25_0_0YGEdgeStart] = ABI25_0_0YG_UNDEFINED_VALUES, [ABI25_0_0YGEdgeEnd] = ABI25_0_0YG_UNDEFINED_VALUES,    \
    [ABI25_0_0YGEdgeHorizontal] = ABI25_0_0YG_UNDEFINED_VALUES,                                  \
    [ABI25_0_0YGEdgeVertical] = ABI25_0_0YG_UNDEFINED_VALUES, [ABI25_0_0YGEdgeAll] = ABI25_0_0YG_UNDEFINED_VALUES, \
  }

#define ABI25_0_0YG_DEFAULT_DIMENSION_VALUES \
  { [ABI25_0_0YGDimensionWidth] = ABI25_0_0YGUndefined, [ABI25_0_0YGDimensionHeight] = ABI25_0_0YGUndefined, }

#define ABI25_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT       \
  {                                            \
    [ABI25_0_0YGDimensionWidth] = ABI25_0_0YG_UNDEFINED_VALUES,  \
    [ABI25_0_0YGDimensionHeight] = ABI25_0_0YG_UNDEFINED_VALUES, \
  }

#define ABI25_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT \
  { [ABI25_0_0YGDimensionWidth] = ABI25_0_0YG_AUTO_VALUES, [ABI25_0_0YGDimensionHeight] = ABI25_0_0YG_AUTO_VALUES, }

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

static const ABI25_0_0YGStyle gABI25_0_0YGNodeStyleDefaults = {
    .direction = ABI25_0_0YGDirectionInherit,
    .flexDirection = ABI25_0_0YGFlexDirectionColumn,
    .justifyContent = ABI25_0_0YGJustifyFlexStart,
    .alignContent = ABI25_0_0YGAlignFlexStart,
    .alignItems = ABI25_0_0YGAlignStretch,
    .alignSelf = ABI25_0_0YGAlignAuto,
    .positionType = ABI25_0_0YGPositionTypeRelative,
    .flexWrap = ABI25_0_0YGWrapNoWrap,
    .overflow = ABI25_0_0YGOverflowVisible,
    .display = ABI25_0_0YGDisplayFlex,
    .flex = ABI25_0_0YGUndefined,
    .flexGrow = ABI25_0_0YGUndefined,
    .flexShrink = ABI25_0_0YGUndefined,
    .flexBasis = ABI25_0_0YG_AUTO_VALUES,
    .margin = ABI25_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
    .position = ABI25_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
    .padding = ABI25_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
    .border = ABI25_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
    .dimensions = ABI25_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT,
    .minDimensions = ABI25_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT,
    .maxDimensions = ABI25_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT,
    .aspectRatio = ABI25_0_0YGUndefined,
};

static const ABI25_0_0YGLayout gABI25_0_0YGNodeLayoutDefaults = {
    .position = {},
    .dimensions = ABI25_0_0YG_DEFAULT_DIMENSION_VALUES,
    .margin = {},
    .border = {},
    .padding = {},
    .direction = ABI25_0_0YGDirectionInherit,
    .computedFlexBasisGeneration = 0,
    .computedFlexBasis = ABI25_0_0YGUndefined,
    .hadOverflow = false,
    .generationCount = 0,
    .lastParentDirection = (ABI25_0_0YGDirection)-1,
    .nextCachedMeasurementsIndex = 0,
    .cachedMeasurements = {},
    .measuredDimensions = ABI25_0_0YG_DEFAULT_DIMENSION_VALUES,
    .cachedLayout =
        {
            .availableWidth = 0,
            .availableHeight = 0,
            .widthMeasureMode = (ABI25_0_0YGMeasureMode)-1,
            .heightMeasureMode = (ABI25_0_0YGMeasureMode)-1,
            .computedWidth = -1,
            .computedHeight = -1,
        },
};

static const ABI25_0_0YGNode gABI25_0_0YGNodeDefaults = {
    .style = gABI25_0_0YGNodeStyleDefaults,
    .layout = gABI25_0_0YGNodeLayoutDefaults,
    .lineIndex = 0,
    .parent = nullptr,
    .children = ABI25_0_0YGVector(),
    .nextChild = nullptr,
    .measure = nullptr,
    .baseline = nullptr,
    .print = nullptr,
    .config = nullptr,
    .context = nullptr,
    .isDirty = false,
    .hasNewLayout = true,
    .nodeType = ABI25_0_0YGNodeTypeDefault,
    .resolvedDimensions = {[ABI25_0_0YGDimensionWidth] = &ABI25_0_0YGValueUndefined,
                           [ABI25_0_0YGDimensionHeight] = &ABI25_0_0YGValueUndefined},
};

extern bool ABI25_0_0YGFloatsEqual(const float a, const float b);
extern bool ABI25_0_0YGValueEqual(const ABI25_0_0YGValue a, const ABI25_0_0YGValue b);
extern const ABI25_0_0YGValue* ABI25_0_0YGComputedEdgeValue(
    const ABI25_0_0YGValue edges[ABI25_0_0YGEdgeCount],
    const ABI25_0_0YGEdge edge,
    const ABI25_0_0YGValue* const defaultValue);
