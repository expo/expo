/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "ABI17_0_0YGNodeList.h"
#include "ABI17_0_0Yoga.h"

#ifdef _MSC_VER
#include <float.h>
#ifndef isnan
#define isnan _isnan
#endif

#ifndef __cplusplus
#define inline __inline
#endif

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  return (a > b) ? a : b;
}
#endif
#endif

typedef struct ABI17_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI17_0_0YGMeasureMode widthMeasureMode;
  ABI17_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} ABI17_0_0YGCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define ABI17_0_0YG_MAX_CACHED_RESULT_COUNT 16

typedef struct ABI17_0_0YGLayout {
  float position[4];
  float dimensions[2];
  float margin[6];
  float border[6];
  float padding[6];
  ABI17_0_0YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI17_0_0YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  ABI17_0_0YGCachedMeasurement cachedMeasurements[ABI17_0_0YG_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  ABI17_0_0YGCachedMeasurement cachedLayout;
} ABI17_0_0YGLayout;

typedef struct ABI17_0_0YGStyle {
  ABI17_0_0YGDirection direction;
  ABI17_0_0YGFlexDirection flexDirection;
  ABI17_0_0YGJustify justifyContent;
  ABI17_0_0YGAlign alignContent;
  ABI17_0_0YGAlign alignItems;
  ABI17_0_0YGAlign alignSelf;
  ABI17_0_0YGPositionType positionType;
  ABI17_0_0YGWrap flexWrap;
  ABI17_0_0YGOverflow overflow;
  ABI17_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI17_0_0YGValue flexBasis;
  ABI17_0_0YGValue margin[ABI17_0_0YGEdgeCount];
  ABI17_0_0YGValue position[ABI17_0_0YGEdgeCount];
  ABI17_0_0YGValue padding[ABI17_0_0YGEdgeCount];
  ABI17_0_0YGValue border[ABI17_0_0YGEdgeCount];
  ABI17_0_0YGValue dimensions[2];
  ABI17_0_0YGValue minDimensions[2];
  ABI17_0_0YGValue maxDimensions[2];

  // Yoga specific properties, not compatible with flexbox specification
  float aspectRatio;
} ABI17_0_0YGStyle;

typedef struct ABI17_0_0YGConfig {
  bool experimentalFeatures[ABI17_0_0YGExperimentalFeatureCount + 1];
  bool useWebDefaults;
  float pointScaleFactor;
} ABI17_0_0YGConfig;

typedef struct ABI17_0_0YGNode {
  ABI17_0_0YGStyle style;
  ABI17_0_0YGLayout layout;
  uint32_t lineIndex;

  ABI17_0_0YGNodeRef parent;
  ABI17_0_0YGNodeListRef children;

  struct ABI17_0_0YGNode *nextChild;

  ABI17_0_0YGMeasureFunc measure;
  ABI17_0_0YGBaselineFunc baseline;
  ABI17_0_0YGPrintFunc print;
  ABI17_0_0YGConfigRef config;
  void *context;

  bool isDirty;
  bool hasNewLayout;

  ABI17_0_0YGValue const *resolvedDimensions[2];
} ABI17_0_0YGNode;

#define ABI17_0_0YG_UNDEFINED_VALUES \
  { .value = ABI17_0_0YGUndefined, .unit = ABI17_0_0YGUnitUndefined }

#define ABI17_0_0YG_AUTO_VALUES \
  { .value = ABI17_0_0YGUndefined, .unit = ABI17_0_0YGUnitAuto }

#define ABI17_0_0YG_DEFAULT_EDGE_VALUES_UNIT                                                   \
  {                                                                                   \
    [ABI17_0_0YGEdgeLeft] = ABI17_0_0YG_UNDEFINED_VALUES, [ABI17_0_0YGEdgeTop] = ABI17_0_0YG_UNDEFINED_VALUES,            \
    [ABI17_0_0YGEdgeRight] = ABI17_0_0YG_UNDEFINED_VALUES, [ABI17_0_0YGEdgeBottom] = ABI17_0_0YG_UNDEFINED_VALUES,        \
    [ABI17_0_0YGEdgeStart] = ABI17_0_0YG_UNDEFINED_VALUES, [ABI17_0_0YGEdgeEnd] = ABI17_0_0YG_UNDEFINED_VALUES,           \
    [ABI17_0_0YGEdgeHorizontal] = ABI17_0_0YG_UNDEFINED_VALUES, [ABI17_0_0YGEdgeVertical] = ABI17_0_0YG_UNDEFINED_VALUES, \
    [ABI17_0_0YGEdgeAll] = ABI17_0_0YG_UNDEFINED_VALUES,                                                \
  }

#define ABI17_0_0YG_DEFAULT_DIMENSION_VALUES \
  { [ABI17_0_0YGDimensionWidth] = ABI17_0_0YGUndefined, [ABI17_0_0YGDimensionHeight] = ABI17_0_0YGUndefined, }

#define ABI17_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT \
  { [ABI17_0_0YGDimensionWidth] = ABI17_0_0YG_UNDEFINED_VALUES, [ABI17_0_0YGDimensionHeight] = ABI17_0_0YG_UNDEFINED_VALUES, }

#define ABI17_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT \
  { [ABI17_0_0YGDimensionWidth] = ABI17_0_0YG_AUTO_VALUES, [ABI17_0_0YGDimensionHeight] = ABI17_0_0YG_AUTO_VALUES, }

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

static ABI17_0_0YGNode gABI17_0_0YGNodeDefaults = {
    .parent = NULL,
    .children = NULL,
    .hasNewLayout = true,
    .isDirty = false,
    .resolvedDimensions = {[ABI17_0_0YGDimensionWidth] = &ABI17_0_0YGValueUndefined,
                           [ABI17_0_0YGDimensionHeight] = &ABI17_0_0YGValueUndefined},

    .style =
        {
            .flex = ABI17_0_0YGUndefined,
            .flexGrow = ABI17_0_0YGUndefined,
            .flexShrink = ABI17_0_0YGUndefined,
            .flexBasis = ABI17_0_0YG_AUTO_VALUES,
            .justifyContent = ABI17_0_0YGJustifyFlexStart,
            .alignItems = ABI17_0_0YGAlignStretch,
            .alignContent = ABI17_0_0YGAlignFlexStart,
            .direction = ABI17_0_0YGDirectionInherit,
            .flexDirection = ABI17_0_0YGFlexDirectionColumn,
            .overflow = ABI17_0_0YGOverflowVisible,
            .display = ABI17_0_0YGDisplayFlex,
            .dimensions = ABI17_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT,
            .minDimensions = ABI17_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .maxDimensions = ABI17_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .position = ABI17_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .margin = ABI17_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .padding = ABI17_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .border = ABI17_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .aspectRatio = ABI17_0_0YGUndefined,
        },

    .layout =
        {
            .dimensions = ABI17_0_0YG_DEFAULT_DIMENSION_VALUES,
            .lastParentDirection = (ABI17_0_0YGDirection) -1,
            .nextCachedMeasurementsIndex = 0,
            .computedFlexBasis = ABI17_0_0YGUndefined,
            .measuredDimensions = ABI17_0_0YG_DEFAULT_DIMENSION_VALUES,

            .cachedLayout =
                {
                    .widthMeasureMode = (ABI17_0_0YGMeasureMode) -1,
                    .heightMeasureMode = (ABI17_0_0YGMeasureMode) -1,
                    .computedWidth = -1,
                    .computedHeight = -1,
                },
        },
};

static ABI17_0_0YGConfig gABI17_0_0YGConfigDefaults = {
    .experimentalFeatures =
        {
                [ABI17_0_0YGExperimentalFeatureRounding] = false,
                [ABI17_0_0YGExperimentalFeatureMinFlexFix] = false,
                [ABI17_0_0YGExperimentalFeatureWebFlexBasis] = false,
        },
    .useWebDefaults = false,
    .pointScaleFactor = 1.0f
};

static void ABI17_0_0YGNodeMarkDirtyInternal(const ABI17_0_0YGNodeRef node);

ABI17_0_0YGMalloc gABI17_0_0YGMalloc = &malloc;
ABI17_0_0YGCalloc gABI17_0_0YGCalloc = &calloc;
ABI17_0_0YGRealloc gABI17_0_0YGRealloc = &realloc;
ABI17_0_0YGFree gABI17_0_0YGFree = &free;

static ABI17_0_0YGValue ABI17_0_0YGValueZero = {.value = 0, .unit = ABI17_0_0YGUnitPoint};

#ifdef ANDROID
#include <android/log.h>
static int ABI17_0_0YGAndroidLog(ABI17_0_0YGLogLevel level, const char *format, va_list args) {
  int androidLevel = ABI17_0_0YGLogLevelDebug;
  switch (level) {
    case ABI17_0_0YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case ABI17_0_0YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case ABI17_0_0YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case ABI17_0_0YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case ABI17_0_0YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
  }
  const int result = __android_log_vprint(androidLevel, "ABI17_0_0YG-layout", format, args);
  return result;
}
static ABI17_0_0YGLogger gLogger = &ABI17_0_0YGAndroidLog;
#else
static int ABI17_0_0YGDefaultLog(ABI17_0_0YGLogLevel level, const char *format, va_list args) {
  switch (level) {
    case ABI17_0_0YGLogLevelError:
      return vfprintf(stderr, format, args);
    case ABI17_0_0YGLogLevelWarn:
    case ABI17_0_0YGLogLevelInfo:
    case ABI17_0_0YGLogLevelDebug:
    case ABI17_0_0YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}
static ABI17_0_0YGLogger gLogger = &ABI17_0_0YGDefaultLog;
#endif

static inline const ABI17_0_0YGValue *ABI17_0_0YGComputedEdgeValue(const ABI17_0_0YGValue edges[ABI17_0_0YGEdgeCount],
                                                 const ABI17_0_0YGEdge edge,
                                                 const ABI17_0_0YGValue *const defaultValue) {
  ABI17_0_0YG_ASSERT(edge <= ABI17_0_0YGEdgeEnd, "Cannot get computed value of multi-edge shorthands");

  if (edges[edge].unit != ABI17_0_0YGUnitUndefined) {
    return &edges[edge];
  }

  if ((edge == ABI17_0_0YGEdgeTop || edge == ABI17_0_0YGEdgeBottom) &&
      edges[ABI17_0_0YGEdgeVertical].unit != ABI17_0_0YGUnitUndefined) {
    return &edges[ABI17_0_0YGEdgeVertical];
  }

  if ((edge == ABI17_0_0YGEdgeLeft || edge == ABI17_0_0YGEdgeRight || edge == ABI17_0_0YGEdgeStart || edge == ABI17_0_0YGEdgeEnd) &&
      edges[ABI17_0_0YGEdgeHorizontal].unit != ABI17_0_0YGUnitUndefined) {
    return &edges[ABI17_0_0YGEdgeHorizontal];
  }

  if (edges[ABI17_0_0YGEdgeAll].unit != ABI17_0_0YGUnitUndefined) {
    return &edges[ABI17_0_0YGEdgeAll];
  }

  if (edge == ABI17_0_0YGEdgeStart || edge == ABI17_0_0YGEdgeEnd) {
    return &ABI17_0_0YGValueUndefined;
  }

  return defaultValue;
}

static inline float ABI17_0_0YGResolveValue(const ABI17_0_0YGValue *const value, const float parentSize) {
  switch (value->unit) {
    case ABI17_0_0YGUnitUndefined:
    case ABI17_0_0YGUnitAuto:
      return ABI17_0_0YGUndefined;
    case ABI17_0_0YGUnitPoint:
      return value->value;
    case ABI17_0_0YGUnitPercent:
      return value->value * parentSize / 100.0f;
  }
  return ABI17_0_0YGUndefined;
}

static inline float ABI17_0_0YGResolveValueMargin(const ABI17_0_0YGValue *const value, const float parentSize) {
  return value->unit == ABI17_0_0YGUnitAuto ? 0 : ABI17_0_0YGResolveValue(value, parentSize);
}

int32_t gNodeInstanceCount = 0;

WIN_EXPORT ABI17_0_0YGNodeRef ABI17_0_0YGNodeNewWithConfig(const ABI17_0_0YGConfigRef config) {
  const ABI17_0_0YGNodeRef node = gABI17_0_0YGMalloc(sizeof(ABI17_0_0YGNode));
  ABI17_0_0YG_ASSERT(node, "Could not allocate memory for node");
  gNodeInstanceCount++;

  memcpy(node, &gABI17_0_0YGNodeDefaults, sizeof(ABI17_0_0YGNode));
  if (config->useWebDefaults) {
    node->style.flexDirection = ABI17_0_0YGFlexDirectionRow;
    node->style.alignContent = ABI17_0_0YGAlignStretch;
  }
  node->config = config;
  return node;
}

ABI17_0_0YGNodeRef ABI17_0_0YGNodeNew(void) {
  return ABI17_0_0YGNodeNewWithConfig(&gABI17_0_0YGConfigDefaults);
}

void ABI17_0_0YGNodeFree(const ABI17_0_0YGNodeRef node) {
  if (node->parent) {
    ABI17_0_0YGNodeListDelete(node->parent->children, node);
    node->parent = NULL;
  }

  const uint32_t childCount = ABI17_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeGetChild(node, i);
    child->parent = NULL;
  }

  ABI17_0_0YGNodeListFree(node->children);
  gABI17_0_0YGFree(node);
  gNodeInstanceCount--;
}

void ABI17_0_0YGNodeFreeRecursive(const ABI17_0_0YGNodeRef root) {
  while (ABI17_0_0YGNodeGetChildCount(root) > 0) {
    const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeGetChild(root, 0);
    ABI17_0_0YGNodeRemoveChild(root, child);
    ABI17_0_0YGNodeFreeRecursive(child);
  }
  ABI17_0_0YGNodeFree(root);
}

void ABI17_0_0YGNodeReset(const ABI17_0_0YGNodeRef node) {
  ABI17_0_0YG_ASSERT(ABI17_0_0YGNodeGetChildCount(node) == 0,
            "Cannot reset a node which still has children attached");
  ABI17_0_0YG_ASSERT(node->parent == NULL, "Cannot reset a node still attached to a parent");

  ABI17_0_0YGNodeListFree(node->children);

  const ABI17_0_0YGConfigRef config = node->config;
  memcpy(node, &gABI17_0_0YGNodeDefaults, sizeof(ABI17_0_0YGNode));
  if (config->useWebDefaults) {
    node->style.flexDirection = ABI17_0_0YGFlexDirectionRow;
    node->style.alignContent = ABI17_0_0YGAlignStretch;
  }
  node->config = config;
}

int32_t ABI17_0_0YGNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

ABI17_0_0YGConfigRef ABI17_0_0YGConfigNew(void) {
  const ABI17_0_0YGConfigRef config = gABI17_0_0YGMalloc(sizeof(ABI17_0_0YGConfig));
  ABI17_0_0YG_ASSERT(config, "Could not allocate memory for config");
  memcpy(config, &gABI17_0_0YGConfigDefaults, sizeof(ABI17_0_0YGConfig));
  return config;
}

void ABI17_0_0YGConfigFree(const ABI17_0_0YGConfigRef config) {
  gABI17_0_0YGFree(config);
}

static void ABI17_0_0YGNodeMarkDirtyInternal(const ABI17_0_0YGNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = ABI17_0_0YGUndefined;
    if (node->parent) {
      ABI17_0_0YGNodeMarkDirtyInternal(node->parent);
    }
  }
}

void ABI17_0_0YGNodeSetMeasureFunc(const ABI17_0_0YGNodeRef node, ABI17_0_0YGMeasureFunc measureFunc) {
  if (measureFunc == NULL) {
    node->measure = NULL;
  } else {
    ABI17_0_0YG_ASSERT(ABI17_0_0YGNodeGetChildCount(node) == 0,
              "Cannot set measure function: Nodes with measure functions cannot have children.");
    node->measure = measureFunc;
  }
}

ABI17_0_0YGMeasureFunc ABI17_0_0YGNodeGetMeasureFunc(const ABI17_0_0YGNodeRef node) {
  return node->measure;
}

void ABI17_0_0YGNodeSetBaselineFunc(const ABI17_0_0YGNodeRef node, ABI17_0_0YGBaselineFunc baselineFunc) {
  node->baseline = baselineFunc;
}

ABI17_0_0YGBaselineFunc ABI17_0_0YGNodeGetBaselineFunc(const ABI17_0_0YGNodeRef node) {
  return node->baseline;
}

void ABI17_0_0YGNodeInsertChild(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGNodeRef child, const uint32_t index) {
  ABI17_0_0YG_ASSERT(child->parent == NULL, "Child already has a parent, it must be removed first.");
  ABI17_0_0YG_ASSERT(node->measure == NULL,
            "Cannot add child: Nodes with measure functions cannot have children.");
  ABI17_0_0YGNodeListInsert(&node->children, child, index);
  child->parent = node;
  ABI17_0_0YGNodeMarkDirtyInternal(node);
}

void ABI17_0_0YGNodeRemoveChild(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGNodeRef child) {
  if (ABI17_0_0YGNodeListDelete(node->children, child) != NULL) {
    child->layout = gABI17_0_0YGNodeDefaults.layout; // layout is no longer valid
    child->parent = NULL;
    ABI17_0_0YGNodeMarkDirtyInternal(node);
  }
}

ABI17_0_0YGNodeRef ABI17_0_0YGNodeGetChild(const ABI17_0_0YGNodeRef node, const uint32_t index) {
  return ABI17_0_0YGNodeListGet(node->children, index);
}

ABI17_0_0YGNodeRef ABI17_0_0YGNodeGetParent(const ABI17_0_0YGNodeRef node) {
  return node->parent;
}

inline uint32_t ABI17_0_0YGNodeGetChildCount(const ABI17_0_0YGNodeRef node) {
  return ABI17_0_0YGNodeListCount(node->children);
}

void ABI17_0_0YGNodeMarkDirty(const ABI17_0_0YGNodeRef node) {
  ABI17_0_0YG_ASSERT(node->measure != NULL,
            "Only leaf nodes with custom measure functions"
            "should manually mark themselves as dirty");
  ABI17_0_0YGNodeMarkDirtyInternal(node);
}

bool ABI17_0_0YGNodeIsDirty(const ABI17_0_0YGNodeRef node) {
  return node->isDirty;
}

void ABI17_0_0YGNodeCopyStyle(const ABI17_0_0YGNodeRef dstNode, const ABI17_0_0YGNodeRef srcNode) {
  if (memcmp(&dstNode->style, &srcNode->style, sizeof(ABI17_0_0YGStyle)) != 0) {
    memcpy(&dstNode->style, &srcNode->style, sizeof(ABI17_0_0YGStyle));
    ABI17_0_0YGNodeMarkDirtyInternal(dstNode);
  }
}

static inline float ABI17_0_0YGResolveFlexGrow(const ABI17_0_0YGNodeRef node) {
  if (!ABI17_0_0YGFloatIsUndefined(node->style.flexGrow)) {
    return node->style.flexGrow;
  }
  if (!ABI17_0_0YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return node->style.flex;
  }
  return kDefaultFlexGrow;
}

float ABI17_0_0YGNodeStyleGetFlexGrow(const ABI17_0_0YGNodeRef node) {
  return ABI17_0_0YGFloatIsUndefined(node->style.flexGrow) ? kDefaultFlexGrow : node->style.flexGrow;
}

float ABI17_0_0YGNodeStyleGetFlexShrink(const ABI17_0_0YGNodeRef node) {
  return ABI17_0_0YGFloatIsUndefined(node->style.flexShrink) ? (node->config->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink) : node->style.flexShrink;
}

static inline float ABI17_0_0YGNodeResolveFlexShrink(const ABI17_0_0YGNodeRef node) {
  if (!ABI17_0_0YGFloatIsUndefined(node->style.flexShrink)) {
    return node->style.flexShrink;
  }
  if (!node->config->useWebDefaults && !ABI17_0_0YGFloatIsUndefined(node->style.flex) && node->style.flex < 0.0f) {
    return -node->style.flex;
  }
  return node->config->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}

static inline const ABI17_0_0YGValue *ABI17_0_0YGNodeResolveFlexBasisPtr(const ABI17_0_0YGNodeRef node) {
  if (node->style.flexBasis.unit != ABI17_0_0YGUnitAuto && node->style.flexBasis.unit != ABI17_0_0YGUnitUndefined) {
    return &node->style.flexBasis;
  }
  if (!ABI17_0_0YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return node->config->useWebDefaults ? &ABI17_0_0YGValueAuto : &ABI17_0_0YGValueZero;
  }
  return &ABI17_0_0YGValueAuto;
}

#define ABI17_0_0YG_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
  void ABI17_0_0YGNodeSet##name(const ABI17_0_0YGNodeRef node, type paramName) {     \
    node->instanceName = paramName;                                \
  }                                                                \
                                                                   \
  type ABI17_0_0YGNodeGet##name(const ABI17_0_0YGNodeRef node) {                     \
    return node->instanceName;                                     \
  }

#define ABI17_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
  void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node, const type paramName) {       \
    if (node->style.instanceName != paramName) {                                \
      node->style.instanceName = paramName;                                     \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                            \
    }                                                                           \
  }

#define ABI17_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(type, name, paramName, instanceName) \
  void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node, const type paramName) {            \
    if (node->style.instanceName.value != paramName ||                               \
        node->style.instanceName.unit != ABI17_0_0YGUnitPoint) {                              \
      node->style.instanceName.value = paramName;                                    \
      node->style.instanceName.unit =                                                \
          ABI17_0_0YGFloatIsUndefined(paramName) ? ABI17_0_0YGUnitAuto : ABI17_0_0YGUnitPoint;                  \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                                 \
    }                                                                                \
  }                                                                                  \
                                                                                     \
  void ABI17_0_0YGNodeStyleSet##name##Percent(const ABI17_0_0YGNodeRef node, const type paramName) {   \
    if (node->style.instanceName.value != paramName ||                               \
        node->style.instanceName.unit != ABI17_0_0YGUnitPercent) {                            \
      node->style.instanceName.value = paramName;                                    \
      node->style.instanceName.unit =                                                \
          ABI17_0_0YGFloatIsUndefined(paramName) ? ABI17_0_0YGUnitAuto : ABI17_0_0YGUnitPercent;                \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                                 \
    }                                                                                \
  }

#define ABI17_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(type, name, paramName, instanceName)         \
  void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node, const type paramName) {                         \
    if (node->style.instanceName.value != paramName ||                                            \
        node->style.instanceName.unit != ABI17_0_0YGUnitPoint) {                                           \
      node->style.instanceName.value = paramName;                                                 \
      node->style.instanceName.unit = ABI17_0_0YGFloatIsUndefined(paramName) ? ABI17_0_0YGUnitAuto : ABI17_0_0YGUnitPoint;   \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }                                                                                               \
                                                                                                  \
  void ABI17_0_0YGNodeStyleSet##name##Percent(const ABI17_0_0YGNodeRef node, const type paramName) {                \
    if (node->style.instanceName.value != paramName ||                                            \
        node->style.instanceName.unit != ABI17_0_0YGUnitPercent) {                                         \
      node->style.instanceName.value = paramName;                                                 \
      node->style.instanceName.unit = ABI17_0_0YGFloatIsUndefined(paramName) ? ABI17_0_0YGUnitAuto : ABI17_0_0YGUnitPercent; \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }                                                                                               \
                                                                                                  \
  void ABI17_0_0YGNodeStyleSet##name##Auto(const ABI17_0_0YGNodeRef node) {                                         \
    if (node->style.instanceName.unit != ABI17_0_0YGUnitAuto) {                                            \
      node->style.instanceName.value = ABI17_0_0YGUndefined;                                               \
      node->style.instanceName.unit = ABI17_0_0YGUnitAuto;                                                 \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }

#define ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  ABI17_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
                                                                          \
  type ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node) {                       \
    return node->style.instanceName;                                      \
  }

#define ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName)   \
  ABI17_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(float, name, paramName, instanceName) \
                                                                                \
  type ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node) {                             \
    return node->style.instanceName;                                            \
  }

#define ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(type, name, paramName, instanceName)   \
  ABI17_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(float, name, paramName, instanceName) \
                                                                                     \
  type ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node) {                                  \
    return node->style.instanceName;                                                 \
  }

#define ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(type, name, instanceName) \
  void ABI17_0_0YGNodeStyleSet##name##Auto(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge) { \
    if (node->style.instanceName[edge].unit != ABI17_0_0YGUnitAuto) {                 \
      node->style.instanceName[edge].value = ABI17_0_0YGUndefined;                    \
      node->style.instanceName[edge].unit = ABI17_0_0YGUnitAuto;                      \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                         \
    }                                                                        \
  }

#define ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName)            \
  void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge, const float paramName) { \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI17_0_0YGUnitPoint) {                                 \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI17_0_0YGFloatIsUndefined(paramName) ? ABI17_0_0YGUnitUndefined : ABI17_0_0YGUnitPoint;                      \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  void ABI17_0_0YGNodeStyleSet##name##Percent(const ABI17_0_0YGNodeRef node,                                    \
                                     const ABI17_0_0YGEdge edge,                                       \
                                     const float paramName) {                                 \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI17_0_0YGUnitPercent) {                               \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI17_0_0YGFloatIsUndefined(paramName) ? ABI17_0_0YGUnitUndefined : ABI17_0_0YGUnitPercent;                    \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  WIN_STRUCT(type) ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge) {            \
    return WIN_STRUCT_REF(node->style.instanceName[edge]);                                    \
  }

#define ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName)                 \
  void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge, const float paramName) { \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI17_0_0YGUnitPoint) {                                 \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI17_0_0YGFloatIsUndefined(paramName) ? ABI17_0_0YGUnitUndefined : ABI17_0_0YGUnitPoint;                      \
      ABI17_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  float ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge) {                       \
    return node->style.instanceName[edge].value;                                              \
  }

#define ABI17_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type ABI17_0_0YGNodeLayoutGet##name(const ABI17_0_0YGNodeRef node) {           \
    return node->layout.instanceName;                          \
  }

#define ABI17_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName)                    \
  type ABI17_0_0YGNodeLayoutGet##name(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge) {                    \
    ABI17_0_0YG_ASSERT(edge <= ABI17_0_0YGEdgeEnd, "Cannot get layout properties of multi-edge shorthands"); \
                                                                                           \
    if (edge == ABI17_0_0YGEdgeLeft) {                                                              \
      if (node->layout.direction == ABI17_0_0YGDirectionRTL) {                                      \
        return node->layout.instanceName[ABI17_0_0YGEdgeEnd];                                       \
      } else {                                                                             \
        return node->layout.instanceName[ABI17_0_0YGEdgeStart];                                     \
      }                                                                                    \
    }                                                                                      \
                                                                                           \
    if (edge == ABI17_0_0YGEdgeRight) {                                                             \
      if (node->layout.direction == ABI17_0_0YGDirectionRTL) {                                      \
        return node->layout.instanceName[ABI17_0_0YGEdgeStart];                                     \
      } else {                                                                             \
        return node->layout.instanceName[ABI17_0_0YGEdgeEnd];                                       \
      }                                                                                    \
    }                                                                                      \
                                                                                           \
    return node->layout.instanceName[edge];                                                \
  }

ABI17_0_0YG_NODE_PROPERTY_IMPL(void *, Context, context, context);
ABI17_0_0YG_NODE_PROPERTY_IMPL(ABI17_0_0YGPrintFunc, PrintFunc, printFunc, print);
ABI17_0_0YG_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);

ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGDirection, Direction, direction, direction);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGFlexDirection, FlexDirection, flexDirection, flexDirection);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGJustify, JustifyContent, justifyContent, justifyContent);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGAlign, AlignContent, alignContent, alignContent);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGAlign, AlignItems, alignItems, alignItems);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGAlign, AlignSelf, alignSelf, alignSelf);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGPositionType, PositionType, positionType, positionType);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGWrap, FlexWrap, flexWrap, flexWrap);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGOverflow, Overflow, overflow, overflow);
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI17_0_0YGDisplay, Display, display, display);

ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, Flex, flex, flex);
ABI17_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexGrow, flexGrow, flexGrow);
ABI17_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexShrink, flexShrink, flexShrink);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI17_0_0YGValue, FlexBasis, flexBasis, flexBasis);

ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI17_0_0YGValue, Position, position, position);
ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI17_0_0YGValue, Margin, margin, margin);
ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(ABI17_0_0YGValue, Margin, margin);
ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI17_0_0YGValue, Padding, padding, padding);
ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border);

ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI17_0_0YGValue, Width, width, dimensions[ABI17_0_0YGDimensionWidth]);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI17_0_0YGValue, Height, height, dimensions[ABI17_0_0YGDimensionHeight]);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI17_0_0YGValue, MinWidth, minWidth, minDimensions[ABI17_0_0YGDimensionWidth]);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI17_0_0YGValue, MinHeight, minHeight, minDimensions[ABI17_0_0YGDimensionHeight]);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI17_0_0YGValue, MaxWidth, maxWidth, maxDimensions[ABI17_0_0YGDimensionWidth]);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI17_0_0YGValue, MaxHeight, maxHeight, maxDimensions[ABI17_0_0YGDimensionHeight]);

// Yoga specific properties, not compatible with flexbox specification
ABI17_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, AspectRatio, aspectRatio, aspectRatio);

ABI17_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI17_0_0YGEdgeLeft]);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI17_0_0YGEdgeTop]);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI17_0_0YGEdgeRight]);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI17_0_0YGEdgeBottom]);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI17_0_0YGDimensionWidth]);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI17_0_0YGDimensionHeight]);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(ABI17_0_0YGDirection, Direction, direction);

ABI17_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin);
ABI17_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border);
ABI17_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding);

uint32_t gCurrentGenerationCount = 0;

bool ABI17_0_0YGLayoutNodeInternal(const ABI17_0_0YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const ABI17_0_0YGDirection parentDirection,
                          const ABI17_0_0YGMeasureMode widthMeasureMode,
                          const ABI17_0_0YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason,
                          const ABI17_0_0YGConfigRef config);

inline bool ABI17_0_0YGFloatIsUndefined(const float value) {
  return isnan(value);
}

static inline bool ABI17_0_0YGValueEqual(const ABI17_0_0YGValue a, const ABI17_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI17_0_0YGUnitUndefined) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

static inline void ABI17_0_0YGResolveDimensions(ABI17_0_0YGNodeRef node) {
  for (ABI17_0_0YGDimension dim = ABI17_0_0YGDimensionWidth; dim <= ABI17_0_0YGDimensionHeight; dim++) {
    if (node->style.maxDimensions[dim].unit != ABI17_0_0YGUnitUndefined &&
        ABI17_0_0YGValueEqual(node->style.maxDimensions[dim], node->style.minDimensions[dim])) {
      node->resolvedDimensions[dim] = &node->style.maxDimensions[dim];
    } else {
      node->resolvedDimensions[dim] = &node->style.dimensions[dim];
    }
  }
}

static inline bool ABI17_0_0YGFloatsEqual(const float a, const float b) {
  if (ABI17_0_0YGFloatIsUndefined(a)) {
    return ABI17_0_0YGFloatIsUndefined(b);
  }
  return fabs(a - b) < 0.0001f;
}

static void ABI17_0_0YGIndent(const uint32_t n) {
  for (uint32_t i = 0; i < n; i++) {
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "  ");
  }
}

static void ABI17_0_0YGPrintNumberIfNotZero(const char *str, const ABI17_0_0YGValue *const number) {
  if (!ABI17_0_0YGFloatsEqual(number->value, 0)) {
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug,
          "%s: %g%s, ",
          str,
          number->value,
          number->unit == ABI17_0_0YGUnitPoint ? "pt" : "%");
  }
}

static void ABI17_0_0YGPrintNumberIfNotUndefinedf(const char *str, const float number) {
  if (!ABI17_0_0YGFloatIsUndefined(number)) {
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "%s: %g, ", str, number);
  }
}

static void ABI17_0_0YGPrintNumberIfNotUndefined(const char *str, const ABI17_0_0YGValue *const number) {
  if (number->unit != ABI17_0_0YGUnitUndefined) {
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug,
          "%s: %g%s, ",
          str,
          number->value,
          number->unit == ABI17_0_0YGUnitPoint ? "pt" : "%");
  }
}

static bool ABI17_0_0YGFourValuesEqual(const ABI17_0_0YGValue four[4]) {
  return ABI17_0_0YGValueEqual(four[0], four[1]) && ABI17_0_0YGValueEqual(four[0], four[2]) &&
         ABI17_0_0YGValueEqual(four[0], four[3]);
}

static void ABI17_0_0YGNodePrintInternal(const ABI17_0_0YGNodeRef node,
                                const ABI17_0_0YGPrintOptions options,
                                const uint32_t level) {
  ABI17_0_0YGIndent(level);
  ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "{");

  if (node->print) {
    node->print(node);
  }

  if (options & ABI17_0_0YGPrintOptionsLayout) {
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "layout: {");
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "width: %g, ", node->layout.dimensions[ABI17_0_0YGDimensionWidth]);
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "height: %g, ", node->layout.dimensions[ABI17_0_0YGDimensionHeight]);
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "top: %g, ", node->layout.position[ABI17_0_0YGEdgeTop]);
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "left: %g", node->layout.position[ABI17_0_0YGEdgeLeft]);
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "}, ");
  }

  if (options & ABI17_0_0YGPrintOptionsStyle) {
    if (node->style.flexDirection == ABI17_0_0YGFlexDirectionColumn) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "flexDirection: 'column', ");
    } else if (node->style.flexDirection == ABI17_0_0YGFlexDirectionColumnReverse) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == ABI17_0_0YGFlexDirectionRow) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "flexDirection: 'row', ");
    } else if (node->style.flexDirection == ABI17_0_0YGFlexDirectionRowReverse) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == ABI17_0_0YGJustifyCenter) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "justifyContent: 'center', ");
    } else if (node->style.justifyContent == ABI17_0_0YGJustifyFlexEnd) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == ABI17_0_0YGJustifySpaceAround) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == ABI17_0_0YGJustifySpaceBetween) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == ABI17_0_0YGAlignCenter) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignItems: 'center', ");
    } else if (node->style.alignItems == ABI17_0_0YGAlignFlexEnd) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignItems: 'flex-end', ");
    } else if (node->style.alignItems == ABI17_0_0YGAlignStretch) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignItems: 'stretch', ");
    }

    if (node->style.alignContent == ABI17_0_0YGAlignCenter) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignContent: 'center', ");
    } else if (node->style.alignContent == ABI17_0_0YGAlignFlexEnd) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignContent: 'flex-end', ");
    } else if (node->style.alignContent == ABI17_0_0YGAlignStretch) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == ABI17_0_0YGAlignFlexStart) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == ABI17_0_0YGAlignCenter) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignSelf: 'center', ");
    } else if (node->style.alignSelf == ABI17_0_0YGAlignFlexEnd) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == ABI17_0_0YGAlignStretch) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "alignSelf: 'stretch', ");
    }

    ABI17_0_0YGPrintNumberIfNotUndefinedf("flexGrow", ABI17_0_0YGResolveFlexGrow(node));
    ABI17_0_0YGPrintNumberIfNotUndefinedf("flexShrink", ABI17_0_0YGNodeResolveFlexShrink(node));
    ABI17_0_0YGPrintNumberIfNotUndefined("flexBasis", ABI17_0_0YGNodeResolveFlexBasisPtr(node));

    if (node->style.overflow == ABI17_0_0YGOverflowHidden) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "overflow: 'hidden', ");
    } else if (node->style.overflow == ABI17_0_0YGOverflowVisible) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "overflow: 'visible', ");
    } else if (node->style.overflow == ABI17_0_0YGOverflowScroll) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "overflow: 'scroll', ");
    }

    if (ABI17_0_0YGFourValuesEqual(node->style.margin)) {
      ABI17_0_0YGPrintNumberIfNotZero("margin",
                             ABI17_0_0YGComputedEdgeValue(node->style.margin, ABI17_0_0YGEdgeLeft, &ABI17_0_0YGValueZero));
    } else {
      ABI17_0_0YGPrintNumberIfNotZero("marginLeft",
                             ABI17_0_0YGComputedEdgeValue(node->style.margin, ABI17_0_0YGEdgeLeft, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("marginRight",
                             ABI17_0_0YGComputedEdgeValue(node->style.margin, ABI17_0_0YGEdgeRight, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("marginTop",
                             ABI17_0_0YGComputedEdgeValue(node->style.margin, ABI17_0_0YGEdgeTop, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("marginBottom",
                             ABI17_0_0YGComputedEdgeValue(node->style.margin, ABI17_0_0YGEdgeBottom, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("marginStart",
                             ABI17_0_0YGComputedEdgeValue(node->style.margin, ABI17_0_0YGEdgeStart, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("marginEnd",
                             ABI17_0_0YGComputedEdgeValue(node->style.margin, ABI17_0_0YGEdgeEnd, &ABI17_0_0YGValueZero));
    }

    if (ABI17_0_0YGFourValuesEqual(node->style.padding)) {
      ABI17_0_0YGPrintNumberIfNotZero("padding",
                             ABI17_0_0YGComputedEdgeValue(node->style.padding, ABI17_0_0YGEdgeLeft, &ABI17_0_0YGValueZero));
    } else {
      ABI17_0_0YGPrintNumberIfNotZero("paddingLeft",
                             ABI17_0_0YGComputedEdgeValue(node->style.padding, ABI17_0_0YGEdgeLeft, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("paddingRight",
                             ABI17_0_0YGComputedEdgeValue(node->style.padding, ABI17_0_0YGEdgeRight, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("paddingTop",
                             ABI17_0_0YGComputedEdgeValue(node->style.padding, ABI17_0_0YGEdgeTop, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("paddingBottom",
                             ABI17_0_0YGComputedEdgeValue(node->style.padding, ABI17_0_0YGEdgeBottom, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("paddingStart",
                             ABI17_0_0YGComputedEdgeValue(node->style.padding, ABI17_0_0YGEdgeStart, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("paddingEnd",
                             ABI17_0_0YGComputedEdgeValue(node->style.padding, ABI17_0_0YGEdgeEnd, &ABI17_0_0YGValueZero));
    }

    if (ABI17_0_0YGFourValuesEqual(node->style.border)) {
      ABI17_0_0YGPrintNumberIfNotZero("borderWidth",
                             ABI17_0_0YGComputedEdgeValue(node->style.border, ABI17_0_0YGEdgeLeft, &ABI17_0_0YGValueZero));
    } else {
      ABI17_0_0YGPrintNumberIfNotZero("borderLeftWidth",
                             ABI17_0_0YGComputedEdgeValue(node->style.border, ABI17_0_0YGEdgeLeft, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("borderRightWidth",
                             ABI17_0_0YGComputedEdgeValue(node->style.border, ABI17_0_0YGEdgeRight, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("borderTopWidth",
                             ABI17_0_0YGComputedEdgeValue(node->style.border, ABI17_0_0YGEdgeTop, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("borderBottomWidth",
                             ABI17_0_0YGComputedEdgeValue(node->style.border, ABI17_0_0YGEdgeBottom, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("borderStartWidth",
                             ABI17_0_0YGComputedEdgeValue(node->style.border, ABI17_0_0YGEdgeStart, &ABI17_0_0YGValueZero));
      ABI17_0_0YGPrintNumberIfNotZero("borderEndWidth",
                             ABI17_0_0YGComputedEdgeValue(node->style.border, ABI17_0_0YGEdgeEnd, &ABI17_0_0YGValueZero));
    }

    ABI17_0_0YGPrintNumberIfNotUndefined("width", &node->style.dimensions[ABI17_0_0YGDimensionWidth]);
    ABI17_0_0YGPrintNumberIfNotUndefined("height", &node->style.dimensions[ABI17_0_0YGDimensionHeight]);
    ABI17_0_0YGPrintNumberIfNotUndefined("maxWidth", &node->style.maxDimensions[ABI17_0_0YGDimensionWidth]);
    ABI17_0_0YGPrintNumberIfNotUndefined("maxHeight", &node->style.maxDimensions[ABI17_0_0YGDimensionHeight]);
    ABI17_0_0YGPrintNumberIfNotUndefined("minWidth", &node->style.minDimensions[ABI17_0_0YGDimensionWidth]);
    ABI17_0_0YGPrintNumberIfNotUndefined("minHeight", &node->style.minDimensions[ABI17_0_0YGDimensionHeight]);

    if (node->style.positionType == ABI17_0_0YGPositionTypeAbsolute) {
      ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "position: 'absolute', ");
    }

    ABI17_0_0YGPrintNumberIfNotUndefined(
        "left", ABI17_0_0YGComputedEdgeValue(node->style.position, ABI17_0_0YGEdgeLeft, &ABI17_0_0YGValueUndefined));
    ABI17_0_0YGPrintNumberIfNotUndefined(
        "right", ABI17_0_0YGComputedEdgeValue(node->style.position, ABI17_0_0YGEdgeRight, &ABI17_0_0YGValueUndefined));
    ABI17_0_0YGPrintNumberIfNotUndefined(
        "top", ABI17_0_0YGComputedEdgeValue(node->style.position, ABI17_0_0YGEdgeTop, &ABI17_0_0YGValueUndefined));
    ABI17_0_0YGPrintNumberIfNotUndefined(
        "bottom", ABI17_0_0YGComputedEdgeValue(node->style.position, ABI17_0_0YGEdgeBottom, &ABI17_0_0YGValueUndefined));
  }

  const uint32_t childCount = ABI17_0_0YGNodeListCount(node->children);
  if (options & ABI17_0_0YGPrintOptionsChildren && childCount > 0) {
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "children: [\n");
    for (uint32_t i = 0; i < childCount; i++) {
      ABI17_0_0YGNodePrintInternal(ABI17_0_0YGNodeGetChild(node, i), options, level + 1);
    }
    ABI17_0_0YGIndent(level);
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "]},\n");
  } else {
    ABI17_0_0YGLog(ABI17_0_0YGLogLevelDebug, "},\n");
  }
}

void ABI17_0_0YGNodePrint(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGPrintOptions options) {
  ABI17_0_0YGNodePrintInternal(node, options, 0);
}

static const ABI17_0_0YGEdge leading[4] = {
        [ABI17_0_0YGFlexDirectionColumn] = ABI17_0_0YGEdgeTop,
        [ABI17_0_0YGFlexDirectionColumnReverse] = ABI17_0_0YGEdgeBottom,
        [ABI17_0_0YGFlexDirectionRow] = ABI17_0_0YGEdgeLeft,
        [ABI17_0_0YGFlexDirectionRowReverse] = ABI17_0_0YGEdgeRight,
};
static const ABI17_0_0YGEdge trailing[4] = {
        [ABI17_0_0YGFlexDirectionColumn] = ABI17_0_0YGEdgeBottom,
        [ABI17_0_0YGFlexDirectionColumnReverse] = ABI17_0_0YGEdgeTop,
        [ABI17_0_0YGFlexDirectionRow] = ABI17_0_0YGEdgeRight,
        [ABI17_0_0YGFlexDirectionRowReverse] = ABI17_0_0YGEdgeLeft,
};
static const ABI17_0_0YGEdge pos[4] = {
        [ABI17_0_0YGFlexDirectionColumn] = ABI17_0_0YGEdgeTop,
        [ABI17_0_0YGFlexDirectionColumnReverse] = ABI17_0_0YGEdgeBottom,
        [ABI17_0_0YGFlexDirectionRow] = ABI17_0_0YGEdgeLeft,
        [ABI17_0_0YGFlexDirectionRowReverse] = ABI17_0_0YGEdgeRight,
};
static const ABI17_0_0YGDimension dim[4] = {
        [ABI17_0_0YGFlexDirectionColumn] = ABI17_0_0YGDimensionHeight,
        [ABI17_0_0YGFlexDirectionColumnReverse] = ABI17_0_0YGDimensionHeight,
        [ABI17_0_0YGFlexDirectionRow] = ABI17_0_0YGDimensionWidth,
        [ABI17_0_0YGFlexDirectionRowReverse] = ABI17_0_0YGDimensionWidth,
};

static inline bool ABI17_0_0YGFlexDirectionIsRow(const ABI17_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI17_0_0YGFlexDirectionRow || flexDirection == ABI17_0_0YGFlexDirectionRowReverse;
}

static inline bool ABI17_0_0YGFlexDirectionIsColumn(const ABI17_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI17_0_0YGFlexDirectionColumn || flexDirection == ABI17_0_0YGFlexDirectionColumnReverse;
}

static inline float ABI17_0_0YGNodeLeadingMargin(const ABI17_0_0YGNodeRef node,
                                        const ABI17_0_0YGFlexDirection axis,
                                        const float widthSize) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI17_0_0YGEdgeStart].unit != ABI17_0_0YGUnitUndefined) {
    return ABI17_0_0YGResolveValueMargin(&node->style.margin[ABI17_0_0YGEdgeStart], widthSize);
  }

  return ABI17_0_0YGResolveValueMargin(ABI17_0_0YGComputedEdgeValue(node->style.margin, leading[axis], &ABI17_0_0YGValueZero),
                              widthSize);
}

static float ABI17_0_0YGNodeTrailingMargin(const ABI17_0_0YGNodeRef node,
                                  const ABI17_0_0YGFlexDirection axis,
                                  const float widthSize) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI17_0_0YGEdgeEnd].unit != ABI17_0_0YGUnitUndefined) {
    return ABI17_0_0YGResolveValueMargin(&node->style.margin[ABI17_0_0YGEdgeEnd], widthSize);
  }

  return ABI17_0_0YGResolveValueMargin(ABI17_0_0YGComputedEdgeValue(node->style.margin, trailing[axis], &ABI17_0_0YGValueZero),
                              widthSize);
}

static float ABI17_0_0YGNodeLeadingPadding(const ABI17_0_0YGNodeRef node,
                                  const ABI17_0_0YGFlexDirection axis,
                                  const float widthSize) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis) && node->style.padding[ABI17_0_0YGEdgeStart].unit != ABI17_0_0YGUnitUndefined &&
      ABI17_0_0YGResolveValue(&node->style.padding[ABI17_0_0YGEdgeStart], widthSize) >= 0.0f) {
    return ABI17_0_0YGResolveValue(&node->style.padding[ABI17_0_0YGEdgeStart], widthSize);
  }

  return fmaxf(ABI17_0_0YGResolveValue(ABI17_0_0YGComputedEdgeValue(node->style.padding, leading[axis], &ABI17_0_0YGValueZero),
                              widthSize),
               0.0f);
}

static float ABI17_0_0YGNodeTrailingPadding(const ABI17_0_0YGNodeRef node,
                                   const ABI17_0_0YGFlexDirection axis,
                                   const float widthSize) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis) && node->style.padding[ABI17_0_0YGEdgeEnd].unit != ABI17_0_0YGUnitUndefined &&
      ABI17_0_0YGResolveValue(&node->style.padding[ABI17_0_0YGEdgeEnd], widthSize) >= 0.0f) {
    return ABI17_0_0YGResolveValue(&node->style.padding[ABI17_0_0YGEdgeEnd], widthSize);
  }

  return fmaxf(ABI17_0_0YGResolveValue(ABI17_0_0YGComputedEdgeValue(node->style.padding, trailing[axis], &ABI17_0_0YGValueZero),
                              widthSize),
               0.0f);
}

static float ABI17_0_0YGNodeLeadingBorder(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGFlexDirection axis) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis) && node->style.border[ABI17_0_0YGEdgeStart].unit != ABI17_0_0YGUnitUndefined &&
      node->style.border[ABI17_0_0YGEdgeStart].value >= 0.0f) {
    return node->style.border[ABI17_0_0YGEdgeStart].value;
  }

  return fmaxf(ABI17_0_0YGComputedEdgeValue(node->style.border, leading[axis], &ABI17_0_0YGValueZero)->value, 0.0f);
}

static float ABI17_0_0YGNodeTrailingBorder(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGFlexDirection axis) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis) && node->style.border[ABI17_0_0YGEdgeEnd].unit != ABI17_0_0YGUnitUndefined &&
      node->style.border[ABI17_0_0YGEdgeEnd].value >= 0.0f) {
    return node->style.border[ABI17_0_0YGEdgeEnd].value;
  }

  return fmaxf(ABI17_0_0YGComputedEdgeValue(node->style.border, trailing[axis], &ABI17_0_0YGValueZero)->value, 0.0f);
}

static inline float ABI17_0_0YGNodeLeadingPaddingAndBorder(const ABI17_0_0YGNodeRef node,
                                                  const ABI17_0_0YGFlexDirection axis,
                                                  const float widthSize) {
  return ABI17_0_0YGNodeLeadingPadding(node, axis, widthSize) + ABI17_0_0YGNodeLeadingBorder(node, axis);
}

static inline float ABI17_0_0YGNodeTrailingPaddingAndBorder(const ABI17_0_0YGNodeRef node,
                                                   const ABI17_0_0YGFlexDirection axis,
                                                   const float widthSize) {
  return ABI17_0_0YGNodeTrailingPadding(node, axis, widthSize) + ABI17_0_0YGNodeTrailingBorder(node, axis);
}

static inline float ABI17_0_0YGNodeMarginForAxis(const ABI17_0_0YGNodeRef node,
                                        const ABI17_0_0YGFlexDirection axis,
                                        const float widthSize) {
  return ABI17_0_0YGNodeLeadingMargin(node, axis, widthSize) + ABI17_0_0YGNodeTrailingMargin(node, axis, widthSize);
}

static inline float ABI17_0_0YGNodePaddingAndBorderForAxis(const ABI17_0_0YGNodeRef node,
                                                  const ABI17_0_0YGFlexDirection axis,
                                                  const float widthSize) {
  return ABI17_0_0YGNodeLeadingPaddingAndBorder(node, axis, widthSize) +
         ABI17_0_0YGNodeTrailingPaddingAndBorder(node, axis, widthSize);
}

static inline ABI17_0_0YGAlign ABI17_0_0YGNodeAlignItem(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGNodeRef child) {
  const ABI17_0_0YGAlign align =
      child->style.alignSelf == ABI17_0_0YGAlignAuto ? node->style.alignItems : child->style.alignSelf;
  if (align == ABI17_0_0YGAlignBaseline && ABI17_0_0YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return ABI17_0_0YGAlignFlexStart;
  }
  return align;
}

static inline ABI17_0_0YGDirection ABI17_0_0YGNodeResolveDirection(const ABI17_0_0YGNodeRef node,
                                                 const ABI17_0_0YGDirection parentDirection) {
  if (node->style.direction == ABI17_0_0YGDirectionInherit) {
    return parentDirection > ABI17_0_0YGDirectionInherit ? parentDirection : ABI17_0_0YGDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static float ABI17_0_0YGBaseline(const ABI17_0_0YGNodeRef node) {
  if (node->baseline != NULL) {
    const float baseline = node->baseline(node,
                                          node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth],
                                          node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight]);
    ABI17_0_0YG_ASSERT(!ABI17_0_0YGFloatIsUndefined(baseline), "Expect custom baseline function to not return NaN")
    return baseline;
  }

  ABI17_0_0YGNodeRef baselineChild = NULL;
  const uint32_t childCount = ABI17_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeGetChild(node, i);
    if (child->lineIndex > 0) {
      break;
    }
    if (child->style.positionType == ABI17_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (ABI17_0_0YGNodeAlignItem(node, child) == ABI17_0_0YGAlignBaseline) {
      baselineChild = child;
      break;
    }

    if (baselineChild == NULL) {
      baselineChild = child;
    }
  }

  if (baselineChild == NULL) {
    return node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight];
  }

  const float baseline = ABI17_0_0YGBaseline(baselineChild);
  return baseline + baselineChild->layout.position[ABI17_0_0YGEdgeTop];
}

static inline ABI17_0_0YGFlexDirection ABI17_0_0YGResolveFlexDirection(const ABI17_0_0YGFlexDirection flexDirection,
                                                     const ABI17_0_0YGDirection direction) {
  if (direction == ABI17_0_0YGDirectionRTL) {
    if (flexDirection == ABI17_0_0YGFlexDirectionRow) {
      return ABI17_0_0YGFlexDirectionRowReverse;
    } else if (flexDirection == ABI17_0_0YGFlexDirectionRowReverse) {
      return ABI17_0_0YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static ABI17_0_0YGFlexDirection ABI17_0_0YGFlexDirectionCross(const ABI17_0_0YGFlexDirection flexDirection,
                                            const ABI17_0_0YGDirection direction) {
  return ABI17_0_0YGFlexDirectionIsColumn(flexDirection)
             ? ABI17_0_0YGResolveFlexDirection(ABI17_0_0YGFlexDirectionRow, direction)
             : ABI17_0_0YGFlexDirectionColumn;
}

static inline bool ABI17_0_0YGNodeIsFlex(const ABI17_0_0YGNodeRef node) {
  return (node->style.positionType == ABI17_0_0YGPositionTypeRelative &&
          (ABI17_0_0YGResolveFlexGrow(node) != 0 || ABI17_0_0YGNodeResolveFlexShrink(node) != 0));
}

static bool ABI17_0_0YGIsBaselineLayout(const ABI17_0_0YGNodeRef node) {
  if (ABI17_0_0YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return false;
  }
  if (node->style.alignItems == ABI17_0_0YGAlignBaseline) {
    return true;
  }
  const uint32_t childCount = ABI17_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeGetChild(node, i);
    if (child->style.positionType == ABI17_0_0YGPositionTypeRelative &&
        child->style.alignSelf == ABI17_0_0YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float ABI17_0_0YGNodeDimWithMargin(const ABI17_0_0YGNodeRef node,
                                        const ABI17_0_0YGFlexDirection axis,
                                        const float widthSize) {
  return node->layout.measuredDimensions[dim[axis]] + ABI17_0_0YGNodeLeadingMargin(node, axis, widthSize) +
         ABI17_0_0YGNodeTrailingMargin(node, axis, widthSize);
}

static inline bool ABI17_0_0YGNodeIsStyleDimDefined(const ABI17_0_0YGNodeRef node,
                                           const ABI17_0_0YGFlexDirection axis,
                                           const float parentSize) {
  return !(node->resolvedDimensions[dim[axis]]->unit == ABI17_0_0YGUnitAuto ||
           node->resolvedDimensions[dim[axis]]->unit == ABI17_0_0YGUnitUndefined ||
           (node->resolvedDimensions[dim[axis]]->unit == ABI17_0_0YGUnitPoint &&
            node->resolvedDimensions[dim[axis]]->value < 0.0f) ||
           (node->resolvedDimensions[dim[axis]]->unit == ABI17_0_0YGUnitPercent &&
            (node->resolvedDimensions[dim[axis]]->value < 0.0f || ABI17_0_0YGFloatIsUndefined(parentSize))));
}

static inline bool ABI17_0_0YGNodeIsLayoutDimDefined(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !ABI17_0_0YGFloatIsUndefined(value) && value >= 0.0f;
}

static inline bool ABI17_0_0YGNodeIsLeadingPosDefined(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGFlexDirection axis) {
  return (ABI17_0_0YGFlexDirectionIsRow(axis) &&
          ABI17_0_0YGComputedEdgeValue(node->style.position, ABI17_0_0YGEdgeStart, &ABI17_0_0YGValueUndefined)->unit !=
              ABI17_0_0YGUnitUndefined) ||
         ABI17_0_0YGComputedEdgeValue(node->style.position, leading[axis], &ABI17_0_0YGValueUndefined)->unit !=
             ABI17_0_0YGUnitUndefined;
}

static inline bool ABI17_0_0YGNodeIsTrailingPosDefined(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGFlexDirection axis) {
  return (ABI17_0_0YGFlexDirectionIsRow(axis) &&
          ABI17_0_0YGComputedEdgeValue(node->style.position, ABI17_0_0YGEdgeEnd, &ABI17_0_0YGValueUndefined)->unit !=
              ABI17_0_0YGUnitUndefined) ||
         ABI17_0_0YGComputedEdgeValue(node->style.position, trailing[axis], &ABI17_0_0YGValueUndefined)->unit !=
             ABI17_0_0YGUnitUndefined;
}

static float ABI17_0_0YGNodeLeadingPosition(const ABI17_0_0YGNodeRef node,
                                   const ABI17_0_0YGFlexDirection axis,
                                   const float axisSize) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis)) {
    const ABI17_0_0YGValue *leadingPosition =
        ABI17_0_0YGComputedEdgeValue(node->style.position, ABI17_0_0YGEdgeStart, &ABI17_0_0YGValueUndefined);
    if (leadingPosition->unit != ABI17_0_0YGUnitUndefined) {
      return ABI17_0_0YGResolveValue(leadingPosition, axisSize);
    }
  }

  const ABI17_0_0YGValue *leadingPosition =
      ABI17_0_0YGComputedEdgeValue(node->style.position, leading[axis], &ABI17_0_0YGValueUndefined);

  return leadingPosition->unit == ABI17_0_0YGUnitUndefined ? 0.0f
                                                  : ABI17_0_0YGResolveValue(leadingPosition, axisSize);
}

static float ABI17_0_0YGNodeTrailingPosition(const ABI17_0_0YGNodeRef node,
                                    const ABI17_0_0YGFlexDirection axis,
                                    const float axisSize) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis)) {
    const ABI17_0_0YGValue *trailingPosition =
        ABI17_0_0YGComputedEdgeValue(node->style.position, ABI17_0_0YGEdgeEnd, &ABI17_0_0YGValueUndefined);
    if (trailingPosition->unit != ABI17_0_0YGUnitUndefined) {
      return ABI17_0_0YGResolveValue(trailingPosition, axisSize);
    }
  }

  const ABI17_0_0YGValue *trailingPosition =
      ABI17_0_0YGComputedEdgeValue(node->style.position, trailing[axis], &ABI17_0_0YGValueUndefined);

  return trailingPosition->unit == ABI17_0_0YGUnitUndefined ? 0.0f
                                                   : ABI17_0_0YGResolveValue(trailingPosition, axisSize);
}

static float ABI17_0_0YGNodeBoundAxisWithinMinAndMax(const ABI17_0_0YGNodeRef node,
                                            const ABI17_0_0YGFlexDirection axis,
                                            const float value,
                                            const float axisSize) {
  float min = ABI17_0_0YGUndefined;
  float max = ABI17_0_0YGUndefined;

  if (ABI17_0_0YGFlexDirectionIsColumn(axis)) {
    min = ABI17_0_0YGResolveValue(&node->style.minDimensions[ABI17_0_0YGDimensionHeight], axisSize);
    max = ABI17_0_0YGResolveValue(&node->style.maxDimensions[ABI17_0_0YGDimensionHeight], axisSize);
  } else if (ABI17_0_0YGFlexDirectionIsRow(axis)) {
    min = ABI17_0_0YGResolveValue(&node->style.minDimensions[ABI17_0_0YGDimensionWidth], axisSize);
    max = ABI17_0_0YGResolveValue(&node->style.maxDimensions[ABI17_0_0YGDimensionWidth], axisSize);
  }

  float boundValue = value;

  if (!ABI17_0_0YGFloatIsUndefined(max) && max >= 0.0f && boundValue > max) {
    boundValue = max;
  }

  if (!ABI17_0_0YGFloatIsUndefined(min) && min >= 0.0f && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

static inline ABI17_0_0YGValue *ABI17_0_0YGMarginLeadingValue(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGFlexDirection axis) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI17_0_0YGEdgeStart].unit != ABI17_0_0YGUnitUndefined) {
    return &node->style.margin[ABI17_0_0YGEdgeStart];
  } else {
    return &node->style.margin[leading[axis]];
  }
}

static inline ABI17_0_0YGValue *ABI17_0_0YGMarginTrailingValue(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGFlexDirection axis) {
  if (ABI17_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI17_0_0YGEdgeEnd].unit != ABI17_0_0YGUnitUndefined) {
    return &node->style.margin[ABI17_0_0YGEdgeEnd];
  } else {
    return &node->style.margin[trailing[axis]];
  }
}

// Like ABI17_0_0YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static inline float ABI17_0_0YGNodeBoundAxis(const ABI17_0_0YGNodeRef node,
                                    const ABI17_0_0YGFlexDirection axis,
                                    const float value,
                                    const float axisSize,
                                    const float widthSize) {
  return fmaxf(ABI17_0_0YGNodeBoundAxisWithinMinAndMax(node, axis, value, axisSize),
               ABI17_0_0YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void ABI17_0_0YGNodeSetChildTrailingPosition(const ABI17_0_0YGNodeRef node,
                                           const ABI17_0_0YGNodeRef child,
                                           const ABI17_0_0YGFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float ABI17_0_0YGNodeRelativePosition(const ABI17_0_0YGNodeRef node,
                                    const ABI17_0_0YGFlexDirection axis,
                                    const float axisSize) {
  return ABI17_0_0YGNodeIsLeadingPosDefined(node, axis) ? ABI17_0_0YGNodeLeadingPosition(node, axis, axisSize)
                                               : -ABI17_0_0YGNodeTrailingPosition(node, axis, axisSize);
}

static void ABI17_0_0YGConstrainMaxSizeForMode(const ABI17_0_0YGNodeRef node,
                                      const enum ABI17_0_0YGFlexDirection axis,
                                      const float parentAxisSize,
                                      const float parentWidth,
                                      ABI17_0_0YGMeasureMode *mode,
                                      float *size) {
  const float maxSize = ABI17_0_0YGResolveValue(&node->style.maxDimensions[dim[axis]], parentAxisSize) +
                        ABI17_0_0YGNodeMarginForAxis(node, axis, parentWidth);
  switch (*mode) {
    case ABI17_0_0YGMeasureModeExactly:
    case ABI17_0_0YGMeasureModeAtMost:
      *size = (ABI17_0_0YGFloatIsUndefined(maxSize) || *size < maxSize) ? *size : maxSize;
      break;
    case ABI17_0_0YGMeasureModeUndefined:
      if (!ABI17_0_0YGFloatIsUndefined(maxSize)) {
        *mode = ABI17_0_0YGMeasureModeAtMost;
        *size = maxSize;
      }
      break;
  }
}

static void ABI17_0_0YGNodeSetPosition(const ABI17_0_0YGNodeRef node,
                              const ABI17_0_0YGDirection direction,
                              const float mainSize,
                              const float crossSize,
                              const float parentWidth) {
  const ABI17_0_0YGFlexDirection mainAxis = ABI17_0_0YGResolveFlexDirection(node->style.flexDirection, direction);
  const ABI17_0_0YGFlexDirection crossAxis = ABI17_0_0YGFlexDirectionCross(mainAxis, direction);
  const float relativePositionMain = ABI17_0_0YGNodeRelativePosition(node, mainAxis, mainSize);
  const float relativePositionCross = ABI17_0_0YGNodeRelativePosition(node, crossAxis, crossSize);

  node->layout.position[leading[mainAxis]] =
      ABI17_0_0YGNodeLeadingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[trailing[mainAxis]] =
      ABI17_0_0YGNodeTrailingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[leading[crossAxis]] =
      ABI17_0_0YGNodeLeadingMargin(node, crossAxis, parentWidth) + relativePositionCross;
  node->layout.position[trailing[crossAxis]] =
      ABI17_0_0YGNodeTrailingMargin(node, crossAxis, parentWidth) + relativePositionCross;
}

static void ABI17_0_0YGNodeComputeFlexBasisForChild(const ABI17_0_0YGNodeRef node,
                                           const ABI17_0_0YGNodeRef child,
                                           const float width,
                                           const ABI17_0_0YGMeasureMode widthMode,
                                           const float height,
                                           const float parentWidth,
                                           const float parentHeight,
                                           const ABI17_0_0YGMeasureMode heightMode,
                                           const ABI17_0_0YGDirection direction,
                                           const ABI17_0_0YGConfigRef config) {
  const ABI17_0_0YGFlexDirection mainAxis = ABI17_0_0YGResolveFlexDirection(node->style.flexDirection, direction);
  const bool isMainAxisRow = ABI17_0_0YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;

  float childWidth;
  float childHeight;
  ABI17_0_0YGMeasureMode childWidthMeasureMode;
  ABI17_0_0YGMeasureMode childHeightMeasureMode;

  const float resolvedFlexBasis =
      ABI17_0_0YGResolveValue(ABI17_0_0YGNodeResolveFlexBasisPtr(child), mainAxisParentSize);
  const bool isRowStyleDimDefined = ABI17_0_0YGNodeIsStyleDimDefined(child, ABI17_0_0YGFlexDirectionRow, parentWidth);
  const bool isColumnStyleDimDefined =
      ABI17_0_0YGNodeIsStyleDimDefined(child, ABI17_0_0YGFlexDirectionColumn, parentHeight);

  if (!ABI17_0_0YGFloatIsUndefined(resolvedFlexBasis) && !ABI17_0_0YGFloatIsUndefined(mainAxisSize)) {
    if (ABI17_0_0YGFloatIsUndefined(child->layout.computedFlexBasis) ||
        (ABI17_0_0YGConfigIsExperimentalFeatureEnabled(child->config, ABI17_0_0YGExperimentalFeatureWebFlexBasis) &&
         child->layout.computedFlexBasisGeneration != gCurrentGenerationCount)) {
      child->layout.computedFlexBasis =
          fmaxf(resolvedFlexBasis, ABI17_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(ABI17_0_0YGResolveValue(child->resolvedDimensions[ABI17_0_0YGDimensionWidth], parentWidth),
              ABI17_0_0YGNodePaddingAndBorderForAxis(child, ABI17_0_0YGFlexDirectionRow, parentWidth));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(ABI17_0_0YGResolveValue(child->resolvedDimensions[ABI17_0_0YGDimensionHeight], parentHeight),
              ABI17_0_0YGNodePaddingAndBorderForAxis(child, ABI17_0_0YGFlexDirectionColumn, parentWidth));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = ABI17_0_0YGUndefined;
    childHeight = ABI17_0_0YGUndefined;
    childWidthMeasureMode = ABI17_0_0YGMeasureModeUndefined;
    childHeightMeasureMode = ABI17_0_0YGMeasureModeUndefined;

    const float marginRow = ABI17_0_0YGNodeMarginForAxis(child, ABI17_0_0YGFlexDirectionRow, parentWidth);
    const float marginColumn = ABI17_0_0YGNodeMarginForAxis(child, ABI17_0_0YGFlexDirectionColumn, parentWidth);

    if (isRowStyleDimDefined) {
      childWidth =
          ABI17_0_0YGResolveValue(child->resolvedDimensions[ABI17_0_0YGDimensionWidth], parentWidth) + marginRow;
      childWidthMeasureMode = ABI17_0_0YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          ABI17_0_0YGResolveValue(child->resolvedDimensions[ABI17_0_0YGDimensionHeight], parentHeight) + marginColumn;
      childHeightMeasureMode = ABI17_0_0YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->style.overflow == ABI17_0_0YGOverflowScroll) ||
        node->style.overflow != ABI17_0_0YGOverflowScroll) {
      if (ABI17_0_0YGFloatIsUndefined(childWidth) && !ABI17_0_0YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = ABI17_0_0YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->style.overflow == ABI17_0_0YGOverflowScroll) ||
        node->style.overflow != ABI17_0_0YGOverflowScroll) {
      if (ABI17_0_0YGFloatIsUndefined(childHeight) && !ABI17_0_0YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = ABI17_0_0YGMeasureModeAtMost;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width
    if (!isMainAxisRow && !ABI17_0_0YGFloatIsUndefined(width) && !isRowStyleDimDefined &&
        widthMode == ABI17_0_0YGMeasureModeExactly && ABI17_0_0YGNodeAlignItem(node, child) == ABI17_0_0YGAlignStretch) {
      childWidth = width;
      childWidthMeasureMode = ABI17_0_0YGMeasureModeExactly;
    }
    if (isMainAxisRow && !ABI17_0_0YGFloatIsUndefined(height) && !isColumnStyleDimDefined &&
        heightMode == ABI17_0_0YGMeasureModeExactly && ABI17_0_0YGNodeAlignItem(node, child) == ABI17_0_0YGAlignStretch) {
      childHeight = height;
      childHeightMeasureMode = ABI17_0_0YGMeasureModeExactly;
    }

    if (!ABI17_0_0YGFloatIsUndefined(child->style.aspectRatio)) {
      if (!isMainAxisRow && childWidthMeasureMode == ABI17_0_0YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf((childWidth - marginRow) / child->style.aspectRatio,
                  ABI17_0_0YGNodePaddingAndBorderForAxis(child, ABI17_0_0YGFlexDirectionColumn, parentWidth));
        return;
      } else if (isMainAxisRow && childHeightMeasureMode == ABI17_0_0YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf((childHeight - marginColumn) * child->style.aspectRatio,
                  ABI17_0_0YGNodePaddingAndBorderForAxis(child, ABI17_0_0YGFlexDirectionRow, parentWidth));
        return;
      }
    }

    ABI17_0_0YGConstrainMaxSizeForMode(
        child, ABI17_0_0YGFlexDirectionRow, parentWidth, parentWidth, &childWidthMeasureMode, &childWidth);
    ABI17_0_0YGConstrainMaxSizeForMode(
        child, ABI17_0_0YGFlexDirectionColumn, parentHeight, parentWidth, &childHeightMeasureMode, &childHeight);

    // Measure the child
    ABI17_0_0YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         parentWidth,
                         parentHeight,
                         false,
                         "measure",
                         config);

    child->layout.computedFlexBasis =
        fmaxf(child->layout.measuredDimensions[dim[mainAxis]],
              ABI17_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
  }

  child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
}

static void ABI17_0_0YGNodeAbsoluteLayoutChild(const ABI17_0_0YGNodeRef node,
                                      const ABI17_0_0YGNodeRef child,
                                      const float width,
                                      const ABI17_0_0YGMeasureMode widthMode,
                                      const float height,
                                      const ABI17_0_0YGDirection direction,
                                      const ABI17_0_0YGConfigRef config) {
  const ABI17_0_0YGFlexDirection mainAxis = ABI17_0_0YGResolveFlexDirection(node->style.flexDirection, direction);
  const ABI17_0_0YGFlexDirection crossAxis = ABI17_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI17_0_0YGFlexDirectionIsRow(mainAxis);

  float childWidth = ABI17_0_0YGUndefined;
  float childHeight = ABI17_0_0YGUndefined;
  ABI17_0_0YGMeasureMode childWidthMeasureMode = ABI17_0_0YGMeasureModeUndefined;
  ABI17_0_0YGMeasureMode childHeightMeasureMode = ABI17_0_0YGMeasureModeUndefined;

  const float marginRow = ABI17_0_0YGNodeMarginForAxis(child, ABI17_0_0YGFlexDirectionRow, width);
  const float marginColumn = ABI17_0_0YGNodeMarginForAxis(child, ABI17_0_0YGFlexDirectionColumn, width);

  if (ABI17_0_0YGNodeIsStyleDimDefined(child, ABI17_0_0YGFlexDirectionRow, width)) {
    childWidth = ABI17_0_0YGResolveValue(child->resolvedDimensions[ABI17_0_0YGDimensionWidth], width) + marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (ABI17_0_0YGNodeIsLeadingPosDefined(child, ABI17_0_0YGFlexDirectionRow) &&
        ABI17_0_0YGNodeIsTrailingPosDefined(child, ABI17_0_0YGFlexDirectionRow)) {
      childWidth = node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] -
                   (ABI17_0_0YGNodeLeadingBorder(node, ABI17_0_0YGFlexDirectionRow) +
                    ABI17_0_0YGNodeTrailingBorder(node, ABI17_0_0YGFlexDirectionRow)) -
                   (ABI17_0_0YGNodeLeadingPosition(child, ABI17_0_0YGFlexDirectionRow, width) +
                    ABI17_0_0YGNodeTrailingPosition(child, ABI17_0_0YGFlexDirectionRow, width));
      childWidth = ABI17_0_0YGNodeBoundAxis(child, ABI17_0_0YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (ABI17_0_0YGNodeIsStyleDimDefined(child, ABI17_0_0YGFlexDirectionColumn, height)) {
    childHeight =
        ABI17_0_0YGResolveValue(child->resolvedDimensions[ABI17_0_0YGDimensionHeight], height) + marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (ABI17_0_0YGNodeIsLeadingPosDefined(child, ABI17_0_0YGFlexDirectionColumn) &&
        ABI17_0_0YGNodeIsTrailingPosDefined(child, ABI17_0_0YGFlexDirectionColumn)) {
      childHeight = node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] -
                    (ABI17_0_0YGNodeLeadingBorder(node, ABI17_0_0YGFlexDirectionColumn) +
                     ABI17_0_0YGNodeTrailingBorder(node, ABI17_0_0YGFlexDirectionColumn)) -
                    (ABI17_0_0YGNodeLeadingPosition(child, ABI17_0_0YGFlexDirectionColumn, height) +
                     ABI17_0_0YGNodeTrailingPosition(child, ABI17_0_0YGFlexDirectionColumn, height));
      childHeight = ABI17_0_0YGNodeBoundAxis(child, ABI17_0_0YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (ABI17_0_0YGFloatIsUndefined(childWidth) ^ ABI17_0_0YGFloatIsUndefined(childHeight)) {
    if (!ABI17_0_0YGFloatIsUndefined(child->style.aspectRatio)) {
      if (ABI17_0_0YGFloatIsUndefined(childWidth)) {
        childWidth =
            marginRow + fmaxf((childHeight - marginColumn) * child->style.aspectRatio,
                              ABI17_0_0YGNodePaddingAndBorderForAxis(child, ABI17_0_0YGFlexDirectionColumn, width));
      } else if (ABI17_0_0YGFloatIsUndefined(childHeight)) {
        childHeight =
            marginColumn + fmaxf((childWidth - marginRow) / child->style.aspectRatio,
                                 ABI17_0_0YGNodePaddingAndBorderForAxis(child, ABI17_0_0YGFlexDirectionRow, width));
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (ABI17_0_0YGFloatIsUndefined(childWidth) || ABI17_0_0YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode =
        ABI17_0_0YGFloatIsUndefined(childWidth) ? ABI17_0_0YGMeasureModeUndefined : ABI17_0_0YGMeasureModeExactly;
    childHeightMeasureMode =
        ABI17_0_0YGFloatIsUndefined(childHeight) ? ABI17_0_0YGMeasureModeUndefined : ABI17_0_0YGMeasureModeExactly;

    // If the size of the parent is defined then try to constrain the absolute child to that size
    // as well. This allows text within the absolute child to wrap to the size of its parent.
    // This is the same behavior as many browsers implement.
    if (!isMainAxisRow && ABI17_0_0YGFloatIsUndefined(childWidth) && widthMode != ABI17_0_0YGMeasureModeUndefined &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = ABI17_0_0YGMeasureModeAtMost;
    }

    ABI17_0_0YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         childWidth,
                         childHeight,
                         false,
                         "abs-measure",
                         config);
    childWidth = child->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] +
                 ABI17_0_0YGNodeMarginForAxis(child, ABI17_0_0YGFlexDirectionRow, width);
    childHeight = child->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] +
                  ABI17_0_0YGNodeMarginForAxis(child, ABI17_0_0YGFlexDirectionColumn, width);
  }

  ABI17_0_0YGLayoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       ABI17_0_0YGMeasureModeExactly,
                       ABI17_0_0YGMeasureModeExactly,
                       childWidth,
                       childHeight,
                       true,
                       "abs-layout",
                       config);

  if (ABI17_0_0YGNodeIsTrailingPosDefined(child, mainAxis) && !ABI17_0_0YGNodeIsLeadingPosDefined(child, mainAxis)) {
    child->layout.position[leading[mainAxis]] = node->layout.measuredDimensions[dim[mainAxis]] -
                                                child->layout.measuredDimensions[dim[mainAxis]] -
                                                ABI17_0_0YGNodeTrailingBorder(node, mainAxis) -
                                                ABI17_0_0YGNodeTrailingPosition(child, mainAxis, width);
  } else if (!ABI17_0_0YGNodeIsLeadingPosDefined(child, mainAxis) &&
             node->style.justifyContent == ABI17_0_0YGJustifyCenter) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]) /
                                                2.0f;
  } else if (!ABI17_0_0YGNodeIsLeadingPosDefined(child, mainAxis) &&
             node->style.justifyContent == ABI17_0_0YGJustifyFlexEnd) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]);
  }

  if (ABI17_0_0YGNodeIsTrailingPosDefined(child, crossAxis) &&
      !ABI17_0_0YGNodeIsLeadingPosDefined(child, crossAxis)) {
    child->layout.position[leading[crossAxis]] = node->layout.measuredDimensions[dim[crossAxis]] -
                                                 child->layout.measuredDimensions[dim[crossAxis]] -
                                                 ABI17_0_0YGNodeTrailingBorder(node, crossAxis) -
                                                 ABI17_0_0YGNodeTrailingPosition(child, crossAxis, width);
  } else if (!ABI17_0_0YGNodeIsLeadingPosDefined(child, crossAxis) &&
             ABI17_0_0YGNodeAlignItem(node, child) == ABI17_0_0YGAlignCenter) {
    child->layout.position[leading[crossAxis]] =
        (node->layout.measuredDimensions[dim[crossAxis]] -
         child->layout.measuredDimensions[dim[crossAxis]]) /
        2.0f;
  } else if (!ABI17_0_0YGNodeIsLeadingPosDefined(child, crossAxis) &&
             ABI17_0_0YGNodeAlignItem(node, child) == ABI17_0_0YGAlignFlexEnd) {
    child->layout.position[leading[crossAxis]] = (node->layout.measuredDimensions[dim[crossAxis]] -
                                                  child->layout.measuredDimensions[dim[crossAxis]]);
  }
}

static void ABI17_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(const ABI17_0_0YGNodeRef node,
                                                       const float availableWidth,
                                                       const float availableHeight,
                                                       const ABI17_0_0YGMeasureMode widthMeasureMode,
                                                       const ABI17_0_0YGMeasureMode heightMeasureMode,
                                                       const float parentWidth,
                                                       const float parentHeight) {
  ABI17_0_0YG_ASSERT(node->measure, "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow =
      ABI17_0_0YGNodePaddingAndBorderForAxis(node, ABI17_0_0YGFlexDirectionRow, availableWidth);
  const float paddingAndBorderAxisColumn =
      ABI17_0_0YGNodePaddingAndBorderForAxis(node, ABI17_0_0YGFlexDirectionColumn, availableWidth);
  const float marginAxisRow = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionRow, availableWidth);
  const float marginAxisColumn = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionColumn, availableWidth);

  const float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

  if (widthMeasureMode == ABI17_0_0YGMeasureModeExactly && heightMeasureMode == ABI17_0_0YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] = ABI17_0_0YGNodeBoundAxis(
        node, ABI17_0_0YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
    node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] = ABI17_0_0YGNodeBoundAxis(
        node, ABI17_0_0YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);
  } else if (innerWidth <= 0.0f || innerHeight <= 0.0f) {
    // Don't bother sizing the text if there's no horizontal or vertical
    // space.
    node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] =
        ABI17_0_0YGNodeBoundAxis(node, ABI17_0_0YGFlexDirectionRow, 0.0f, availableWidth, availableWidth);
    node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] =
        ABI17_0_0YGNodeBoundAxis(node, ABI17_0_0YGFlexDirectionColumn, 0.0f, availableHeight, availableWidth);
  } else {
    // Measure the text under the current constraints.
    const ABI17_0_0YGSize measuredSize =
        node->measure(node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] =
        ABI17_0_0YGNodeBoundAxis(node,
                        ABI17_0_0YGFlexDirectionRow,
                        (widthMeasureMode == ABI17_0_0YGMeasureModeUndefined ||
                         widthMeasureMode == ABI17_0_0YGMeasureModeAtMost)
                            ? measuredSize.width + paddingAndBorderAxisRow
                            : availableWidth - marginAxisRow,
                        availableWidth,
                        availableWidth);
    node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] =
        ABI17_0_0YGNodeBoundAxis(node,
                        ABI17_0_0YGFlexDirectionColumn,
                        (heightMeasureMode == ABI17_0_0YGMeasureModeUndefined ||
                         heightMeasureMode == ABI17_0_0YGMeasureModeAtMost)
                            ? measuredSize.height + paddingAndBorderAxisColumn
                            : availableHeight - marginAxisColumn,
                        availableHeight,
                        availableWidth);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void ABI17_0_0YGNodeEmptyContainerSetMeasuredDimensions(const ABI17_0_0YGNodeRef node,
                                                      const float availableWidth,
                                                      const float availableHeight,
                                                      const ABI17_0_0YGMeasureMode widthMeasureMode,
                                                      const ABI17_0_0YGMeasureMode heightMeasureMode,
                                                      const float parentWidth,
                                                      const float parentHeight) {
  const float paddingAndBorderAxisRow =
      ABI17_0_0YGNodePaddingAndBorderForAxis(node, ABI17_0_0YGFlexDirectionRow, parentWidth);
  const float paddingAndBorderAxisColumn =
      ABI17_0_0YGNodePaddingAndBorderForAxis(node, ABI17_0_0YGFlexDirectionColumn, parentWidth);
  const float marginAxisRow = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionColumn, parentWidth);

  node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] =
      ABI17_0_0YGNodeBoundAxis(node,
                      ABI17_0_0YGFlexDirectionRow,
                      (widthMeasureMode == ABI17_0_0YGMeasureModeUndefined ||
                       widthMeasureMode == ABI17_0_0YGMeasureModeAtMost)
                          ? paddingAndBorderAxisRow
                          : availableWidth - marginAxisRow,
                      parentWidth,
                      parentWidth);
  node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] =
      ABI17_0_0YGNodeBoundAxis(node,
                      ABI17_0_0YGFlexDirectionColumn,
                      (heightMeasureMode == ABI17_0_0YGMeasureModeUndefined ||
                       heightMeasureMode == ABI17_0_0YGMeasureModeAtMost)
                          ? paddingAndBorderAxisColumn
                          : availableHeight - marginAxisColumn,
                      parentHeight,
                      parentWidth);
}

static bool ABI17_0_0YGNodeFixedSizeSetMeasuredDimensions(const ABI17_0_0YGNodeRef node,
                                                 const float availableWidth,
                                                 const float availableHeight,
                                                 const ABI17_0_0YGMeasureMode widthMeasureMode,
                                                 const ABI17_0_0YGMeasureMode heightMeasureMode,
                                                 const float parentWidth,
                                                 const float parentHeight) {
  if ((widthMeasureMode == ABI17_0_0YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (heightMeasureMode == ABI17_0_0YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == ABI17_0_0YGMeasureModeExactly && heightMeasureMode == ABI17_0_0YGMeasureModeExactly)) {
    const float marginAxisColumn = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionColumn, parentWidth);
    const float marginAxisRow = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionRow, parentWidth);

    node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] =
        ABI17_0_0YGNodeBoundAxis(node,
                        ABI17_0_0YGFlexDirectionRow,
                        ABI17_0_0YGFloatIsUndefined(availableWidth) ||
                                (widthMeasureMode == ABI17_0_0YGMeasureModeAtMost && availableWidth < 0.0f)
                            ? 0.0f
                            : availableWidth - marginAxisRow,
                        parentWidth,
                        parentWidth);

    node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] =
        ABI17_0_0YGNodeBoundAxis(node,
                        ABI17_0_0YGFlexDirectionColumn,
                        ABI17_0_0YGFloatIsUndefined(availableHeight) ||
                                (heightMeasureMode == ABI17_0_0YGMeasureModeAtMost && availableHeight < 0.0f)
                            ? 0.0f
                            : availableHeight - marginAxisColumn,
                        parentHeight,
                        parentWidth);

    return true;
  }

  return false;
}

static void ABI17_0_0YGZeroOutLayoutRecursivly(const ABI17_0_0YGNodeRef node) {
  node->layout.dimensions[ABI17_0_0YGDimensionHeight] = 0;
  node->layout.dimensions[ABI17_0_0YGDimensionWidth] = 0;
  node->layout.position[ABI17_0_0YGEdgeTop] = 0;
  node->layout.position[ABI17_0_0YGEdgeBottom] = 0;
  node->layout.position[ABI17_0_0YGEdgeLeft] = 0;
  node->layout.position[ABI17_0_0YGEdgeRight] = 0;
  node->layout.cachedLayout.availableHeight = 0;
  node->layout.cachedLayout.availableWidth = 0;
  node->layout.cachedLayout.heightMeasureMode = ABI17_0_0YGMeasureModeExactly;
  node->layout.cachedLayout.widthMeasureMode = ABI17_0_0YGMeasureModeExactly;
  node->layout.cachedLayout.computedWidth = 0;
  node->layout.cachedLayout.computedHeight = 0;
  node->hasNewLayout = true;
  const uint32_t childCount = ABI17_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, i);
    ABI17_0_0YGZeroOutLayoutRecursivly(child);
  }
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C ABI17_0_0YG documentation: https://www.w3.org/TR/ABI17_0_0YG3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes,
//  which
//    are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes
//  are
//    stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always
//  defined
//    by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of
//  'collapse'
//    and 'hidden' are not supported.
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or
//  bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default
//  minimum
//    main size. For text blocks, for example, this is the width of the widest
//    word.
//    Calculating the minimum width is expensive, so we forego it and assume a
//    default
//    minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible
//  lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row',
//  but
//    the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and layed out
//    - availableWidth & availableHeight: available size to be used for sizing
//    the node
//      or ABI17_0_0YGUndefined if the size is not available; interpretation depends on
//      layout
//      flags
//    - parentDirection: the inline (text) direction within the parent
//    (left-to-right or
//      right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below
//    for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below
//    for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//    dimensions
//      of the node or it requires the entire node and its subtree to be layed
//      out
//      (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox
//    elements. It uses the
//    information in node.style, which is treated as a read-only input. It is
//    responsible for
//    setting the layout.direction and layout.measuredDimensions fields for the
//    input node as well
//    as the layout.position and layout.lineIndex fields for its child nodes.
//    The
//    layout.measuredDimensions field includes any border or padding for the
//    node but does
//    not include margins.
//
//    The spec describes four different layout modes: "fill available", "max
//    content", "min
//    content",
//    and "fit content". Of these, we don't use "min content" because we don't
//    support default
//    minimum main sizes (see above for details). Each of our measure modes maps
//    to a layout mode
//    from the spec (https://www.w3.org/TR/ABI17_0_0YG3-sizing/#terms):
//      - ABI17_0_0YGMeasureModeUndefined: max content
//      - ABI17_0_0YGMeasureModeExactly: fill available
//      - ABI17_0_0YGMeasureModeAtMost: fit content
//
//    When calling ABI17_0_0YGNodelayoutImpl and ABI17_0_0YGLayoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of ABI17_0_0YGMeasureModeUndefined
//    in that dimension.
//
static void ABI17_0_0YGNodelayoutImpl(const ABI17_0_0YGNodeRef node,
                             const float availableWidth,
                             const float availableHeight,
                             const ABI17_0_0YGDirection parentDirection,
                             const ABI17_0_0YGMeasureMode widthMeasureMode,
                             const ABI17_0_0YGMeasureMode heightMeasureMode,
                             const float parentWidth,
                             const float parentHeight,
                             const bool performLayout,
                             const ABI17_0_0YGConfigRef config) {
  ABI17_0_0YG_ASSERT(ABI17_0_0YGFloatIsUndefined(availableWidth) ? widthMeasureMode == ABI17_0_0YGMeasureModeUndefined : true,
            "availableWidth is indefinite so widthMeasureMode must be "
            "ABI17_0_0YGMeasureModeUndefined");
  ABI17_0_0YG_ASSERT(ABI17_0_0YGFloatIsUndefined(availableHeight) ? heightMeasureMode == ABI17_0_0YGMeasureModeUndefined
                                                : true,
            "availableHeight is indefinite so heightMeasureMode must be "
            "ABI17_0_0YGMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const ABI17_0_0YGDirection direction = ABI17_0_0YGNodeResolveDirection(node, parentDirection);
  node->layout.direction = direction;

  const ABI17_0_0YGFlexDirection flexRowDirection = ABI17_0_0YGResolveFlexDirection(ABI17_0_0YGFlexDirectionRow, direction);
  const ABI17_0_0YGFlexDirection flexColumnDirection =
      ABI17_0_0YGResolveFlexDirection(ABI17_0_0YGFlexDirectionColumn, direction);

  node->layout.margin[ABI17_0_0YGEdgeStart] = ABI17_0_0YGNodeLeadingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[ABI17_0_0YGEdgeEnd] = ABI17_0_0YGNodeTrailingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[ABI17_0_0YGEdgeTop] = ABI17_0_0YGNodeLeadingMargin(node, flexColumnDirection, parentWidth);
  node->layout.margin[ABI17_0_0YGEdgeBottom] = ABI17_0_0YGNodeTrailingMargin(node, flexColumnDirection, parentWidth);

  node->layout.border[ABI17_0_0YGEdgeStart] = ABI17_0_0YGNodeLeadingBorder(node, flexRowDirection);
  node->layout.border[ABI17_0_0YGEdgeEnd] = ABI17_0_0YGNodeTrailingBorder(node, flexRowDirection);
  node->layout.border[ABI17_0_0YGEdgeTop] = ABI17_0_0YGNodeLeadingBorder(node, flexColumnDirection);
  node->layout.border[ABI17_0_0YGEdgeBottom] = ABI17_0_0YGNodeTrailingBorder(node, flexColumnDirection);

  node->layout.padding[ABI17_0_0YGEdgeStart] = ABI17_0_0YGNodeLeadingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[ABI17_0_0YGEdgeEnd] = ABI17_0_0YGNodeTrailingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[ABI17_0_0YGEdgeTop] = ABI17_0_0YGNodeLeadingPadding(node, flexColumnDirection, parentWidth);
  node->layout.padding[ABI17_0_0YGEdgeBottom] =
      ABI17_0_0YGNodeTrailingPadding(node, flexColumnDirection, parentWidth);

  if (node->measure) {
    ABI17_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(node,
                                               availableWidth,
                                               availableHeight,
                                               widthMeasureMode,
                                               heightMeasureMode,
                                               parentWidth,
                                               parentHeight);
    return;
  }

  const uint32_t childCount = ABI17_0_0YGNodeListCount(node->children);
  if (childCount == 0) {
    ABI17_0_0YGNodeEmptyContainerSetMeasuredDimensions(node,
                                              availableWidth,
                                              availableHeight,
                                              widthMeasureMode,
                                              heightMeasureMode,
                                              parentWidth,
                                              parentHeight);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm if we already know
  // the size
  if (!performLayout && ABI17_0_0YGNodeFixedSizeSetMeasuredDimensions(node,
                                                             availableWidth,
                                                             availableHeight,
                                                             widthMeasureMode,
                                                             heightMeasureMode,
                                                             parentWidth,
                                                             parentHeight)) {
    return;
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const ABI17_0_0YGFlexDirection mainAxis = ABI17_0_0YGResolveFlexDirection(node->style.flexDirection, direction);
  const ABI17_0_0YGFlexDirection crossAxis = ABI17_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI17_0_0YGFlexDirectionIsRow(mainAxis);
  const ABI17_0_0YGJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap != ABI17_0_0YGWrapNoWrap;

  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;
  const float crossAxisParentSize = isMainAxisRow ? parentHeight : parentWidth;

  ABI17_0_0YGNodeRef firstAbsoluteChild = NULL;
  ABI17_0_0YGNodeRef currentAbsoluteChild = NULL;

  const float leadingPaddingAndBorderMain =
      ABI17_0_0YGNodeLeadingPaddingAndBorder(node, mainAxis, parentWidth);
  const float trailingPaddingAndBorderMain =
      ABI17_0_0YGNodeTrailingPaddingAndBorder(node, mainAxis, parentWidth);
  const float leadingPaddingAndBorderCross =
      ABI17_0_0YGNodeLeadingPaddingAndBorder(node, crossAxis, parentWidth);
  const float paddingAndBorderAxisMain = ABI17_0_0YGNodePaddingAndBorderForAxis(node, mainAxis, parentWidth);
  const float paddingAndBorderAxisCross =
      ABI17_0_0YGNodePaddingAndBorderForAxis(node, crossAxis, parentWidth);

  ABI17_0_0YGMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  ABI17_0_0YGMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  const float marginAxisRow = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionColumn, parentWidth);

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  const float minInnerWidth =
      ABI17_0_0YGResolveValue(&node->style.minDimensions[ABI17_0_0YGDimensionWidth], parentWidth) - marginAxisRow -
      paddingAndBorderAxisRow;
  const float maxInnerWidth =
      ABI17_0_0YGResolveValue(&node->style.maxDimensions[ABI17_0_0YGDimensionWidth], parentWidth) - marginAxisRow -
      paddingAndBorderAxisRow;
  const float minInnerHeight =
      ABI17_0_0YGResolveValue(&node->style.minDimensions[ABI17_0_0YGDimensionHeight], parentHeight) -
      marginAxisColumn - paddingAndBorderAxisColumn;
  const float maxInnerHeight =
      ABI17_0_0YGResolveValue(&node->style.maxDimensions[ABI17_0_0YGDimensionHeight], parentHeight) -
      marginAxisColumn - paddingAndBorderAxisColumn;
  const float minInnerMainDim = isMainAxisRow ? minInnerWidth : minInnerHeight;
  const float maxInnerMainDim = isMainAxisRow ? maxInnerWidth : maxInnerHeight;

  // Max dimension overrides predefined dimension value; Min dimension in turn overrides both of the
  // above
  float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  if (!ABI17_0_0YGFloatIsUndefined(availableInnerWidth)) {
    // We want to make sure our available width does not violate min and max constraints
    availableInnerWidth = fmaxf(fminf(availableInnerWidth, maxInnerWidth), minInnerWidth);
  }

  float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  if (!ABI17_0_0YGFloatIsUndefined(availableInnerHeight)) {
    // We want to make sure our available height does not violate min and max constraints
    availableInnerHeight = fmaxf(fminf(availableInnerHeight, maxInnerHeight), minInnerHeight);
  }

  float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // If there is only one child with flexGrow + flexShrink it means we can set the
  // computedFlexBasis to 0 instead of measuring and shrinking / flexing the child to exactly
  // match the remaining space
  ABI17_0_0YGNodeRef singleFlexChild = NULL;
  if (measureModeMainDim == ABI17_0_0YGMeasureModeExactly) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeGetChild(node, i);
      if (singleFlexChild) {
        if (ABI17_0_0YGNodeIsFlex(child)) {
          // There is already a flexible child, abort.
          singleFlexChild = NULL;
          break;
        }
      } else if (ABI17_0_0YGResolveFlexGrow(child) > 0.0f && ABI17_0_0YGNodeResolveFlexShrink(child) > 0.0f) {
        singleFlexChild = child;
      }
    }
  }

  float totalFlexBasis = 0;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, i);
    if (child->style.display == ABI17_0_0YGDisplayNone) {
      ABI17_0_0YGZeroOutLayoutRecursivly(child);
      child->hasNewLayout = true;
      child->isDirty = false;
      continue;
    }
    ABI17_0_0YGResolveDimensions(child);
    if (performLayout) {
      // Set the initial position (relative to the parent).
      const ABI17_0_0YGDirection childDirection = ABI17_0_0YGNodeResolveDirection(child, direction);
      ABI17_0_0YGNodeSetPosition(child,
                        childDirection,
                        availableInnerMainDim,
                        availableInnerCrossDim,
                        availableInnerWidth);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == ABI17_0_0YGPositionTypeAbsolute) {
      // Store a private linked list of absolutely positioned children
      // so that we can efficiently traverse them later.
      if (firstAbsoluteChild == NULL) {
        firstAbsoluteChild = child;
      }
      if (currentAbsoluteChild != NULL) {
        currentAbsoluteChild->nextChild = child;
      }
      currentAbsoluteChild = child;
      child->nextChild = NULL;
    } else {
      if (child == singleFlexChild) {
        child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
        child->layout.computedFlexBasis = 0;
      } else {
        ABI17_0_0YGNodeComputeFlexBasisForChild(node,
                                       child,
                                       availableInnerWidth,
                                       widthMeasureMode,
                                       availableInnerHeight,
                                       availableInnerWidth,
                                       availableInnerHeight,
                                       heightMeasureMode,
                                       direction,
                                       config);
      }
    }

    totalFlexBasis += child->layout.computedFlexBasis;
  }

  const bool flexBasisOverflows =
      measureModeMainDim == ABI17_0_0YGMeasureModeUndefined ? false : totalFlexBasis > availableInnerMainDim;
  if (isNodeFlexWrap && flexBasisOverflows && measureModeMainDim == ABI17_0_0YGMeasureModeAtMost) {
    measureModeMainDim = ABI17_0_0YGMeasureModeExactly;
  }

  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  uint32_t startOfLineIndex = 0;
  uint32_t endOfLineIndex = 0;

  // Number of lines.
  uint32_t lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;

  for (; endOfLineIndex < childCount; lineCount++, startOfLineIndex = endOfLineIndex) {
    // Number of items on the currently line. May be different than the
    // difference
    // between start and end indicates because we skip over absolute-positioned
    // items.
    uint32_t itemsOnLine = 0;

    // sizeConsumedOnCurrentLine is accumulation of the dimensions and margin
    // of all the children on the current line. This will be used in order to
    // either set the dimensions of the node if none already exist or to compute
    // the remaining space left for the flexible children.
    float sizeConsumedOnCurrentLine = 0;

    float totalFlexGrowFactors = 0;
    float totalFlexShrinkScaledFactors = 0;

    // Maintain a linked list of the child nodes that can shrink and/or grow.
    ABI17_0_0YGNodeRef firstRelativeChild = NULL;
    ABI17_0_0YGNodeRef currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    for (uint32_t i = startOfLineIndex; i < childCount; i++, endOfLineIndex++) {
      const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, i);
      if (child->style.display == ABI17_0_0YGDisplayNone) {
        continue;
      }
      child->lineIndex = lineCount;

      if (child->style.positionType != ABI17_0_0YGPositionTypeAbsolute) {
        const float outerFlexBasis =
            fmaxf(ABI17_0_0YGResolveValue(&child->style.minDimensions[dim[mainAxis]], mainAxisParentSize),
                  child->layout.computedFlexBasis) +
            ABI17_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);

        // If this is a multi-line flow and this item pushes us over the
        // available size, we've
        // hit the end of the current line. Break out of the loop and lay out
        // the current line.
        if (sizeConsumedOnCurrentLine + outerFlexBasis > availableInnerMainDim && isNodeFlexWrap &&
            itemsOnLine > 0) {
          break;
        }

        sizeConsumedOnCurrentLine += outerFlexBasis;
        itemsOnLine++;

        if (ABI17_0_0YGNodeIsFlex(child)) {
          totalFlexGrowFactors += ABI17_0_0YGResolveFlexGrow(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the
          // child
          // dimension.
          totalFlexShrinkScaledFactors +=
              -ABI17_0_0YGNodeResolveFlexShrink(child) * child->layout.computedFlexBasis;
        }

        // Store a private linked list of children that need to be layed out.
        if (firstRelativeChild == NULL) {
          firstRelativeChild = child;
        }
        if (currentRelativeChild != NULL) {
          currentRelativeChild->nextChild = child;
        }
        currentRelativeChild = child;
        child->nextChild = NULL;
      }
    }

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex = !performLayout && measureModeCrossDim == ABI17_0_0YGMeasureModeExactly;

    // In order to position the elements in the main axis, we have two
    // controls. The space between the beginning and the first element
    // and the space between each two elements.
    float leadingMainDim = 0;
    float betweenMainDim = 0;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated.
    // If the main dimension size isn't known, it is computed based on
    // the line length, so there's no more space left to distribute.

    // If we don't measure with exact main dimension we want to ensure we don't violate min and max
    if (measureModeMainDim != ABI17_0_0YGMeasureModeExactly) {
      if (!ABI17_0_0YGFloatIsUndefined(minInnerMainDim) && sizeConsumedOnCurrentLine < minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (!ABI17_0_0YGFloatIsUndefined(maxInnerMainDim) && sizeConsumedOnCurrentLine > maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else if (ABI17_0_0YGConfigIsExperimentalFeatureEnabled(node->config, ABI17_0_0YGExperimentalFeatureMinFlexFix)) {
        // TODO: this needs to be moved out of experimental feature, as this is legitimate fix
        // If the measurement isn't exact, we want to use as little space as possible
        availableInnerMainDim = sizeConsumedOnCurrentLine;
      }
    }

    float remainingFreeSpace = 0;
    if (!ABI17_0_0YGFloatIsUndefined(availableInnerMainDim)) {
      remainingFreeSpace = availableInnerMainDim - sizeConsumedOnCurrentLine;
    } else if (sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized
      // based on its
      // content.
      // sizeConsumedOnCurrentLine is negative which means the node will
      // allocate 0 points for
      // its content. Consequently, remainingFreeSpace is 0 -
      // sizeConsumedOnCurrentLine.
      remainingFreeSpace = -sizeConsumedOnCurrentLine;
    }

    const float originalRemainingFreeSpace = remainingFreeSpace;
    float deltaFreeSpace = 0;

    if (!canSkipFlex) {
      float childFlexBasis;
      float flexShrinkScaledFactor;
      float flexGrowFactor;
      float baseMainSize;
      float boundMainSize;

      // Do two passes over the flex items to figure out how to distribute the
      // remaining space.
      // The first pass finds the items whose min/max constraints trigger,
      // freezes them at those
      // sizes, and excludes those sizes from the remaining space. The second
      // pass sets the size
      // of each flexible item. It distributes the remaining space amongst the
      // items whose min/max
      // constraints didn't trigger in pass 1. For the other items, it sets
      // their sizes by forcing
      // their min/max constraints to trigger again.
      //
      // This two pass approach for resolving min/max constraints deviates from
      // the spec. The
      // spec (https://www.w3.org/TR/ABI17_0_0YG-flexbox-1/#resolve-flexible-lengths)
      // describes a process
      // that needs to be repeated a variable number of times. The algorithm
      // implemented here
      // won't handle all cases but it was simpler to implement and it mitigates
      // performance
      // concerns because we know exactly how many passes it'll do.

      // First pass: detect the flex items whose min/max constraints trigger
      float deltaFlexShrinkScaledFactors = 0;
      float deltaFlexGrowFactors = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.computedFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = -ABI17_0_0YGNodeResolveFlexShrink(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize =
                childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = ABI17_0_0YGNodeBoundAxis(currentRelativeChild,
                                            mainAxis,
                                            baseMainSize,
                                            availableInnerMainDim,
                                            availableInnerWidth);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining,
              // this item's
              // min/max constraints should also trigger in the second pass
              // resulting in the
              // item's size calculation being identical in the first and second
              // passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexShrinkScaledFactors -= flexShrinkScaledFactor;
            }
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = ABI17_0_0YGResolveFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize =
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = ABI17_0_0YGNodeBoundAxis(currentRelativeChild,
                                            mainAxis,
                                            baseMainSize,
                                            availableInnerMainDim,
                                            availableInnerWidth);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining,
              // this item's
              // min/max constraints should also trigger in the second pass
              // resulting in the
              // item's size calculation being identical in the first and second
              // passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexGrowFactors -= flexGrowFactor;
            }
          }
        }

        currentRelativeChild = currentRelativeChild->nextChild;
      }

      totalFlexShrinkScaledFactors += deltaFlexShrinkScaledFactors;
      totalFlexGrowFactors += deltaFlexGrowFactors;
      remainingFreeSpace += deltaFreeSpace;

      // Second pass: resolve the sizes of the flexible items
      deltaFreeSpace = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.computedFlexBasis;
        float updatedMainSize = childFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = -ABI17_0_0YGNodeResolveFlexShrink(currentRelativeChild) * childFlexBasis;
          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            float childSize;

            if (totalFlexShrinkScaledFactors == 0) {
              childSize = childFlexBasis + flexShrinkScaledFactor;
            } else {
              childSize =
                  childFlexBasis +
                  (remainingFreeSpace / totalFlexShrinkScaledFactors) * flexShrinkScaledFactor;
            }

            updatedMainSize = ABI17_0_0YGNodeBoundAxis(currentRelativeChild,
                                              mainAxis,
                                              childSize,
                                              availableInnerMainDim,
                                              availableInnerWidth);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = ABI17_0_0YGResolveFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize =
                ABI17_0_0YGNodeBoundAxis(currentRelativeChild,
                                mainAxis,
                                childFlexBasis +
                                    remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor,
                                availableInnerMainDim,
                                availableInnerWidth);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        const float marginMain =
            ABI17_0_0YGNodeMarginForAxis(currentRelativeChild, mainAxis, availableInnerWidth);
        const float marginCross =
            ABI17_0_0YGNodeMarginForAxis(currentRelativeChild, crossAxis, availableInnerWidth);

        float childCrossSize;
        float childMainSize = updatedMainSize + marginMain;
        ABI17_0_0YGMeasureMode childCrossMeasureMode;
        ABI17_0_0YGMeasureMode childMainMeasureMode = ABI17_0_0YGMeasureModeExactly;

        if (!ABI17_0_0YGFloatIsUndefined(availableInnerCrossDim) &&
            !ABI17_0_0YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis, availableInnerCrossDim) &&
            measureModeCrossDim == ABI17_0_0YGMeasureModeExactly &&
            !(isNodeFlexWrap && flexBasisOverflows) &&
            ABI17_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI17_0_0YGAlignStretch) {
          childCrossSize = availableInnerCrossDim;
          childCrossMeasureMode = ABI17_0_0YGMeasureModeExactly;
        } else if (!ABI17_0_0YGNodeIsStyleDimDefined(currentRelativeChild,
                                            crossAxis,
                                            availableInnerCrossDim)) {
          childCrossSize = availableInnerCrossDim;
          childCrossMeasureMode =
              ABI17_0_0YGFloatIsUndefined(childCrossSize) ? ABI17_0_0YGMeasureModeUndefined : ABI17_0_0YGMeasureModeAtMost;
        } else {
          childCrossSize = ABI17_0_0YGResolveValue(currentRelativeChild->resolvedDimensions[dim[crossAxis]],
                                          availableInnerCrossDim) +
                           marginCross;
          const bool isLoosePercentageMeasurement =
              currentRelativeChild->resolvedDimensions[dim[crossAxis]]->unit == ABI17_0_0YGUnitPercent &&
              measureModeCrossDim != ABI17_0_0YGMeasureModeExactly;
          childCrossMeasureMode = ABI17_0_0YGFloatIsUndefined(childCrossSize) || isLoosePercentageMeasurement
                                      ? ABI17_0_0YGMeasureModeUndefined
                                      : ABI17_0_0YGMeasureModeExactly;
        }

        if (!ABI17_0_0YGFloatIsUndefined(currentRelativeChild->style.aspectRatio)) {
          childCrossSize = fmaxf(
              isMainAxisRow
                  ? (childMainSize - marginMain) / currentRelativeChild->style.aspectRatio
                  : (childMainSize - marginMain) * currentRelativeChild->style.aspectRatio,
              ABI17_0_0YGNodePaddingAndBorderForAxis(currentRelativeChild, crossAxis, availableInnerWidth));
          childCrossMeasureMode = ABI17_0_0YGMeasureModeExactly;

          // Parent size constraint should have higher priority than flex
          if (ABI17_0_0YGNodeIsFlex(currentRelativeChild)) {
            childCrossSize = fminf(childCrossSize - marginCross, availableInnerCrossDim);
            childMainSize =
                marginMain + (isMainAxisRow
                                  ? childCrossSize * currentRelativeChild->style.aspectRatio
                                  : childCrossSize / currentRelativeChild->style.aspectRatio);
          }

          childCrossSize += marginCross;
        }

        ABI17_0_0YGConstrainMaxSizeForMode(currentRelativeChild,
                                  mainAxis,
                                  availableInnerMainDim,
                                  availableInnerWidth,
                                  &childMainMeasureMode,
                                  &childMainSize);
        ABI17_0_0YGConstrainMaxSizeForMode(currentRelativeChild,
                                  crossAxis,
                                  availableInnerCrossDim,
                                  availableInnerWidth,
                                  &childCrossMeasureMode,
                                  &childCrossSize);

        const bool requiresStretchLayout =
            !ABI17_0_0YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis, availableInnerCrossDim) &&
            ABI17_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI17_0_0YGAlignStretch;

        const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
        const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

        const ABI17_0_0YGMeasureMode childWidthMeasureMode =
            isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
        const ABI17_0_0YGMeasureMode childHeightMeasureMode =
            !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        ABI17_0_0YGLayoutNodeInternal(currentRelativeChild,
                             childWidth,
                             childHeight,
                             direction,
                             childWidthMeasureMode,
                             childHeightMeasureMode,
                             availableInnerWidth,
                             availableInnerHeight,
                             performLayout && !requiresStretchLayout,
                             "flex",
                             config);

        currentRelativeChild = currentRelativeChild->nextChild;
      }
    }

    remainingFreeSpace = originalRemainingFreeSpace + deltaFreeSpace;

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis.
    // Their dimensions are also set in the cross axis with the exception of
    // items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    // If we are using "at most" rules in the main axis. Calculate the remaining space when
    // constraint by the min size defined for the main axis.

    if (measureModeMainDim == ABI17_0_0YGMeasureModeAtMost && remainingFreeSpace > 0) {
      if (node->style.minDimensions[dim[mainAxis]].unit != ABI17_0_0YGUnitUndefined &&
          ABI17_0_0YGResolveValue(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) >= 0) {
        remainingFreeSpace =
            fmaxf(0,
                  ABI17_0_0YGResolveValue(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) -
                      (availableInnerMainDim - remainingFreeSpace));
      } else {
        remainingFreeSpace = 0;
      }
    }

    int numberOfAutoMarginsOnCurrentLine = 0;
    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, i);
      if (child->style.positionType == ABI17_0_0YGPositionTypeRelative) {
        if (ABI17_0_0YGMarginLeadingValue(child, mainAxis)->unit == ABI17_0_0YGUnitAuto) {
          numberOfAutoMarginsOnCurrentLine++;
        }
        if (ABI17_0_0YGMarginTrailingValue(child, mainAxis)->unit == ABI17_0_0YGUnitAuto) {
          numberOfAutoMarginsOnCurrentLine++;
        }
      }
    }

    if (numberOfAutoMarginsOnCurrentLine == 0) {
      switch (justifyContent) {
        case ABI17_0_0YGJustifyCenter:
          leadingMainDim = remainingFreeSpace / 2;
          break;
        case ABI17_0_0YGJustifyFlexEnd:
          leadingMainDim = remainingFreeSpace;
          break;
        case ABI17_0_0YGJustifySpaceBetween:
          if (itemsOnLine > 1) {
            betweenMainDim = fmaxf(remainingFreeSpace, 0) / (itemsOnLine - 1);
          } else {
            betweenMainDim = 0;
          }
          break;
        case ABI17_0_0YGJustifySpaceAround:
          // Space on the edges is half of the space between elements
          betweenMainDim = remainingFreeSpace / itemsOnLine;
          leadingMainDim = betweenMainDim / 2;
          break;
        case ABI17_0_0YGJustifyFlexStart:
          break;
      }
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, i);
      if (child->style.display == ABI17_0_0YGDisplayNone) {
        continue;
      }
      if (child->style.positionType == ABI17_0_0YGPositionTypeAbsolute &&
          ABI17_0_0YGNodeIsLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] =
              ABI17_0_0YGNodeLeadingPosition(child, mainAxis, availableInnerMainDim) +
              ABI17_0_0YGNodeLeadingBorder(node, mainAxis) +
              ABI17_0_0YGNodeLeadingMargin(child, mainAxis, availableInnerWidth);
        }
      } else {
        // Now that we placed the element, we need to update the variables.
        // We need to do that only for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.positionType == ABI17_0_0YGPositionTypeRelative) {
          if (ABI17_0_0YGMarginLeadingValue(child, mainAxis)->unit == ABI17_0_0YGUnitAuto) {
            mainDim += remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
          }

          if (performLayout) {
            child->layout.position[pos[mainAxis]] += mainDim;
          }

          if (ABI17_0_0YGMarginTrailingValue(child, mainAxis)->unit == ABI17_0_0YGUnitAuto) {
            mainDim += remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
          }

          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the
            // measuredDims because
            // they weren't computed. This means we can't call ABI17_0_0YGNodeDimWithMargin.
            mainDim += betweenMainDim + ABI17_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth) +
                       child->layout.computedFlexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus the spacing.
            mainDim += betweenMainDim + ABI17_0_0YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

            // The cross dimension is the max of the elements dimension since
            // there can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, ABI17_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
          }
        } else if (performLayout) {
          child->layout.position[pos[mainAxis]] +=
              ABI17_0_0YGNodeLeadingBorder(node, mainAxis) + leadingMainDim;
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == ABI17_0_0YGMeasureModeUndefined ||
        measureModeCrossDim == ABI17_0_0YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = ABI17_0_0YGNodeBoundAxis(node,
                                           crossAxis,
                                           crossDim + paddingAndBorderAxisCross,
                                           crossAxisParentSize,
                                           parentWidth) -
                           paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI17_0_0YGMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = ABI17_0_0YGNodeBoundAxis(node,
                               crossAxis,
                               crossDim + paddingAndBorderAxisCross,
                               crossAxisParentSize,
                               parentWidth) -
               paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, i);
        if (child->style.display == ABI17_0_0YGDisplayNone) {
          continue;
        }
        if (child->style.positionType == ABI17_0_0YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          if (ABI17_0_0YGNodeIsLeadingPosDefined(child, crossAxis)) {
            child->layout.position[pos[crossAxis]] =
                ABI17_0_0YGNodeLeadingPosition(child, crossAxis, availableInnerCrossDim) +
                ABI17_0_0YGNodeLeadingBorder(node, crossAxis) +
                ABI17_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          } else {
            child->layout.position[pos[crossAxis]] =
                ABI17_0_0YGNodeLeadingBorder(node, crossAxis) +
                ABI17_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const ABI17_0_0YGAlign alignItem = ABI17_0_0YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == ABI17_0_0YGAlignStretch &&
              ABI17_0_0YGMarginLeadingValue(child, crossAxis)->unit != ABI17_0_0YGUnitAuto &&
              ABI17_0_0YGMarginTrailingValue(child, crossAxis)->unit != ABI17_0_0YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!ABI17_0_0YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
              float childMainSize = child->layout.measuredDimensions[dim[mainAxis]];
              float childCrossSize =
                  !ABI17_0_0YGFloatIsUndefined(child->style.aspectRatio)
                      ? ((ABI17_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth) +
                          (isMainAxisRow ? childMainSize / child->style.aspectRatio
                                         : childMainSize * child->style.aspectRatio)))
                      : crossDim;

              childMainSize += ABI17_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);

              ABI17_0_0YGMeasureMode childMainMeasureMode = ABI17_0_0YGMeasureModeExactly;
              ABI17_0_0YGMeasureMode childCrossMeasureMode = ABI17_0_0YGMeasureModeExactly;
              ABI17_0_0YGConstrainMaxSizeForMode(child,
                                        mainAxis,
                                        availableInnerMainDim,
                                        availableInnerWidth,
                                        &childMainMeasureMode,
                                        &childMainSize);
              ABI17_0_0YGConstrainMaxSizeForMode(child,
                                        crossAxis,
                                        availableInnerCrossDim,
                                        availableInnerWidth,
                                        &childCrossMeasureMode,
                                        &childCrossSize);

              const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
              const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

              const ABI17_0_0YGMeasureMode childWidthMeasureMode =
                  ABI17_0_0YGFloatIsUndefined(childWidth) ? ABI17_0_0YGMeasureModeUndefined : ABI17_0_0YGMeasureModeExactly;
              const ABI17_0_0YGMeasureMode childHeightMeasureMode =
                  ABI17_0_0YGFloatIsUndefined(childHeight) ? ABI17_0_0YGMeasureModeUndefined : ABI17_0_0YGMeasureModeExactly;

              ABI17_0_0YGLayoutNodeInternal(child,
                                   childWidth,
                                   childHeight,
                                   direction,
                                   childWidthMeasureMode,
                                   childHeightMeasureMode,
                                   availableInnerWidth,
                                   availableInnerHeight,
                                   true,
                                   "stretch",
                                   config);
            }
          } else {
            const float remainingCrossDim =
                containerCrossAxis - ABI17_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

            if (ABI17_0_0YGMarginLeadingValue(child, crossAxis)->unit == ABI17_0_0YGUnitAuto &&
                ABI17_0_0YGMarginTrailingValue(child, crossAxis)->unit == ABI17_0_0YGUnitAuto) {
              leadingCrossDim += fmaxf(0.0f, remainingCrossDim / 2);
            } else if (ABI17_0_0YGMarginTrailingValue(child, crossAxis)->unit == ABI17_0_0YGUnitAuto) {
              // No-Op
            } else if (ABI17_0_0YGMarginLeadingValue(child, crossAxis)->unit == ABI17_0_0YGUnitAuto) {
              leadingCrossDim += fmaxf(0.0f, remainingCrossDim);
            } else if (alignItem == ABI17_0_0YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == ABI17_0_0YGAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else {
              leadingCrossDim += remainingCrossDim;
            }
          }
          // And we apply the position
          child->layout.position[pos[crossAxis]] += totalLineCrossDim + leadingCrossDim;
        }
      }
    }

    totalLineCrossDim += crossDim;
    maxLineMainDim = fmaxf(maxLineMainDim, mainDim);
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (performLayout && (lineCount > 1 || ABI17_0_0YGIsBaselineLayout(node)) &&
      !ABI17_0_0YGFloatIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->style.alignContent) {
      case ABI17_0_0YGAlignFlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case ABI17_0_0YGAlignCenter:
        currentLead += remainingAlignContentDim / 2;
        break;
      case ABI17_0_0YGAlignStretch:
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = remainingAlignContentDim / lineCount;
        }
        break;
      case ABI17_0_0YGAlignSpaceAround:
        if (availableInnerCrossDim > totalLineCrossDim) {
          currentLead += remainingAlignContentDim / (2 * lineCount);
          if (lineCount > 1) {
            crossDimLead = remainingAlignContentDim / lineCount;
          }
        } else {
          currentLead += remainingAlignContentDim / 2;
        }
        break;
      case ABI17_0_0YGAlignSpaceBetween:
        if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
          crossDimLead = remainingAlignContentDim / (lineCount - 1);
        }
        break;
      case ABI17_0_0YGAlignAuto:
      case ABI17_0_0YGAlignFlexStart:
      case ABI17_0_0YGAlignBaseline:
        break;
    }

    uint32_t endIndex = 0;
    for (uint32_t i = 0; i < lineCount; i++) {
      const uint32_t startIndex = endIndex;
      uint32_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      float maxAscentForCurrentLine = 0;
      float maxDescentForCurrentLine = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, ii);
        if (child->style.display == ABI17_0_0YGDisplayNone) {
          continue;
        }
        if (child->style.positionType == ABI17_0_0YGPositionTypeRelative) {
          if (child->lineIndex != i) {
            break;
          }
          if (ABI17_0_0YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = fmaxf(lineHeight,
                               child->layout.measuredDimensions[dim[crossAxis]] +
                                   ABI17_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth));
          }
          if (ABI17_0_0YGNodeAlignItem(node, child) == ABI17_0_0YGAlignBaseline) {
            const float ascent =
                ABI17_0_0YGBaseline(child) +
                ABI17_0_0YGNodeLeadingMargin(child, ABI17_0_0YGFlexDirectionColumn, availableInnerWidth);
            const float descent =
                child->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] +
                ABI17_0_0YGNodeMarginForAxis(child, ABI17_0_0YGFlexDirectionColumn, availableInnerWidth) - ascent;
            maxAscentForCurrentLine = fmaxf(maxAscentForCurrentLine, ascent);
            maxDescentForCurrentLine = fmaxf(maxDescentForCurrentLine, descent);
            lineHeight = fmaxf(lineHeight, maxAscentForCurrentLine + maxDescentForCurrentLine);
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, ii);
          if (child->style.display == ABI17_0_0YGDisplayNone) {
            continue;
          }
          if (child->style.positionType == ABI17_0_0YGPositionTypeRelative) {
            switch (ABI17_0_0YGNodeAlignItem(node, child)) {
              case ABI17_0_0YGAlignFlexStart: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + ABI17_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
                break;
              }
              case ABI17_0_0YGAlignFlexEnd: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight -
                    ABI17_0_0YGNodeTrailingMargin(child, crossAxis, availableInnerWidth) -
                    child->layout.measuredDimensions[dim[crossAxis]];
                break;
              }
              case ABI17_0_0YGAlignCenter: {
                float childHeight = child->layout.measuredDimensions[dim[crossAxis]];
                child->layout.position[pos[crossAxis]] =
                    currentLead + (lineHeight - childHeight) / 2;
                break;
              }
              case ABI17_0_0YGAlignStretch: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + ABI17_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);

                // Remeasure child with the line height as it as been only measured with the
                // parents height yet.
                if (!ABI17_0_0YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth =
                      isMainAxisRow ? (child->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] +
                                       ABI17_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth))
                                    : lineHeight;

                  const float childHeight =
                      !isMainAxisRow ? (child->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] +
                                        ABI17_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth))
                                     : lineHeight;

                  if (!(ABI17_0_0YGFloatsEqual(childWidth,
                                      child->layout.measuredDimensions[ABI17_0_0YGDimensionWidth]) &&
                        ABI17_0_0YGFloatsEqual(childHeight,
                                      child->layout.measuredDimensions[ABI17_0_0YGDimensionHeight]))) {
                    ABI17_0_0YGLayoutNodeInternal(child,
                                         childWidth,
                                         childHeight,
                                         direction,
                                         ABI17_0_0YGMeasureModeExactly,
                                         ABI17_0_0YGMeasureModeExactly,
                                         availableInnerWidth,
                                         availableInnerHeight,
                                         true,
                                         "multiline-stretch",
                                         config);
                  }
                }
                break;
              }
              case ABI17_0_0YGAlignBaseline: {
                child->layout.position[ABI17_0_0YGEdgeTop] =
                    currentLead + maxAscentForCurrentLine - ABI17_0_0YGBaseline(child) +
                    ABI17_0_0YGNodeLeadingPosition(child, ABI17_0_0YGFlexDirectionColumn, availableInnerCrossDim);
                break;
              }
              case ABI17_0_0YGAlignAuto:
              case ABI17_0_0YGAlignSpaceBetween:
              case ABI17_0_0YGAlignSpaceAround:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth] = ABI17_0_0YGNodeBoundAxis(
      node, ABI17_0_0YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
  node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight] = ABI17_0_0YGNodeBoundAxis(
      node, ABI17_0_0YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI17_0_0YGMeasureModeUndefined ||
      (node->style.overflow != ABI17_0_0YGOverflowScroll && measureModeMainDim == ABI17_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] =
        ABI17_0_0YGNodeBoundAxis(node, mainAxis, maxLineMainDim, mainAxisParentSize, parentWidth);
  } else if (measureModeMainDim == ABI17_0_0YGMeasureModeAtMost &&
             node->style.overflow == ABI17_0_0YGOverflowScroll) {
    node->layout.measuredDimensions[dim[mainAxis]] = fmaxf(
        fminf(availableInnerMainDim + paddingAndBorderAxisMain,
              ABI17_0_0YGNodeBoundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim, mainAxisParentSize)),
        paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == ABI17_0_0YGMeasureModeUndefined ||
      (node->style.overflow != ABI17_0_0YGOverflowScroll && measureModeCrossDim == ABI17_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        ABI17_0_0YGNodeBoundAxis(node,
                        crossAxis,
                        totalLineCrossDim + paddingAndBorderAxisCross,
                        crossAxisParentSize,
                        parentWidth);
  } else if (measureModeCrossDim == ABI17_0_0YGMeasureModeAtMost &&
             node->style.overflow == ABI17_0_0YGOverflowScroll) {
    node->layout.measuredDimensions[dim[crossAxis]] =
        fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    ABI17_0_0YGNodeBoundAxisWithinMinAndMax(node,
                                                   crossAxis,
                                                   totalLineCrossDim + paddingAndBorderAxisCross,
                                                   crossAxisParentSize)),
              paddingAndBorderAxisCross);
  }

  // As we only wrapped in normal direction yet, we need to reverse the positions on wrap-reverse.
  if (performLayout && node->style.flexWrap == ABI17_0_0YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeGetChild(node, i);
      if (child->style.positionType == ABI17_0_0YGPositionTypeRelative) {
        child->layout.position[pos[crossAxis]] = node->layout.measuredDimensions[dim[crossAxis]] -
                                                 child->layout.position[pos[crossAxis]] -
                                                 child->layout.measuredDimensions[dim[crossAxis]];
      }
    }
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (currentAbsoluteChild = firstAbsoluteChild; currentAbsoluteChild != NULL;
         currentAbsoluteChild = currentAbsoluteChild->nextChild) {
      ABI17_0_0YGNodeAbsoluteLayoutChild(node,
                                currentAbsoluteChild,
                                availableInnerWidth,
                                isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
                                availableInnerHeight,
                                direction,
                                config);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos =
        mainAxis == ABI17_0_0YGFlexDirectionRowReverse || mainAxis == ABI17_0_0YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        crossAxis == ABI17_0_0YGFlexDirectionRowReverse || crossAxis == ABI17_0_0YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const ABI17_0_0YGNodeRef child = ABI17_0_0YGNodeListGet(node->children, i);
        if (child->style.display == ABI17_0_0YGDisplayNone) {
          continue;
        }
        if (needsMainTrailingPos) {
          ABI17_0_0YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          ABI17_0_0YGNodeSetChildTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }
}

uint32_t gDepth = 0;
bool gPrintTree = false;
bool gPrintChanges = false;
bool gPrintSkips = false;

static const char *spacer = "                                                            ";

static const char *ABI17_0_0YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char *ABI17_0_0YGMeasureModeName(const ABI17_0_0YGMeasureMode mode, const bool performLayout) {
  const char *kMeasureModeNames[ABI17_0_0YGMeasureModeCount] = {"UNDEFINED", "ABI17_0_0EXACTLY", "AT_MOST"};
  const char *kLayoutModeNames[ABI17_0_0YGMeasureModeCount] = {"LAY_UNDEFINED",
                                                      "LAY_EXACTLY",
                                                      "LAY_AT_"
                                                      "MOST"};

  if (mode >= ABI17_0_0YGMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool ABI17_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(ABI17_0_0YGMeasureMode sizeMode,
                                                                     float size,
                                                                     float lastComputedSize) {
  return sizeMode == ABI17_0_0YGMeasureModeExactly && ABI17_0_0YGFloatsEqual(size, lastComputedSize);
}

static inline bool ABI17_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(ABI17_0_0YGMeasureMode sizeMode,
                                                                 float size,
                                                                 ABI17_0_0YGMeasureMode lastSizeMode,
                                                                 float lastComputedSize) {
  return sizeMode == ABI17_0_0YGMeasureModeAtMost && lastSizeMode == ABI17_0_0YGMeasureModeUndefined &&
         (size >= lastComputedSize || ABI17_0_0YGFloatsEqual(size, lastComputedSize));
}

static inline bool ABI17_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(ABI17_0_0YGMeasureMode sizeMode,
                                                                      float size,
                                                                      ABI17_0_0YGMeasureMode lastSizeMode,
                                                                      float lastSize,
                                                                      float lastComputedSize) {
  return lastSizeMode == ABI17_0_0YGMeasureModeAtMost && sizeMode == ABI17_0_0YGMeasureModeAtMost &&
         lastSize > size && (lastComputedSize <= size || ABI17_0_0YGFloatsEqual(size, lastComputedSize));
}

bool ABI17_0_0YGNodeCanUseCachedMeasurement(const ABI17_0_0YGMeasureMode widthMode,
                                   const float width,
                                   const ABI17_0_0YGMeasureMode heightMode,
                                   const float height,
                                   const ABI17_0_0YGMeasureMode lastWidthMode,
                                   const float lastWidth,
                                   const ABI17_0_0YGMeasureMode lastHeightMode,
                                   const float lastHeight,
                                   const float lastComputedWidth,
                                   const float lastComputedHeight,
                                   const float marginRow,
                                   const float marginColumn) {
  if (lastComputedHeight < 0 || lastComputedWidth < 0) {
    return false;
  }

  const bool hasSameWidthSpec = lastWidthMode == widthMode && ABI17_0_0YGFloatsEqual(lastWidth, width);
  const bool hasSameHeightSpec = lastHeightMode == heightMode && ABI17_0_0YGFloatsEqual(lastHeight, height);

  const bool widthIsCompatible =
      hasSameWidthSpec || ABI17_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(widthMode,
                                                                            width - marginRow,
                                                                            lastComputedWidth) ||
      ABI17_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(widthMode,
                                                    width - marginRow,
                                                    lastWidthMode,
                                                    lastComputedWidth) ||
      ABI17_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode, width - marginRow, lastWidthMode, lastWidth, lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec || ABI17_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(heightMode,
                                                                             height - marginColumn,
                                                                             lastComputedHeight) ||
      ABI17_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(heightMode,
                                                    height - marginColumn,
                                                    lastHeightMode,
                                                    lastComputedHeight) ||
      ABI17_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode, height - marginColumn, lastHeightMode, lastHeight, lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the ABI17_0_0YGNodelayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as ABI17_0_0YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool ABI17_0_0YGLayoutNodeInternal(const ABI17_0_0YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const ABI17_0_0YGDirection parentDirection,
                          const ABI17_0_0YGMeasureMode widthMeasureMode,
                          const ABI17_0_0YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason,
                          const ABI17_0_0YGConfigRef config) {
  ABI17_0_0YGLayout *layout = &node->layout;

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.widthMeasureMode = (ABI17_0_0YGMeasureMode) -1;
    layout->cachedLayout.heightMeasureMode = (ABI17_0_0YGMeasureMode) -1;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  ABI17_0_0YGCachedMeasurement *cachedResults = NULL;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions
  // and dimensions for nodes in the subtree. The algorithm assumes that each
  // node
  // gets layed out a maximum of one time per tree layout, but multiple
  // measurements
  // may be required to resolve all of the flex dimensions.
  // We handle nodes with measure functions specially here because they are the
  // most
  // expensive to measure, so it's worth avoiding redundant measurements if at
  // all possible.
  if (node->measure) {
    const float marginAxisRow = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionRow, parentWidth);
    const float marginAxisColumn = ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionColumn, parentWidth);

    // First, try to use the layout cache.
    if (ABI17_0_0YGNodeCanUseCachedMeasurement(widthMeasureMode,
                                      availableWidth,
                                      heightMeasureMode,
                                      availableHeight,
                                      layout->cachedLayout.widthMeasureMode,
                                      layout->cachedLayout.availableWidth,
                                      layout->cachedLayout.heightMeasureMode,
                                      layout->cachedLayout.availableHeight,
                                      layout->cachedLayout.computedWidth,
                                      layout->cachedLayout.computedHeight,
                                      marginAxisRow,
                                      marginAxisColumn)) {
      cachedResults = &layout->cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (ABI17_0_0YGNodeCanUseCachedMeasurement(widthMeasureMode,
                                          availableWidth,
                                          heightMeasureMode,
                                          availableHeight,
                                          layout->cachedMeasurements[i].widthMeasureMode,
                                          layout->cachedMeasurements[i].availableWidth,
                                          layout->cachedMeasurements[i].heightMeasureMode,
                                          layout->cachedMeasurements[i].availableHeight,
                                          layout->cachedMeasurements[i].computedWidth,
                                          layout->cachedMeasurements[i].computedHeight,
                                          marginAxisRow,
                                          marginAxisColumn)) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (ABI17_0_0YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        ABI17_0_0YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (ABI17_0_0YGFloatsEqual(layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          ABI17_0_0YGFloatsEqual(layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != NULL) {
    layout->measuredDimensions[ABI17_0_0YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI17_0_0YGDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", ABI17_0_0YGSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
             ABI17_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI17_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             cachedResults->computedWidth,
             cachedResults->computedHeight,
             reason);
    }
  } else {
    if (gPrintChanges) {
      printf("%s%d.{%s", ABI17_0_0YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n",
             ABI17_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI17_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             reason);
    }

    ABI17_0_0YGNodelayoutImpl(node,
                     availableWidth,
                     availableHeight,
                     parentDirection,
                     widthMeasureMode,
                     heightMeasureMode,
                     parentWidth,
                     parentHeight,
                     performLayout,
                     config);

    if (gPrintChanges) {
      printf("%s%d.}%s", ABI17_0_0YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
             ABI17_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI17_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             layout->measuredDimensions[ABI17_0_0YGDimensionWidth],
             layout->measuredDimensions[ABI17_0_0YGDimensionHeight],
             reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == NULL) {
      if (layout->nextCachedMeasurementsIndex == ABI17_0_0YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI17_0_0YGCachedMeasurement *newCacheEntry;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = &layout->cachedLayout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry = &layout->cachedMeasurements[layout->nextCachedMeasurementsIndex];
        layout->nextCachedMeasurementsIndex++;
      }

      newCacheEntry->availableWidth = availableWidth;
      newCacheEntry->availableHeight = availableHeight;
      newCacheEntry->widthMeasureMode = widthMeasureMode;
      newCacheEntry->heightMeasureMode = heightMeasureMode;
      newCacheEntry->computedWidth = layout->measuredDimensions[ABI17_0_0YGDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[ABI17_0_0YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[ABI17_0_0YGDimensionWidth] = node->layout.measuredDimensions[ABI17_0_0YGDimensionWidth];
    node->layout.dimensions[ABI17_0_0YGDimensionHeight] = node->layout.measuredDimensions[ABI17_0_0YGDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

void ABI17_0_0YGConfigSetPointScaleFactor(const ABI17_0_0YGConfigRef config, const float pixelsInPoint) {
  ABI17_0_0YG_ASSERT(pixelsInPoint >= 0.0f, "Scale factor should not be less than zero");
  // We store points for Pixel as we will use it for rounding
  if (pixelsInPoint == 0.0f) {
    // Zero is used to skip rounding
    config->pointScaleFactor = 0.0f;
  } else {
    config->pointScaleFactor = 1.0f / pixelsInPoint;
  }
}

static void ABI17_0_0YGRoundToPixelGrid(const ABI17_0_0YGNodeRef node, const float pointScaleFactor) {
  if (pointScaleFactor == 0.0f) {
    return;
  }
  const float nodeLeft = node->layout.position[ABI17_0_0YGEdgeLeft];
  const float nodeTop = node->layout.position[ABI17_0_0YGEdgeTop];

  // To round correctly to the pixel grid, first we calculate left and top coordinates
  float fractialLeft = fmodf(nodeLeft, pointScaleFactor);
  float fractialTop = fmodf(nodeTop, pointScaleFactor);
  float roundedLeft = nodeLeft - fractialLeft;
  float roundedTop = nodeTop - fractialTop;

  // To do the actual rounding we check if leftover fraction is bigger or equal than half of the grid step
  if (fractialLeft >= pointScaleFactor / 2.0f) {
    roundedLeft += pointScaleFactor;
    fractialLeft -= pointScaleFactor;
  }
  if (fractialTop >= pointScaleFactor / 2.0f) {
    roundedTop += pointScaleFactor;
    fractialTop -= pointScaleFactor;
  }
  node->layout.position[ABI17_0_0YGEdgeLeft] = roundedLeft;
  node->layout.position[ABI17_0_0YGEdgeTop] = roundedTop;

  // Now we round width and height in the same way accounting for fractial leftovers from rounding position
  const float adjustedWidth = fractialLeft + node->layout.dimensions[ABI17_0_0YGDimensionWidth];
  const float adjustedHeight = fractialTop + node->layout.dimensions[ABI17_0_0YGDimensionHeight];
  float roundedWidth = adjustedWidth - fmodf(adjustedWidth, pointScaleFactor);
  float roundedHeight = adjustedHeight - fmodf(adjustedHeight, pointScaleFactor);

  if (adjustedWidth - roundedWidth >= pointScaleFactor / 2.0f) {
    roundedWidth += pointScaleFactor;
  }
  if (adjustedHeight - roundedHeight >= pointScaleFactor / 2.0f) {
    roundedHeight += pointScaleFactor;
  }
  node->layout.dimensions[ABI17_0_0YGDimensionWidth] = roundedWidth;
  node->layout.dimensions[ABI17_0_0YGDimensionHeight] = roundedHeight;

  const uint32_t childCount = ABI17_0_0YGNodeListCount(node->children);
  for (uint32_t i = 0; i < childCount; i++) {
    ABI17_0_0YGRoundToPixelGrid(ABI17_0_0YGNodeGetChild(node, i), pointScaleFactor);
  }
}

void ABI17_0_0YGNodeCalculateLayout(const ABI17_0_0YGNodeRef node,
                           const float parentWidth,
                           const float parentHeight,
                           const ABI17_0_0YGDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  ABI17_0_0YGResolveDimensions(node);

  float width = ABI17_0_0YGUndefined;
  ABI17_0_0YGMeasureMode widthMeasureMode = ABI17_0_0YGMeasureModeUndefined;
  if (ABI17_0_0YGNodeIsStyleDimDefined(node, ABI17_0_0YGFlexDirectionRow, parentWidth)) {
    width = ABI17_0_0YGResolveValue(node->resolvedDimensions[dim[ABI17_0_0YGFlexDirectionRow]], parentWidth) +
            ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionRow, parentWidth);
    widthMeasureMode = ABI17_0_0YGMeasureModeExactly;
  } else if (ABI17_0_0YGResolveValue(&node->style.maxDimensions[ABI17_0_0YGDimensionWidth], parentWidth) >= 0.0f) {
    width = ABI17_0_0YGResolveValue(&node->style.maxDimensions[ABI17_0_0YGDimensionWidth], parentWidth);
    widthMeasureMode = ABI17_0_0YGMeasureModeAtMost;
  } else {
    width = parentWidth;
    widthMeasureMode = ABI17_0_0YGFloatIsUndefined(width) ? ABI17_0_0YGMeasureModeUndefined : ABI17_0_0YGMeasureModeExactly;
  }

  float height = ABI17_0_0YGUndefined;
  ABI17_0_0YGMeasureMode heightMeasureMode = ABI17_0_0YGMeasureModeUndefined;
  if (ABI17_0_0YGNodeIsStyleDimDefined(node, ABI17_0_0YGFlexDirectionColumn, parentHeight)) {
    height = ABI17_0_0YGResolveValue(node->resolvedDimensions[dim[ABI17_0_0YGFlexDirectionColumn]], parentHeight) +
             ABI17_0_0YGNodeMarginForAxis(node, ABI17_0_0YGFlexDirectionColumn, parentWidth);
    heightMeasureMode = ABI17_0_0YGMeasureModeExactly;
  } else if (ABI17_0_0YGResolveValue(&node->style.maxDimensions[ABI17_0_0YGDimensionHeight], parentHeight) >=
             0.0f) {
    height = ABI17_0_0YGResolveValue(&node->style.maxDimensions[ABI17_0_0YGDimensionHeight], parentHeight);
    heightMeasureMode = ABI17_0_0YGMeasureModeAtMost;
  } else {
    height = parentHeight;
    heightMeasureMode = ABI17_0_0YGFloatIsUndefined(height) ? ABI17_0_0YGMeasureModeUndefined : ABI17_0_0YGMeasureModeExactly;
  }

  if (ABI17_0_0YGLayoutNodeInternal(node,
                           width,
                           height,
                           parentDirection,
                           widthMeasureMode,
                           heightMeasureMode,
                           parentWidth,
                           parentHeight,
                           true,
                           "initial",
                           node->config)) {
    ABI17_0_0YGNodeSetPosition(node, node->layout.direction, parentWidth, parentHeight, parentWidth);

    if (ABI17_0_0YGConfigIsExperimentalFeatureEnabled(node->config, ABI17_0_0YGExperimentalFeatureRounding)) {
      ABI17_0_0YGRoundToPixelGrid(node, node->config->pointScaleFactor);
    }

    if (gPrintTree) {
      ABI17_0_0YGNodePrint(node, ABI17_0_0YGPrintOptionsLayout | ABI17_0_0YGPrintOptionsChildren | ABI17_0_0YGPrintOptionsStyle);
    }
  }
}

void ABI17_0_0YGSetLogger(ABI17_0_0YGLogger logger) {
  gLogger = logger;
}

void ABI17_0_0YGLog(ABI17_0_0YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  gLogger(level, format, args);
  va_end(args);
}

void ABI17_0_0YGConfigSetExperimentalFeatureEnabled(const ABI17_0_0YGConfigRef config,
                                     const ABI17_0_0YGExperimentalFeature feature,
                                     const bool enabled) {
  config->experimentalFeatures[feature] = enabled;
}

inline bool ABI17_0_0YGConfigIsExperimentalFeatureEnabled(const ABI17_0_0YGConfigRef config,
                                           const ABI17_0_0YGExperimentalFeature feature) {
  return config->experimentalFeatures[feature];
}

void ABI17_0_0YGConfigSetUseWebDefaults(const ABI17_0_0YGConfigRef config, const bool enabled) {
  config->useWebDefaults = enabled;
}

bool ABI17_0_0YGConfigGetUseWebDefaults(const ABI17_0_0YGConfigRef config) {
  return config->useWebDefaults;
}

void ABI17_0_0YGSetMemoryFuncs(ABI17_0_0YGMalloc ygmalloc, ABI17_0_0YGCalloc yccalloc, ABI17_0_0YGRealloc ygrealloc, ABI17_0_0YGFree ygfree) {
  ABI17_0_0YG_ASSERT(gNodeInstanceCount == 0, "Cannot set memory functions: all node must be freed first");
  ABI17_0_0YG_ASSERT((ygmalloc == NULL && yccalloc == NULL && ygrealloc == NULL && ygfree == NULL) ||
                (ygmalloc != NULL && yccalloc != NULL && ygrealloc != NULL && ygfree != NULL),
            "Cannot set memory functions: functions must be all NULL or Non-NULL");

  if (ygmalloc == NULL || yccalloc == NULL || ygrealloc == NULL || ygfree == NULL) {
    gABI17_0_0YGMalloc = &malloc;
    gABI17_0_0YGCalloc = &calloc;
    gABI17_0_0YGRealloc = &realloc;
    gABI17_0_0YGFree = &free;
  } else {
    gABI17_0_0YGMalloc = ygmalloc;
    gABI17_0_0YGCalloc = yccalloc;
    gABI17_0_0YGRealloc = ygrealloc;
    gABI17_0_0YGFree = ygfree;
  }
}
