/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "ABI16_0_0YGNodeList.h"
#include "ABI16_0_0Yoga.h"

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

typedef struct ABI16_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI16_0_0YGMeasureMode widthMeasureMode;
  ABI16_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} ABI16_0_0YGCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define ABI16_0_0YG_MAX_CACHED_RESULT_COUNT 16

typedef struct ABI16_0_0YGLayout {
  float position[4];
  float dimensions[2];
  float margin[6];
  float border[6];
  float padding[6];
  ABI16_0_0YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI16_0_0YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  ABI16_0_0YGCachedMeasurement cachedMeasurements[ABI16_0_0YG_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  ABI16_0_0YGCachedMeasurement cachedLayout;
} ABI16_0_0YGLayout;

typedef struct ABI16_0_0YGStyle {
  ABI16_0_0YGDirection direction;
  ABI16_0_0YGFlexDirection flexDirection;
  ABI16_0_0YGJustify justifyContent;
  ABI16_0_0YGAlign alignContent;
  ABI16_0_0YGAlign alignItems;
  ABI16_0_0YGAlign alignSelf;
  ABI16_0_0YGPositionType positionType;
  ABI16_0_0YGWrap flexWrap;
  ABI16_0_0YGOverflow overflow;
  ABI16_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI16_0_0YGValue flexBasis;
  ABI16_0_0YGValue margin[ABI16_0_0YGEdgeCount];
  ABI16_0_0YGValue position[ABI16_0_0YGEdgeCount];
  ABI16_0_0YGValue padding[ABI16_0_0YGEdgeCount];
  ABI16_0_0YGValue border[ABI16_0_0YGEdgeCount];
  ABI16_0_0YGValue dimensions[2];
  ABI16_0_0YGValue minDimensions[2];
  ABI16_0_0YGValue maxDimensions[2];

  // Yoga specific properties, not compatible with flexbox specification
  float aspectRatio;
} ABI16_0_0YGStyle;

typedef struct ABI16_0_0YGConfig { bool experimentalFeatures[ABI16_0_0YGExperimentalFeatureCount + 1]; } ABI16_0_0YGConfig;

typedef struct ABI16_0_0YGNode {
  ABI16_0_0YGStyle style;
  ABI16_0_0YGLayout layout;
  uint32_t lineIndex;

  ABI16_0_0YGNodeRef parent;
  ABI16_0_0YGNodeListRef children;

  struct ABI16_0_0YGNode *nextChild;

  ABI16_0_0YGMeasureFunc measure;
  ABI16_0_0YGBaselineFunc baseline;
  ABI16_0_0YGPrintFunc print;
  ABI16_0_0YGConfigRef config;
  void *context;

  bool isDirty;
  bool hasNewLayout;

  ABI16_0_0YGValue const *resolvedDimensions[2];
} ABI16_0_0YGNode;

#define ABI16_0_0YG_UNDEFINED_VALUES \
  { .value = ABI16_0_0YGUndefined, .unit = ABI16_0_0YGUnitUndefined }

#define ABI16_0_0YG_AUTO_VALUES \
  { .value = ABI16_0_0YGUndefined, .unit = ABI16_0_0YGUnitAuto }

#define ABI16_0_0YG_DEFAULT_EDGE_VALUES_UNIT                                                   \
  {                                                                                   \
    [ABI16_0_0YGEdgeLeft] = ABI16_0_0YG_UNDEFINED_VALUES, [ABI16_0_0YGEdgeTop] = ABI16_0_0YG_UNDEFINED_VALUES,            \
    [ABI16_0_0YGEdgeRight] = ABI16_0_0YG_UNDEFINED_VALUES, [ABI16_0_0YGEdgeBottom] = ABI16_0_0YG_UNDEFINED_VALUES,        \
    [ABI16_0_0YGEdgeStart] = ABI16_0_0YG_UNDEFINED_VALUES, [ABI16_0_0YGEdgeEnd] = ABI16_0_0YG_UNDEFINED_VALUES,           \
    [ABI16_0_0YGEdgeHorizontal] = ABI16_0_0YG_UNDEFINED_VALUES, [ABI16_0_0YGEdgeVertical] = ABI16_0_0YG_UNDEFINED_VALUES, \
    [ABI16_0_0YGEdgeAll] = ABI16_0_0YG_UNDEFINED_VALUES,                                                \
  }

#define ABI16_0_0YG_DEFAULT_DIMENSION_VALUES \
  { [ABI16_0_0YGDimensionWidth] = ABI16_0_0YGUndefined, [ABI16_0_0YGDimensionHeight] = ABI16_0_0YGUndefined, }

#define ABI16_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT \
  { [ABI16_0_0YGDimensionWidth] = ABI16_0_0YG_UNDEFINED_VALUES, [ABI16_0_0YGDimensionHeight] = ABI16_0_0YG_UNDEFINED_VALUES, }

#define ABI16_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT \
  { [ABI16_0_0YGDimensionWidth] = ABI16_0_0YG_AUTO_VALUES, [ABI16_0_0YGDimensionHeight] = ABI16_0_0YG_AUTO_VALUES, }

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;

static ABI16_0_0YGNode gABI16_0_0YGNodeDefaults = {
    .parent = NULL,
    .children = NULL,
    .hasNewLayout = true,
    .isDirty = false,
    .resolvedDimensions = {[ABI16_0_0YGDimensionWidth] = &ABI16_0_0YGValueUndefined,
                           [ABI16_0_0YGDimensionHeight] = &ABI16_0_0YGValueUndefined},

    .style =
        {
            .flex = ABI16_0_0YGUndefined,
            .flexGrow = ABI16_0_0YGUndefined,
            .flexShrink = ABI16_0_0YGUndefined,
            .flexBasis = ABI16_0_0YG_AUTO_VALUES,
            .justifyContent = ABI16_0_0YGJustifyFlexStart,
            .alignItems = ABI16_0_0YGAlignStretch,
            .alignContent = ABI16_0_0YGAlignFlexStart,
            .direction = ABI16_0_0YGDirectionInherit,
            .flexDirection = ABI16_0_0YGFlexDirectionColumn,
            .overflow = ABI16_0_0YGOverflowVisible,
            .display = ABI16_0_0YGDisplayFlex,
            .dimensions = ABI16_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT,
            .minDimensions = ABI16_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .maxDimensions = ABI16_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .position = ABI16_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .margin = ABI16_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .padding = ABI16_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .border = ABI16_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .aspectRatio = ABI16_0_0YGUndefined,
        },

    .layout =
        {
            .dimensions = ABI16_0_0YG_DEFAULT_DIMENSION_VALUES,
            .lastParentDirection = (ABI16_0_0YGDirection) -1,
            .nextCachedMeasurementsIndex = 0,
            .computedFlexBasis = ABI16_0_0YGUndefined,
            .measuredDimensions = ABI16_0_0YG_DEFAULT_DIMENSION_VALUES,

            .cachedLayout =
                {
                    .widthMeasureMode = (ABI16_0_0YGMeasureMode) -1,
                    .heightMeasureMode = (ABI16_0_0YGMeasureMode) -1,
                    .computedWidth = -1,
                    .computedHeight = -1,
                },
        },
};

static ABI16_0_0YGConfig gABI16_0_0YGConfigDefaults = {
    .experimentalFeatures =
        {
                [ABI16_0_0YGExperimentalFeatureRounding] = false,
                [ABI16_0_0YGExperimentalFeatureWebFlexBasis] = false,
        },
};

static void ABI16_0_0YGNodeMarkDirtyInternal(const ABI16_0_0YGNodeRef node);

ABI16_0_0YGMalloc gABI16_0_0YGMalloc = &malloc;
ABI16_0_0YGCalloc gABI16_0_0YGCalloc = &calloc;
ABI16_0_0YGRealloc gABI16_0_0YGRealloc = &realloc;
ABI16_0_0YGFree gABI16_0_0YGFree = &free;

static ABI16_0_0YGValue ABI16_0_0YGValueZero = {.value = 0, .unit = ABI16_0_0YGUnitPoint};

#ifdef ANDROID
#include <android/log.h>
static int ABI16_0_0YGAndroidLog(ABI16_0_0YGLogLevel level, const char *format, va_list args) {
  int androidLevel = ABI16_0_0YGLogLevelDebug;
  switch (level) {
    case ABI16_0_0YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case ABI16_0_0YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case ABI16_0_0YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case ABI16_0_0YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case ABI16_0_0YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
  }
  const int result = __android_log_vprint(androidLevel, "ABI16_0_0YG-layout", format, args);
  return result;
}
static ABI16_0_0YGLogger gLogger = &ABI16_0_0YGAndroidLog;
#else
static int ABI16_0_0YGDefaultLog(ABI16_0_0YGLogLevel level, const char *format, va_list args) {
  switch (level) {
    case ABI16_0_0YGLogLevelError:
      return vfprintf(stderr, format, args);
    case ABI16_0_0YGLogLevelWarn:
    case ABI16_0_0YGLogLevelInfo:
    case ABI16_0_0YGLogLevelDebug:
    case ABI16_0_0YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}
static ABI16_0_0YGLogger gLogger = &ABI16_0_0YGDefaultLog;
#endif

static inline const ABI16_0_0YGValue *ABI16_0_0YGComputedEdgeValue(const ABI16_0_0YGValue edges[ABI16_0_0YGEdgeCount],
                                                 const ABI16_0_0YGEdge edge,
                                                 const ABI16_0_0YGValue *const defaultValue) {
  ABI16_0_0YG_ASSERT(edge <= ABI16_0_0YGEdgeEnd, "Cannot get computed value of multi-edge shorthands");

  if (edges[edge].unit != ABI16_0_0YGUnitUndefined) {
    return &edges[edge];
  }

  if ((edge == ABI16_0_0YGEdgeTop || edge == ABI16_0_0YGEdgeBottom) &&
      edges[ABI16_0_0YGEdgeVertical].unit != ABI16_0_0YGUnitUndefined) {
    return &edges[ABI16_0_0YGEdgeVertical];
  }

  if ((edge == ABI16_0_0YGEdgeLeft || edge == ABI16_0_0YGEdgeRight || edge == ABI16_0_0YGEdgeStart || edge == ABI16_0_0YGEdgeEnd) &&
      edges[ABI16_0_0YGEdgeHorizontal].unit != ABI16_0_0YGUnitUndefined) {
    return &edges[ABI16_0_0YGEdgeHorizontal];
  }

  if (edges[ABI16_0_0YGEdgeAll].unit != ABI16_0_0YGUnitUndefined) {
    return &edges[ABI16_0_0YGEdgeAll];
  }

  if (edge == ABI16_0_0YGEdgeStart || edge == ABI16_0_0YGEdgeEnd) {
    return &ABI16_0_0YGValueUndefined;
  }

  return defaultValue;
}

static inline float ABI16_0_0YGValueResolve(const ABI16_0_0YGValue *const value, const float parentSize) {
  switch (value->unit) {
    case ABI16_0_0YGUnitUndefined:
    case ABI16_0_0YGUnitAuto:
      return ABI16_0_0YGUndefined;
    case ABI16_0_0YGUnitPoint:
      return value->value;
    case ABI16_0_0YGUnitPercent:
      return value->value * parentSize / 100.0f;
  }
  return ABI16_0_0YGUndefined;
}

static inline float ABI16_0_0YGValueResolveMargin(const ABI16_0_0YGValue *const value, const float parentSize) {
  return value->unit == ABI16_0_0YGUnitAuto ? 0 : ABI16_0_0YGValueResolve(value, parentSize);
}

int32_t gNodeInstanceCount = 0;


WIN_EXPORT ABI16_0_0YGNodeRef ABI16_0_0YGNodeNewWithConfig(const ABI16_0_0YGConfigRef config) {
  const ABI16_0_0YGNodeRef node = gABI16_0_0YGMalloc(sizeof(ABI16_0_0YGNode));
  ABI16_0_0YG_ASSERT(node, "Could not allocate memory for node");
  gNodeInstanceCount++;

  memcpy(node, &gABI16_0_0YGNodeDefaults, sizeof(ABI16_0_0YGNode));
  node->config = config;
  return node;
}

ABI16_0_0YGNodeRef ABI16_0_0YGNodeNew(void) {
  return ABI16_0_0YGNodeNewWithConfig(&gABI16_0_0YGConfigDefaults);
}

void ABI16_0_0YGNodeFree(const ABI16_0_0YGNodeRef node) {
  if (node->parent) {
    ABI16_0_0YGNodeListDelete(node->parent->children, node);
    node->parent = NULL;
  }

  const uint32_t childCount = ABI16_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeGetChild(node, i);
    child->parent = NULL;
  }

  ABI16_0_0YGNodeListFree(node->children);
  gABI16_0_0YGFree(node);
  gNodeInstanceCount--;
}

void ABI16_0_0YGNodeFreeRecursive(const ABI16_0_0YGNodeRef root) {
  while (ABI16_0_0YGNodeGetChildCount(root) > 0) {
    const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeGetChild(root, 0);
    ABI16_0_0YGNodeRemoveChild(root, child);
    ABI16_0_0YGNodeFreeRecursive(child);
  }
  ABI16_0_0YGNodeFree(root);
}

void ABI16_0_0YGNodeReset(const ABI16_0_0YGNodeRef node) {
  ABI16_0_0YG_ASSERT(ABI16_0_0YGNodeGetChildCount(node) == 0,
            "Cannot reset a node which still has children attached");
  ABI16_0_0YG_ASSERT(node->parent == NULL, "Cannot reset a node still attached to a parent");

  ABI16_0_0YGNodeListFree(node->children);

  const ABI16_0_0YGConfigRef config = node->config;
  memcpy(node, &gABI16_0_0YGNodeDefaults, sizeof(ABI16_0_0YGNode));
  node->config = config;
}

int32_t ABI16_0_0YGNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

ABI16_0_0YGConfigRef ABI16_0_0YGConfigNew(void) {
  const ABI16_0_0YGConfigRef config = gABI16_0_0YGMalloc(sizeof(ABI16_0_0YGConfig));
  ABI16_0_0YG_ASSERT(config, "Could not allocate memory for config");
  memcpy(config, &gABI16_0_0YGConfigDefaults, sizeof(ABI16_0_0YGConfig));
  return config;
}

void ABI16_0_0YGConfigFree(const ABI16_0_0YGConfigRef config) {
  gABI16_0_0YGFree(config);
}

static void ABI16_0_0YGNodeMarkDirtyInternal(const ABI16_0_0YGNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = ABI16_0_0YGUndefined;
    if (node->parent) {
      ABI16_0_0YGNodeMarkDirtyInternal(node->parent);
    }
  }
}

void ABI16_0_0YGNodeSetMeasureFunc(const ABI16_0_0YGNodeRef node, ABI16_0_0YGMeasureFunc measureFunc) {
  if (measureFunc == NULL) {
    node->measure = NULL;
  } else {
    ABI16_0_0YG_ASSERT(ABI16_0_0YGNodeGetChildCount(node) == 0,
              "Cannot set measure function: Nodes with measure functions cannot have children.");
    node->measure = measureFunc;
  }
}

ABI16_0_0YGMeasureFunc ABI16_0_0YGNodeGetMeasureFunc(const ABI16_0_0YGNodeRef node) {
  return node->measure;
}

void ABI16_0_0YGNodeSetBaselineFunc(const ABI16_0_0YGNodeRef node, ABI16_0_0YGBaselineFunc baselineFunc) {
  node->baseline = baselineFunc;
}

ABI16_0_0YGBaselineFunc ABI16_0_0YGNodeGetBaselineFunc(const ABI16_0_0YGNodeRef node) {
  return node->baseline;
}

void ABI16_0_0YGNodeInsertChild(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGNodeRef child, const uint32_t index) {
  ABI16_0_0YG_ASSERT(child->parent == NULL, "Child already has a parent, it must be removed first.");
  ABI16_0_0YG_ASSERT(node->measure == NULL,
            "Cannot add child: Nodes with measure functions cannot have children.");
  ABI16_0_0YGNodeListInsert(&node->children, child, index);
  child->parent = node;
  ABI16_0_0YGNodeMarkDirtyInternal(node);
}

void ABI16_0_0YGNodeRemoveChild(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGNodeRef child) {
  if (ABI16_0_0YGNodeListDelete(node->children, child) != NULL) {
    child->parent = NULL;
    ABI16_0_0YGNodeMarkDirtyInternal(node);
  }
}

ABI16_0_0YGNodeRef ABI16_0_0YGNodeGetChild(const ABI16_0_0YGNodeRef node, const uint32_t index) {
  return ABI16_0_0YGNodeListGet(node->children, index);
}

ABI16_0_0YGNodeRef ABI16_0_0YGNodeGetParent(const ABI16_0_0YGNodeRef node) {
  return node->parent;
}

inline uint32_t ABI16_0_0YGNodeGetChildCount(const ABI16_0_0YGNodeRef node) {
  return ABI16_0_0YGNodeListCount(node->children);
}

void ABI16_0_0YGNodeMarkDirty(const ABI16_0_0YGNodeRef node) {
  ABI16_0_0YG_ASSERT(node->measure != NULL,
            "Only leaf nodes with custom measure functions"
            "should manually mark themselves as dirty");
  ABI16_0_0YGNodeMarkDirtyInternal(node);
}

bool ABI16_0_0YGNodeIsDirty(const ABI16_0_0YGNodeRef node) {
  return node->isDirty;
}

void ABI16_0_0YGNodeCopyStyle(const ABI16_0_0YGNodeRef dstNode, const ABI16_0_0YGNodeRef srcNode) {
  if (memcmp(&dstNode->style, &srcNode->style, sizeof(ABI16_0_0YGStyle)) != 0) {
    memcpy(&dstNode->style, &srcNode->style, sizeof(ABI16_0_0YGStyle));
    ABI16_0_0YGNodeMarkDirtyInternal(dstNode);
  }
}

static inline float ABI16_0_0YGResolveFlexGrow(const ABI16_0_0YGNodeRef node) {
  if (!ABI16_0_0YGFloatIsUndefined(node->style.flexGrow)) {
    return node->style.flexGrow;
  }
  if (!ABI16_0_0YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return node->style.flex;
  }
  return kDefaultFlexGrow;
}

float ABI16_0_0YGNodeStyleGetFlexGrow(const ABI16_0_0YGNodeRef node) {
  return ABI16_0_0YGFloatIsUndefined(node->style.flexGrow) ? kDefaultFlexGrow : node->style.flexGrow;
}

float ABI16_0_0YGNodeStyleGetFlexShrink(const ABI16_0_0YGNodeRef node) {
  return ABI16_0_0YGFloatIsUndefined(node->style.flexShrink) ? kDefaultFlexShrink : node->style.flexShrink;
}

static inline float ABI16_0_0YGNodeResolveFlexShrink(const ABI16_0_0YGNodeRef node) {
  if (!ABI16_0_0YGFloatIsUndefined(node->style.flexShrink)) {
    return node->style.flexShrink;
  }
  if (!ABI16_0_0YGFloatIsUndefined(node->style.flex) && node->style.flex < 0.0f) {
    return -node->style.flex;
  }
  return kDefaultFlexShrink;
}

static inline const ABI16_0_0YGValue *ABI16_0_0YGNodeResolveFlexBasisPtr(const ABI16_0_0YGNodeRef node) {
  if (node->style.flexBasis.unit != ABI16_0_0YGUnitAuto && node->style.flexBasis.unit != ABI16_0_0YGUnitUndefined) {
    return &node->style.flexBasis;
  }
  if (!ABI16_0_0YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return &ABI16_0_0YGValueZero;
  }
  return &ABI16_0_0YGValueAuto;
}

#define ABI16_0_0YG_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
  void ABI16_0_0YGNodeSet##name(const ABI16_0_0YGNodeRef node, type paramName) {     \
    node->instanceName = paramName;                                \
  }                                                                \
                                                                   \
  type ABI16_0_0YGNodeGet##name(const ABI16_0_0YGNodeRef node) {                     \
    return node->instanceName;                                     \
  }

#define ABI16_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
  void ABI16_0_0YGNodeStyleSet##name(const ABI16_0_0YGNodeRef node, const type paramName) {       \
    if (node->style.instanceName != paramName) {                                \
      node->style.instanceName = paramName;                                     \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                            \
    }                                                                           \
  }

#define ABI16_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(type, name, paramName, instanceName) \
  void ABI16_0_0YGNodeStyleSet##name(const ABI16_0_0YGNodeRef node, const type paramName) {            \
    if (node->style.instanceName.value != paramName ||                               \
        node->style.instanceName.unit != ABI16_0_0YGUnitPoint) {                              \
      node->style.instanceName.value = paramName;                                    \
      node->style.instanceName.unit =                                                \
          ABI16_0_0YGFloatIsUndefined(paramName) ? ABI16_0_0YGUnitAuto : ABI16_0_0YGUnitPoint;                  \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                                 \
    }                                                                                \
  }                                                                                  \
                                                                                     \
  void ABI16_0_0YGNodeStyleSet##name##Percent(const ABI16_0_0YGNodeRef node, const type paramName) {   \
    if (node->style.instanceName.value != paramName ||                               \
        node->style.instanceName.unit != ABI16_0_0YGUnitPercent) {                            \
      node->style.instanceName.value = paramName;                                    \
      node->style.instanceName.unit =                                                \
          ABI16_0_0YGFloatIsUndefined(paramName) ? ABI16_0_0YGUnitAuto : ABI16_0_0YGUnitPercent;                \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                                 \
    }                                                                                \
  }

#define ABI16_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(type, name, paramName, instanceName)         \
  void ABI16_0_0YGNodeStyleSet##name(const ABI16_0_0YGNodeRef node, const type paramName) {                         \
    if (node->style.instanceName.value != paramName ||                                            \
        node->style.instanceName.unit != ABI16_0_0YGUnitPoint) {                                           \
      node->style.instanceName.value = paramName;                                                 \
      node->style.instanceName.unit = ABI16_0_0YGFloatIsUndefined(paramName) ? ABI16_0_0YGUnitAuto : ABI16_0_0YGUnitPoint;   \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }                                                                                               \
                                                                                                  \
  void ABI16_0_0YGNodeStyleSet##name##Percent(const ABI16_0_0YGNodeRef node, const type paramName) {                \
    if (node->style.instanceName.value != paramName ||                                            \
        node->style.instanceName.unit != ABI16_0_0YGUnitPercent) {                                         \
      node->style.instanceName.value = paramName;                                                 \
      node->style.instanceName.unit = ABI16_0_0YGFloatIsUndefined(paramName) ? ABI16_0_0YGUnitAuto : ABI16_0_0YGUnitPercent; \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }                                                                                               \
                                                                                                  \
  void ABI16_0_0YGNodeStyleSet##name##Auto(const ABI16_0_0YGNodeRef node) {                                         \
    if (node->style.instanceName.unit != ABI16_0_0YGUnitAuto) {                                            \
      node->style.instanceName.value = ABI16_0_0YGUndefined;                                               \
      node->style.instanceName.unit = ABI16_0_0YGUnitAuto;                                                 \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }

#define ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  ABI16_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
                                                                          \
  type ABI16_0_0YGNodeStyleGet##name(const ABI16_0_0YGNodeRef node) {                       \
    return node->style.instanceName;                                      \
  }

#define ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName)   \
  ABI16_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(float, name, paramName, instanceName) \
                                                                                \
  type ABI16_0_0YGNodeStyleGet##name(const ABI16_0_0YGNodeRef node) {                             \
    return node->style.instanceName;                                            \
  }

#define ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(type, name, paramName, instanceName)   \
  ABI16_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(float, name, paramName, instanceName) \
                                                                                     \
  type ABI16_0_0YGNodeStyleGet##name(const ABI16_0_0YGNodeRef node) {                                  \
    return node->style.instanceName;                                                 \
  }

#define ABI16_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(type, name, instanceName) \
  void ABI16_0_0YGNodeStyleSet##name##Auto(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGEdge edge) { \
    if (node->style.instanceName[edge].unit != ABI16_0_0YGUnitAuto) {                 \
      node->style.instanceName[edge].value = ABI16_0_0YGUndefined;                    \
      node->style.instanceName[edge].unit = ABI16_0_0YGUnitAuto;                      \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                         \
    }                                                                        \
  }

#define ABI16_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName)            \
  void ABI16_0_0YGNodeStyleSet##name(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGEdge edge, const float paramName) { \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI16_0_0YGUnitPoint) {                                 \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI16_0_0YGFloatIsUndefined(paramName) ? ABI16_0_0YGUnitUndefined : ABI16_0_0YGUnitPoint;                      \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  void ABI16_0_0YGNodeStyleSet##name##Percent(const ABI16_0_0YGNodeRef node,                                    \
                                     const ABI16_0_0YGEdge edge,                                       \
                                     const float paramName) {                                 \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI16_0_0YGUnitPercent) {                               \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI16_0_0YGFloatIsUndefined(paramName) ? ABI16_0_0YGUnitUndefined : ABI16_0_0YGUnitPercent;                    \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  type ABI16_0_0YGNodeStyleGet##name(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGEdge edge) {                        \
    return node->style.instanceName[edge];                                                    \
  }

#define ABI16_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName)                 \
  void ABI16_0_0YGNodeStyleSet##name(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGEdge edge, const float paramName) { \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI16_0_0YGUnitPoint) {                                 \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI16_0_0YGFloatIsUndefined(paramName) ? ABI16_0_0YGUnitUndefined : ABI16_0_0YGUnitPoint;                      \
      ABI16_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  float ABI16_0_0YGNodeStyleGet##name(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGEdge edge) {                       \
    return node->style.instanceName[edge].value;                                              \
  }

#define ABI16_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type ABI16_0_0YGNodeLayoutGet##name(const ABI16_0_0YGNodeRef node) {           \
    return node->layout.instanceName;                          \
  }

#define ABI16_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName)                    \
  type ABI16_0_0YGNodeLayoutGet##name(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGEdge edge) {                    \
    ABI16_0_0YG_ASSERT(edge <= ABI16_0_0YGEdgeEnd, "Cannot get layout properties of multi-edge shorthands"); \
                                                                                           \
    if (edge == ABI16_0_0YGEdgeLeft) {                                                              \
      if (node->layout.direction == ABI16_0_0YGDirectionRTL) {                                      \
        return node->layout.instanceName[ABI16_0_0YGEdgeEnd];                                       \
      } else {                                                                             \
        return node->layout.instanceName[ABI16_0_0YGEdgeStart];                                     \
      }                                                                                    \
    }                                                                                      \
                                                                                           \
    if (edge == ABI16_0_0YGEdgeRight) {                                                             \
      if (node->layout.direction == ABI16_0_0YGDirectionRTL) {                                      \
        return node->layout.instanceName[ABI16_0_0YGEdgeStart];                                     \
      } else {                                                                             \
        return node->layout.instanceName[ABI16_0_0YGEdgeEnd];                                       \
      }                                                                                    \
    }                                                                                      \
                                                                                           \
    return node->layout.instanceName[edge];                                                \
  }

ABI16_0_0YG_NODE_PROPERTY_IMPL(void *, Context, context, context);
ABI16_0_0YG_NODE_PROPERTY_IMPL(ABI16_0_0YGPrintFunc, PrintFunc, printFunc, print);
ABI16_0_0YG_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);

ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGDirection, Direction, direction, direction);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGFlexDirection, FlexDirection, flexDirection, flexDirection);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGJustify, JustifyContent, justifyContent, justifyContent);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGAlign, AlignContent, alignContent, alignContent);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGAlign, AlignItems, alignItems, alignItems);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGAlign, AlignSelf, alignSelf, alignSelf);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGPositionType, PositionType, positionType, positionType);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGWrap, FlexWrap, flexWrap, flexWrap);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGOverflow, Overflow, overflow, overflow);
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI16_0_0YGDisplay, Display, display, display);

ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, Flex, flex, flex);
ABI16_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexGrow, flexGrow, flexGrow);
ABI16_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexShrink, flexShrink, flexShrink);
ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI16_0_0YGValue, FlexBasis, flexBasis, flexBasis);

ABI16_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI16_0_0YGValue, Position, position, position);
ABI16_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI16_0_0YGValue, Margin, margin, margin);
ABI16_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(ABI16_0_0YGValue, Margin, margin);
ABI16_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI16_0_0YGValue, Padding, padding, padding);
ABI16_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border);

ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI16_0_0YGValue, Width, width, dimensions[ABI16_0_0YGDimensionWidth]);
ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI16_0_0YGValue, Height, height, dimensions[ABI16_0_0YGDimensionHeight]);
ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI16_0_0YGValue, MinWidth, minWidth, minDimensions[ABI16_0_0YGDimensionWidth]);
ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI16_0_0YGValue, MinHeight, minHeight, minDimensions[ABI16_0_0YGDimensionHeight]);
ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI16_0_0YGValue, MaxWidth, maxWidth, maxDimensions[ABI16_0_0YGDimensionWidth]);
ABI16_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI16_0_0YGValue, MaxHeight, maxHeight, maxDimensions[ABI16_0_0YGDimensionHeight]);

// Yoga specific properties, not compatible with flexbox specification
ABI16_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, AspectRatio, aspectRatio, aspectRatio);

ABI16_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI16_0_0YGEdgeLeft]);
ABI16_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI16_0_0YGEdgeTop]);
ABI16_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI16_0_0YGEdgeRight]);
ABI16_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI16_0_0YGEdgeBottom]);
ABI16_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI16_0_0YGDimensionWidth]);
ABI16_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI16_0_0YGDimensionHeight]);
ABI16_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(ABI16_0_0YGDirection, Direction, direction);

ABI16_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin);
ABI16_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border);
ABI16_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding);

uint32_t gCurrentGenerationCount = 0;

bool ABI16_0_0YGLayoutNodeInternal(const ABI16_0_0YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const ABI16_0_0YGDirection parentDirection,
                          const ABI16_0_0YGMeasureMode widthMeasureMode,
                          const ABI16_0_0YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason,
                          const ABI16_0_0YGConfigRef config);

inline bool ABI16_0_0YGFloatIsUndefined(const float value) {
  return isnan(value);
}

static inline bool ABI16_0_0YGValueEqual(const ABI16_0_0YGValue a, const ABI16_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI16_0_0YGUnitUndefined) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

static inline void ABI16_0_0YGResolveDimensions(ABI16_0_0YGNodeRef node) {
  for (ABI16_0_0YGDimension dim = ABI16_0_0YGDimensionWidth; dim <= ABI16_0_0YGDimensionHeight; dim++) {
    if (node->style.maxDimensions[dim].unit != ABI16_0_0YGUnitUndefined &&
        ABI16_0_0YGValueEqual(node->style.maxDimensions[dim], node->style.minDimensions[dim])) {
      node->resolvedDimensions[dim] = &node->style.maxDimensions[dim];
    } else {
      node->resolvedDimensions[dim] = &node->style.dimensions[dim];
    }
  }
}

static inline bool ABI16_0_0YGFloatsEqual(const float a, const float b) {
  if (ABI16_0_0YGFloatIsUndefined(a)) {
    return ABI16_0_0YGFloatIsUndefined(b);
  }
  return fabs(a - b) < 0.0001f;
}

static void ABI16_0_0YGIndent(const uint32_t n) {
  for (uint32_t i = 0; i < n; i++) {
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "  ");
  }
}

static void ABI16_0_0YGPrintNumberIfNotZero(const char *str, const ABI16_0_0YGValue *const number) {
  if (!ABI16_0_0YGFloatsEqual(number->value, 0)) {
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug,
          "%s: %g%s, ",
          str,
          number->value,
          number->unit == ABI16_0_0YGUnitPoint ? "pt" : "%");
  }
}

static void ABI16_0_0YGPrintNumberIfNotUndefinedf(const char *str, const float number) {
  if (!ABI16_0_0YGFloatIsUndefined(number)) {
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "%s: %g, ", str, number);
  }
}

static void ABI16_0_0YGPrintNumberIfNotUndefined(const char *str, const ABI16_0_0YGValue *const number) {
  if (number->unit != ABI16_0_0YGUnitUndefined) {
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug,
          "%s: %g%s, ",
          str,
          number->value,
          number->unit == ABI16_0_0YGUnitPoint ? "pt" : "%");
  }
}

static bool ABI16_0_0YGFourValuesEqual(const ABI16_0_0YGValue four[4]) {
  return ABI16_0_0YGValueEqual(four[0], four[1]) && ABI16_0_0YGValueEqual(four[0], four[2]) &&
         ABI16_0_0YGValueEqual(four[0], four[3]);
}

static void ABI16_0_0YGNodePrintInternal(const ABI16_0_0YGNodeRef node,
                                const ABI16_0_0YGPrintOptions options,
                                const uint32_t level) {
  ABI16_0_0YGIndent(level);
  ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "{");

  if (node->print) {
    node->print(node);
  }

  if (options & ABI16_0_0YGPrintOptionsLayout) {
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "layout: {");
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "width: %g, ", node->layout.dimensions[ABI16_0_0YGDimensionWidth]);
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "height: %g, ", node->layout.dimensions[ABI16_0_0YGDimensionHeight]);
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "top: %g, ", node->layout.position[ABI16_0_0YGEdgeTop]);
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "left: %g", node->layout.position[ABI16_0_0YGEdgeLeft]);
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "}, ");
  }

  if (options & ABI16_0_0YGPrintOptionsStyle) {
    if (node->style.flexDirection == ABI16_0_0YGFlexDirectionColumn) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "flexDirection: 'column', ");
    } else if (node->style.flexDirection == ABI16_0_0YGFlexDirectionColumnReverse) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == ABI16_0_0YGFlexDirectionRow) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "flexDirection: 'row', ");
    } else if (node->style.flexDirection == ABI16_0_0YGFlexDirectionRowReverse) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == ABI16_0_0YGJustifyCenter) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "justifyContent: 'center', ");
    } else if (node->style.justifyContent == ABI16_0_0YGJustifyFlexEnd) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == ABI16_0_0YGJustifySpaceAround) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == ABI16_0_0YGJustifySpaceBetween) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == ABI16_0_0YGAlignCenter) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignItems: 'center', ");
    } else if (node->style.alignItems == ABI16_0_0YGAlignFlexEnd) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignItems: 'flex-end', ");
    } else if (node->style.alignItems == ABI16_0_0YGAlignStretch) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignItems: 'stretch', ");
    }

    if (node->style.alignContent == ABI16_0_0YGAlignCenter) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignContent: 'center', ");
    } else if (node->style.alignContent == ABI16_0_0YGAlignFlexEnd) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignContent: 'flex-end', ");
    } else if (node->style.alignContent == ABI16_0_0YGAlignStretch) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == ABI16_0_0YGAlignFlexStart) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == ABI16_0_0YGAlignCenter) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignSelf: 'center', ");
    } else if (node->style.alignSelf == ABI16_0_0YGAlignFlexEnd) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == ABI16_0_0YGAlignStretch) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "alignSelf: 'stretch', ");
    }

    ABI16_0_0YGPrintNumberIfNotUndefinedf("flexGrow", ABI16_0_0YGResolveFlexGrow(node));
    ABI16_0_0YGPrintNumberIfNotUndefinedf("flexShrink", ABI16_0_0YGNodeResolveFlexShrink(node));
    ABI16_0_0YGPrintNumberIfNotUndefined("flexBasis", ABI16_0_0YGNodeResolveFlexBasisPtr(node));

    if (node->style.overflow == ABI16_0_0YGOverflowHidden) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "overflow: 'hidden', ");
    } else if (node->style.overflow == ABI16_0_0YGOverflowVisible) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "overflow: 'visible', ");
    } else if (node->style.overflow == ABI16_0_0YGOverflowScroll) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "overflow: 'scroll', ");
    }

    if (ABI16_0_0YGFourValuesEqual(node->style.margin)) {
      ABI16_0_0YGPrintNumberIfNotZero("margin",
                             ABI16_0_0YGComputedEdgeValue(node->style.margin, ABI16_0_0YGEdgeLeft, &ABI16_0_0YGValueZero));
    } else {
      ABI16_0_0YGPrintNumberIfNotZero("marginLeft",
                             ABI16_0_0YGComputedEdgeValue(node->style.margin, ABI16_0_0YGEdgeLeft, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("marginRight",
                             ABI16_0_0YGComputedEdgeValue(node->style.margin, ABI16_0_0YGEdgeRight, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("marginTop",
                             ABI16_0_0YGComputedEdgeValue(node->style.margin, ABI16_0_0YGEdgeTop, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("marginBottom",
                             ABI16_0_0YGComputedEdgeValue(node->style.margin, ABI16_0_0YGEdgeBottom, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("marginStart",
                             ABI16_0_0YGComputedEdgeValue(node->style.margin, ABI16_0_0YGEdgeStart, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("marginEnd",
                             ABI16_0_0YGComputedEdgeValue(node->style.margin, ABI16_0_0YGEdgeEnd, &ABI16_0_0YGValueZero));
    }

    if (ABI16_0_0YGFourValuesEqual(node->style.padding)) {
      ABI16_0_0YGPrintNumberIfNotZero("padding",
                             ABI16_0_0YGComputedEdgeValue(node->style.padding, ABI16_0_0YGEdgeLeft, &ABI16_0_0YGValueZero));
    } else {
      ABI16_0_0YGPrintNumberIfNotZero("paddingLeft",
                             ABI16_0_0YGComputedEdgeValue(node->style.padding, ABI16_0_0YGEdgeLeft, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("paddingRight",
                             ABI16_0_0YGComputedEdgeValue(node->style.padding, ABI16_0_0YGEdgeRight, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("paddingTop",
                             ABI16_0_0YGComputedEdgeValue(node->style.padding, ABI16_0_0YGEdgeTop, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("paddingBottom",
                             ABI16_0_0YGComputedEdgeValue(node->style.padding, ABI16_0_0YGEdgeBottom, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("paddingStart",
                             ABI16_0_0YGComputedEdgeValue(node->style.padding, ABI16_0_0YGEdgeStart, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("paddingEnd",
                             ABI16_0_0YGComputedEdgeValue(node->style.padding, ABI16_0_0YGEdgeEnd, &ABI16_0_0YGValueZero));
    }

    if (ABI16_0_0YGFourValuesEqual(node->style.border)) {
      ABI16_0_0YGPrintNumberIfNotZero("borderWidth",
                             ABI16_0_0YGComputedEdgeValue(node->style.border, ABI16_0_0YGEdgeLeft, &ABI16_0_0YGValueZero));
    } else {
      ABI16_0_0YGPrintNumberIfNotZero("borderLeftWidth",
                             ABI16_0_0YGComputedEdgeValue(node->style.border, ABI16_0_0YGEdgeLeft, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("borderRightWidth",
                             ABI16_0_0YGComputedEdgeValue(node->style.border, ABI16_0_0YGEdgeRight, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("borderTopWidth",
                             ABI16_0_0YGComputedEdgeValue(node->style.border, ABI16_0_0YGEdgeTop, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("borderBottomWidth",
                             ABI16_0_0YGComputedEdgeValue(node->style.border, ABI16_0_0YGEdgeBottom, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("borderStartWidth",
                             ABI16_0_0YGComputedEdgeValue(node->style.border, ABI16_0_0YGEdgeStart, &ABI16_0_0YGValueZero));
      ABI16_0_0YGPrintNumberIfNotZero("borderEndWidth",
                             ABI16_0_0YGComputedEdgeValue(node->style.border, ABI16_0_0YGEdgeEnd, &ABI16_0_0YGValueZero));
    }

    ABI16_0_0YGPrintNumberIfNotUndefined("width", &node->style.dimensions[ABI16_0_0YGDimensionWidth]);
    ABI16_0_0YGPrintNumberIfNotUndefined("height", &node->style.dimensions[ABI16_0_0YGDimensionHeight]);
    ABI16_0_0YGPrintNumberIfNotUndefined("maxWidth", &node->style.maxDimensions[ABI16_0_0YGDimensionWidth]);
    ABI16_0_0YGPrintNumberIfNotUndefined("maxHeight", &node->style.maxDimensions[ABI16_0_0YGDimensionHeight]);
    ABI16_0_0YGPrintNumberIfNotUndefined("minWidth", &node->style.minDimensions[ABI16_0_0YGDimensionWidth]);
    ABI16_0_0YGPrintNumberIfNotUndefined("minHeight", &node->style.minDimensions[ABI16_0_0YGDimensionHeight]);

    if (node->style.positionType == ABI16_0_0YGPositionTypeAbsolute) {
      ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "position: 'absolute', ");
    }

    ABI16_0_0YGPrintNumberIfNotUndefined(
        "left", ABI16_0_0YGComputedEdgeValue(node->style.position, ABI16_0_0YGEdgeLeft, &ABI16_0_0YGValueUndefined));
    ABI16_0_0YGPrintNumberIfNotUndefined(
        "right", ABI16_0_0YGComputedEdgeValue(node->style.position, ABI16_0_0YGEdgeRight, &ABI16_0_0YGValueUndefined));
    ABI16_0_0YGPrintNumberIfNotUndefined(
        "top", ABI16_0_0YGComputedEdgeValue(node->style.position, ABI16_0_0YGEdgeTop, &ABI16_0_0YGValueUndefined));
    ABI16_0_0YGPrintNumberIfNotUndefined(
        "bottom", ABI16_0_0YGComputedEdgeValue(node->style.position, ABI16_0_0YGEdgeBottom, &ABI16_0_0YGValueUndefined));
  }

  const uint32_t childCount = ABI16_0_0YGNodeListCount(node->children);
  if (options & ABI16_0_0YGPrintOptionsChildren && childCount > 0) {
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "children: [\n");
    for (uint32_t i = 0; i < childCount; i++) {
      ABI16_0_0YGNodePrintInternal(ABI16_0_0YGNodeGetChild(node, i), options, level + 1);
    }
    ABI16_0_0YGIndent(level);
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "]},\n");
  } else {
    ABI16_0_0YGLog(ABI16_0_0YGLogLevelDebug, "},\n");
  }
}

void ABI16_0_0YGNodePrint(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGPrintOptions options) {
  ABI16_0_0YGNodePrintInternal(node, options, 0);
}

static const ABI16_0_0YGEdge leading[4] = {
        [ABI16_0_0YGFlexDirectionColumn] = ABI16_0_0YGEdgeTop,
        [ABI16_0_0YGFlexDirectionColumnReverse] = ABI16_0_0YGEdgeBottom,
        [ABI16_0_0YGFlexDirectionRow] = ABI16_0_0YGEdgeLeft,
        [ABI16_0_0YGFlexDirectionRowReverse] = ABI16_0_0YGEdgeRight,
};
static const ABI16_0_0YGEdge trailing[4] = {
        [ABI16_0_0YGFlexDirectionColumn] = ABI16_0_0YGEdgeBottom,
        [ABI16_0_0YGFlexDirectionColumnReverse] = ABI16_0_0YGEdgeTop,
        [ABI16_0_0YGFlexDirectionRow] = ABI16_0_0YGEdgeRight,
        [ABI16_0_0YGFlexDirectionRowReverse] = ABI16_0_0YGEdgeLeft,
};
static const ABI16_0_0YGEdge pos[4] = {
        [ABI16_0_0YGFlexDirectionColumn] = ABI16_0_0YGEdgeTop,
        [ABI16_0_0YGFlexDirectionColumnReverse] = ABI16_0_0YGEdgeBottom,
        [ABI16_0_0YGFlexDirectionRow] = ABI16_0_0YGEdgeLeft,
        [ABI16_0_0YGFlexDirectionRowReverse] = ABI16_0_0YGEdgeRight,
};
static const ABI16_0_0YGDimension dim[4] = {
        [ABI16_0_0YGFlexDirectionColumn] = ABI16_0_0YGDimensionHeight,
        [ABI16_0_0YGFlexDirectionColumnReverse] = ABI16_0_0YGDimensionHeight,
        [ABI16_0_0YGFlexDirectionRow] = ABI16_0_0YGDimensionWidth,
        [ABI16_0_0YGFlexDirectionRowReverse] = ABI16_0_0YGDimensionWidth,
};

static inline bool ABI16_0_0YGFlexDirectionIsRow(const ABI16_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI16_0_0YGFlexDirectionRow || flexDirection == ABI16_0_0YGFlexDirectionRowReverse;
}

static inline bool ABI16_0_0YGFlexDirectionIsColumn(const ABI16_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI16_0_0YGFlexDirectionColumn || flexDirection == ABI16_0_0YGFlexDirectionColumnReverse;
}

static inline float ABI16_0_0YGNodeLeadingMargin(const ABI16_0_0YGNodeRef node,
                                        const ABI16_0_0YGFlexDirection axis,
                                        const float widthSize) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI16_0_0YGEdgeStart].unit != ABI16_0_0YGUnitUndefined) {
    return ABI16_0_0YGValueResolveMargin(&node->style.margin[ABI16_0_0YGEdgeStart], widthSize);
  }

  return ABI16_0_0YGValueResolveMargin(ABI16_0_0YGComputedEdgeValue(node->style.margin, leading[axis], &ABI16_0_0YGValueZero),
                              widthSize);
}

static float ABI16_0_0YGNodeTrailingMargin(const ABI16_0_0YGNodeRef node,
                                  const ABI16_0_0YGFlexDirection axis,
                                  const float widthSize) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI16_0_0YGEdgeEnd].unit != ABI16_0_0YGUnitUndefined) {
    return ABI16_0_0YGValueResolveMargin(&node->style.margin[ABI16_0_0YGEdgeEnd], widthSize);
  }

  return ABI16_0_0YGValueResolveMargin(ABI16_0_0YGComputedEdgeValue(node->style.margin, trailing[axis], &ABI16_0_0YGValueZero),
                              widthSize);
}

static float ABI16_0_0YGNodeLeadingPadding(const ABI16_0_0YGNodeRef node,
                                  const ABI16_0_0YGFlexDirection axis,
                                  const float widthSize) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis) && node->style.padding[ABI16_0_0YGEdgeStart].unit != ABI16_0_0YGUnitUndefined &&
      ABI16_0_0YGValueResolve(&node->style.padding[ABI16_0_0YGEdgeStart], widthSize) >= 0.0f) {
    return ABI16_0_0YGValueResolve(&node->style.padding[ABI16_0_0YGEdgeStart], widthSize);
  }

  return fmaxf(ABI16_0_0YGValueResolve(ABI16_0_0YGComputedEdgeValue(node->style.padding, leading[axis], &ABI16_0_0YGValueZero),
                              widthSize),
               0.0f);
}

static float ABI16_0_0YGNodeTrailingPadding(const ABI16_0_0YGNodeRef node,
                                   const ABI16_0_0YGFlexDirection axis,
                                   const float widthSize) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis) && node->style.padding[ABI16_0_0YGEdgeEnd].unit != ABI16_0_0YGUnitUndefined &&
      ABI16_0_0YGValueResolve(&node->style.padding[ABI16_0_0YGEdgeEnd], widthSize) >= 0.0f) {
    return ABI16_0_0YGValueResolve(&node->style.padding[ABI16_0_0YGEdgeEnd], widthSize);
  }

  return fmaxf(ABI16_0_0YGValueResolve(ABI16_0_0YGComputedEdgeValue(node->style.padding, trailing[axis], &ABI16_0_0YGValueZero),
                              widthSize),
               0.0f);
}

static float ABI16_0_0YGNodeLeadingBorder(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGFlexDirection axis) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis) && node->style.border[ABI16_0_0YGEdgeStart].unit != ABI16_0_0YGUnitUndefined &&
      node->style.border[ABI16_0_0YGEdgeStart].value >= 0.0f) {
    return node->style.border[ABI16_0_0YGEdgeStart].value;
  }

  return fmaxf(ABI16_0_0YGComputedEdgeValue(node->style.border, leading[axis], &ABI16_0_0YGValueZero)->value, 0.0f);
}

static float ABI16_0_0YGNodeTrailingBorder(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGFlexDirection axis) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis) && node->style.border[ABI16_0_0YGEdgeEnd].unit != ABI16_0_0YGUnitUndefined &&
      node->style.border[ABI16_0_0YGEdgeEnd].value >= 0.0f) {
    return node->style.border[ABI16_0_0YGEdgeEnd].value;
  }

  return fmaxf(ABI16_0_0YGComputedEdgeValue(node->style.border, trailing[axis], &ABI16_0_0YGValueZero)->value, 0.0f);
}

static inline float ABI16_0_0YGNodeLeadingPaddingAndBorder(const ABI16_0_0YGNodeRef node,
                                                  const ABI16_0_0YGFlexDirection axis,
                                                  const float widthSize) {
  return ABI16_0_0YGNodeLeadingPadding(node, axis, widthSize) + ABI16_0_0YGNodeLeadingBorder(node, axis);
}

static inline float ABI16_0_0YGNodeTrailingPaddingAndBorder(const ABI16_0_0YGNodeRef node,
                                                   const ABI16_0_0YGFlexDirection axis,
                                                   const float widthSize) {
  return ABI16_0_0YGNodeTrailingPadding(node, axis, widthSize) + ABI16_0_0YGNodeTrailingBorder(node, axis);
}

static inline float ABI16_0_0YGNodeMarginForAxis(const ABI16_0_0YGNodeRef node,
                                        const ABI16_0_0YGFlexDirection axis,
                                        const float widthSize) {
  return ABI16_0_0YGNodeLeadingMargin(node, axis, widthSize) + ABI16_0_0YGNodeTrailingMargin(node, axis, widthSize);
}

static inline float ABI16_0_0YGNodePaddingAndBorderForAxis(const ABI16_0_0YGNodeRef node,
                                                  const ABI16_0_0YGFlexDirection axis,
                                                  const float widthSize) {
  return ABI16_0_0YGNodeLeadingPaddingAndBorder(node, axis, widthSize) +
         ABI16_0_0YGNodeTrailingPaddingAndBorder(node, axis, widthSize);
}

static inline ABI16_0_0YGAlign ABI16_0_0YGNodeAlignItem(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGNodeRef child) {
  const ABI16_0_0YGAlign align =
      child->style.alignSelf == ABI16_0_0YGAlignAuto ? node->style.alignItems : child->style.alignSelf;
  if (align == ABI16_0_0YGAlignBaseline && ABI16_0_0YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return ABI16_0_0YGAlignFlexStart;
  }
  return align;
}

static inline ABI16_0_0YGDirection ABI16_0_0YGNodeResolveDirection(const ABI16_0_0YGNodeRef node,
                                                 const ABI16_0_0YGDirection parentDirection) {
  if (node->style.direction == ABI16_0_0YGDirectionInherit) {
    return parentDirection > ABI16_0_0YGDirectionInherit ? parentDirection : ABI16_0_0YGDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static float ABI16_0_0YGBaseline(const ABI16_0_0YGNodeRef node) {
  if (node->baseline != NULL) {
    const float baseline = node->baseline(node,
                                          node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth],
                                          node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight]);
    ABI16_0_0YG_ASSERT(!ABI16_0_0YGFloatIsUndefined(baseline), "Expect custom baseline function to not return NaN")
    return baseline;
  }

  ABI16_0_0YGNodeRef baselineChild = NULL;
  const uint32_t childCount = ABI16_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeGetChild(node, i);
    if (child->lineIndex > 0) {
      break;
    }
    if (child->style.positionType == ABI16_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (ABI16_0_0YGNodeAlignItem(node, child) == ABI16_0_0YGAlignBaseline) {
      baselineChild = child;
      break;
    }

    if (baselineChild == NULL) {
      baselineChild = child;
    }
  }

  if (baselineChild == NULL) {
    return node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight];
  }

  const float baseline = ABI16_0_0YGBaseline(baselineChild);
  return baseline + baselineChild->layout.position[ABI16_0_0YGEdgeTop];
}

static inline ABI16_0_0YGFlexDirection ABI16_0_0YGFlexDirectionResolve(const ABI16_0_0YGFlexDirection flexDirection,
                                                     const ABI16_0_0YGDirection direction) {
  if (direction == ABI16_0_0YGDirectionRTL) {
    if (flexDirection == ABI16_0_0YGFlexDirectionRow) {
      return ABI16_0_0YGFlexDirectionRowReverse;
    } else if (flexDirection == ABI16_0_0YGFlexDirectionRowReverse) {
      return ABI16_0_0YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static ABI16_0_0YGFlexDirection ABI16_0_0YGFlexDirectionCross(const ABI16_0_0YGFlexDirection flexDirection,
                                            const ABI16_0_0YGDirection direction) {
  return ABI16_0_0YGFlexDirectionIsColumn(flexDirection)
             ? ABI16_0_0YGFlexDirectionResolve(ABI16_0_0YGFlexDirectionRow, direction)
             : ABI16_0_0YGFlexDirectionColumn;
}

static inline bool ABI16_0_0YGNodeIsFlex(const ABI16_0_0YGNodeRef node) {
  return (node->style.positionType == ABI16_0_0YGPositionTypeRelative &&
          (ABI16_0_0YGResolveFlexGrow(node) != 0 || ABI16_0_0YGNodeResolveFlexShrink(node) != 0));
}

static bool ABI16_0_0YGIsBaselineLayout(const ABI16_0_0YGNodeRef node) {
  if (ABI16_0_0YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return false;
  }
  if (node->style.alignItems == ABI16_0_0YGAlignBaseline) {
    return true;
  }
  const uint32_t childCount = ABI16_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeGetChild(node, i);
    if (child->style.positionType == ABI16_0_0YGPositionTypeRelative &&
        child->style.alignSelf == ABI16_0_0YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float ABI16_0_0YGNodeDimWithMargin(const ABI16_0_0YGNodeRef node,
                                        const ABI16_0_0YGFlexDirection axis,
                                        const float widthSize) {
  return node->layout.measuredDimensions[dim[axis]] + ABI16_0_0YGNodeLeadingMargin(node, axis, widthSize) +
         ABI16_0_0YGNodeTrailingMargin(node, axis, widthSize);
}

static inline bool ABI16_0_0YGNodeIsStyleDimDefined(const ABI16_0_0YGNodeRef node,
                                           const ABI16_0_0YGFlexDirection axis,
                                           const float parentSize) {
  return !(node->resolvedDimensions[dim[axis]]->unit == ABI16_0_0YGUnitAuto ||
           node->resolvedDimensions[dim[axis]]->unit == ABI16_0_0YGUnitUndefined ||
           (node->resolvedDimensions[dim[axis]]->unit == ABI16_0_0YGUnitPoint &&
            node->resolvedDimensions[dim[axis]]->value < 0.0f) ||
           (node->resolvedDimensions[dim[axis]]->unit == ABI16_0_0YGUnitPercent &&
            (node->resolvedDimensions[dim[axis]]->value < 0.0f || ABI16_0_0YGFloatIsUndefined(parentSize))));
}

static inline bool ABI16_0_0YGNodeIsLayoutDimDefined(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !ABI16_0_0YGFloatIsUndefined(value) && value >= 0.0f;
}

static inline bool ABI16_0_0YGNodeIsLeadingPosDefined(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGFlexDirection axis) {
  return (ABI16_0_0YGFlexDirectionIsRow(axis) &&
          ABI16_0_0YGComputedEdgeValue(node->style.position, ABI16_0_0YGEdgeStart, &ABI16_0_0YGValueUndefined)->unit !=
              ABI16_0_0YGUnitUndefined) ||
         ABI16_0_0YGComputedEdgeValue(node->style.position, leading[axis], &ABI16_0_0YGValueUndefined)->unit !=
             ABI16_0_0YGUnitUndefined;
}

static inline bool ABI16_0_0YGNodeIsTrailingPosDefined(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGFlexDirection axis) {
  return (ABI16_0_0YGFlexDirectionIsRow(axis) &&
          ABI16_0_0YGComputedEdgeValue(node->style.position, ABI16_0_0YGEdgeEnd, &ABI16_0_0YGValueUndefined)->unit !=
              ABI16_0_0YGUnitUndefined) ||
         ABI16_0_0YGComputedEdgeValue(node->style.position, trailing[axis], &ABI16_0_0YGValueUndefined)->unit !=
             ABI16_0_0YGUnitUndefined;
}

static float ABI16_0_0YGNodeLeadingPosition(const ABI16_0_0YGNodeRef node,
                                   const ABI16_0_0YGFlexDirection axis,
                                   const float axisSize) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis)) {
    const ABI16_0_0YGValue *leadingPosition =
        ABI16_0_0YGComputedEdgeValue(node->style.position, ABI16_0_0YGEdgeStart, &ABI16_0_0YGValueUndefined);
    if (leadingPosition->unit != ABI16_0_0YGUnitUndefined) {
      return ABI16_0_0YGValueResolve(leadingPosition, axisSize);
    }
  }

  const ABI16_0_0YGValue *leadingPosition =
      ABI16_0_0YGComputedEdgeValue(node->style.position, leading[axis], &ABI16_0_0YGValueUndefined);

  return leadingPosition->unit == ABI16_0_0YGUnitUndefined ? 0.0f
                                                  : ABI16_0_0YGValueResolve(leadingPosition, axisSize);
}

static float ABI16_0_0YGNodeTrailingPosition(const ABI16_0_0YGNodeRef node,
                                    const ABI16_0_0YGFlexDirection axis,
                                    const float axisSize) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis)) {
    const ABI16_0_0YGValue *trailingPosition =
        ABI16_0_0YGComputedEdgeValue(node->style.position, ABI16_0_0YGEdgeEnd, &ABI16_0_0YGValueUndefined);
    if (trailingPosition->unit != ABI16_0_0YGUnitUndefined) {
      return ABI16_0_0YGValueResolve(trailingPosition, axisSize);
    }
  }

  const ABI16_0_0YGValue *trailingPosition =
      ABI16_0_0YGComputedEdgeValue(node->style.position, trailing[axis], &ABI16_0_0YGValueUndefined);

  return trailingPosition->unit == ABI16_0_0YGUnitUndefined ? 0.0f
                                                   : ABI16_0_0YGValueResolve(trailingPosition, axisSize);
}

static float ABI16_0_0YGNodeBoundAxisWithinMinAndMax(const ABI16_0_0YGNodeRef node,
                                            const ABI16_0_0YGFlexDirection axis,
                                            const float value,
                                            const float axisSize) {
  float min = ABI16_0_0YGUndefined;
  float max = ABI16_0_0YGUndefined;

  if (ABI16_0_0YGFlexDirectionIsColumn(axis)) {
    min = ABI16_0_0YGValueResolve(&node->style.minDimensions[ABI16_0_0YGDimensionHeight], axisSize);
    max = ABI16_0_0YGValueResolve(&node->style.maxDimensions[ABI16_0_0YGDimensionHeight], axisSize);
  } else if (ABI16_0_0YGFlexDirectionIsRow(axis)) {
    min = ABI16_0_0YGValueResolve(&node->style.minDimensions[ABI16_0_0YGDimensionWidth], axisSize);
    max = ABI16_0_0YGValueResolve(&node->style.maxDimensions[ABI16_0_0YGDimensionWidth], axisSize);
  }

  float boundValue = value;

  if (!ABI16_0_0YGFloatIsUndefined(max) && max >= 0.0f && boundValue > max) {
    boundValue = max;
  }

  if (!ABI16_0_0YGFloatIsUndefined(min) && min >= 0.0f && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

static inline ABI16_0_0YGValue *ABI16_0_0YGMarginLeadingValue(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGFlexDirection axis) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI16_0_0YGEdgeStart].unit != ABI16_0_0YGUnitUndefined) {
    return &node->style.margin[ABI16_0_0YGEdgeStart];
  } else {
    return &node->style.margin[leading[axis]];
  }
}

static inline ABI16_0_0YGValue *ABI16_0_0YGMarginTrailingValue(const ABI16_0_0YGNodeRef node, const ABI16_0_0YGFlexDirection axis) {
  if (ABI16_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI16_0_0YGEdgeEnd].unit != ABI16_0_0YGUnitUndefined) {
    return &node->style.margin[ABI16_0_0YGEdgeEnd];
  } else {
    return &node->style.margin[trailing[axis]];
  }
}

// Like ABI16_0_0YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static inline float ABI16_0_0YGNodeBoundAxis(const ABI16_0_0YGNodeRef node,
                                    const ABI16_0_0YGFlexDirection axis,
                                    const float value,
                                    const float axisSize,
                                    const float widthSize) {
  return fmaxf(ABI16_0_0YGNodeBoundAxisWithinMinAndMax(node, axis, value, axisSize),
               ABI16_0_0YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void ABI16_0_0YGNodeSetChildTrailingPosition(const ABI16_0_0YGNodeRef node,
                                           const ABI16_0_0YGNodeRef child,
                                           const ABI16_0_0YGFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float ABI16_0_0YGNodeRelativePosition(const ABI16_0_0YGNodeRef node,
                                    const ABI16_0_0YGFlexDirection axis,
                                    const float axisSize) {
  return ABI16_0_0YGNodeIsLeadingPosDefined(node, axis) ? ABI16_0_0YGNodeLeadingPosition(node, axis, axisSize)
                                               : -ABI16_0_0YGNodeTrailingPosition(node, axis, axisSize);
}

static void ABI16_0_0YGConstrainMaxSizeForMode(const float maxSize, ABI16_0_0YGMeasureMode *mode, float *size) {
  switch (*mode) {
    case ABI16_0_0YGMeasureModeExactly:
    case ABI16_0_0YGMeasureModeAtMost:
      *size = (ABI16_0_0YGFloatIsUndefined(maxSize) || *size < maxSize) ? *size : maxSize;
      break;
    case ABI16_0_0YGMeasureModeUndefined:
      if (!ABI16_0_0YGFloatIsUndefined(maxSize)) {
        *mode = ABI16_0_0YGMeasureModeAtMost;
        *size = maxSize;
      }
      break;
  }
}

static void ABI16_0_0YGNodeSetPosition(const ABI16_0_0YGNodeRef node,
                              const ABI16_0_0YGDirection direction,
                              const float mainSize,
                              const float crossSize,
                              const float parentWidth) {
  const ABI16_0_0YGFlexDirection mainAxis = ABI16_0_0YGFlexDirectionResolve(node->style.flexDirection, direction);
  const ABI16_0_0YGFlexDirection crossAxis = ABI16_0_0YGFlexDirectionCross(mainAxis, direction);
  const float relativePositionMain = ABI16_0_0YGNodeRelativePosition(node, mainAxis, mainSize);
  const float relativePositionCross = ABI16_0_0YGNodeRelativePosition(node, crossAxis, crossSize);

  node->layout.position[leading[mainAxis]] =
      ABI16_0_0YGNodeLeadingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[trailing[mainAxis]] =
      ABI16_0_0YGNodeTrailingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[leading[crossAxis]] =
      ABI16_0_0YGNodeLeadingMargin(node, crossAxis, parentWidth) + relativePositionCross;
  node->layout.position[trailing[crossAxis]] =
      ABI16_0_0YGNodeTrailingMargin(node, crossAxis, parentWidth) + relativePositionCross;
}

static void ABI16_0_0YGNodeComputeFlexBasisForChild(const ABI16_0_0YGNodeRef node,
                                           const ABI16_0_0YGNodeRef child,
                                           const float width,
                                           const ABI16_0_0YGMeasureMode widthMode,
                                           const float height,
                                           const float parentWidth,
                                           const float parentHeight,
                                           const ABI16_0_0YGMeasureMode heightMode,
                                           const ABI16_0_0YGDirection direction,
                                           const ABI16_0_0YGConfigRef config) {
  const ABI16_0_0YGFlexDirection mainAxis = ABI16_0_0YGFlexDirectionResolve(node->style.flexDirection, direction);
  const bool isMainAxisRow = ABI16_0_0YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;

  float childWidth;
  float childHeight;
  ABI16_0_0YGMeasureMode childWidthMeasureMode;
  ABI16_0_0YGMeasureMode childHeightMeasureMode;

  const float resolvedFlexBasis =
      ABI16_0_0YGValueResolve(ABI16_0_0YGNodeResolveFlexBasisPtr(child), mainAxisParentSize);
  const bool isRowStyleDimDefined = ABI16_0_0YGNodeIsStyleDimDefined(child, ABI16_0_0YGFlexDirectionRow, parentWidth);
  const bool isColumnStyleDimDefined =
      ABI16_0_0YGNodeIsStyleDimDefined(child, ABI16_0_0YGFlexDirectionColumn, parentHeight);

  if (!ABI16_0_0YGFloatIsUndefined(resolvedFlexBasis) && !ABI16_0_0YGFloatIsUndefined(mainAxisSize)) {
    if (ABI16_0_0YGFloatIsUndefined(child->layout.computedFlexBasis) ||
        (ABI16_0_0YGConfigIsExperimentalFeatureEnabled(config, ABI16_0_0YGExperimentalFeatureWebFlexBasis) &&
         child->layout.computedFlexBasisGeneration != gCurrentGenerationCount)) {
      child->layout.computedFlexBasis =
          fmaxf(resolvedFlexBasis, ABI16_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(ABI16_0_0YGValueResolve(child->resolvedDimensions[ABI16_0_0YGDimensionWidth], parentWidth),
              ABI16_0_0YGNodePaddingAndBorderForAxis(child, ABI16_0_0YGFlexDirectionRow, parentWidth));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(ABI16_0_0YGValueResolve(child->resolvedDimensions[ABI16_0_0YGDimensionHeight], parentHeight),
              ABI16_0_0YGNodePaddingAndBorderForAxis(child, ABI16_0_0YGFlexDirectionColumn, parentWidth));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = ABI16_0_0YGUndefined;
    childHeight = ABI16_0_0YGUndefined;
    childWidthMeasureMode = ABI16_0_0YGMeasureModeUndefined;
    childHeightMeasureMode = ABI16_0_0YGMeasureModeUndefined;

    const float marginRow = ABI16_0_0YGNodeMarginForAxis(child, ABI16_0_0YGFlexDirectionRow, parentWidth);
    const float marginColumn = ABI16_0_0YGNodeMarginForAxis(child, ABI16_0_0YGFlexDirectionColumn, parentWidth);

    if (isRowStyleDimDefined) {
      childWidth =
          ABI16_0_0YGValueResolve(child->resolvedDimensions[ABI16_0_0YGDimensionWidth], parentWidth) + marginRow;
      childWidthMeasureMode = ABI16_0_0YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          ABI16_0_0YGValueResolve(child->resolvedDimensions[ABI16_0_0YGDimensionHeight], parentHeight) + marginColumn;
      childHeightMeasureMode = ABI16_0_0YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->style.overflow == ABI16_0_0YGOverflowScroll) ||
        node->style.overflow != ABI16_0_0YGOverflowScroll) {
      if (ABI16_0_0YGFloatIsUndefined(childWidth) && !ABI16_0_0YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = ABI16_0_0YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->style.overflow == ABI16_0_0YGOverflowScroll) ||
        node->style.overflow != ABI16_0_0YGOverflowScroll) {
      if (ABI16_0_0YGFloatIsUndefined(childHeight) && !ABI16_0_0YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = ABI16_0_0YGMeasureModeAtMost;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width
    if (!isMainAxisRow && !ABI16_0_0YGFloatIsUndefined(width) && !isRowStyleDimDefined &&
        widthMode == ABI16_0_0YGMeasureModeExactly && ABI16_0_0YGNodeAlignItem(node, child) == ABI16_0_0YGAlignStretch) {
      childWidth = width;
      childWidthMeasureMode = ABI16_0_0YGMeasureModeExactly;
    }
    if (isMainAxisRow && !ABI16_0_0YGFloatIsUndefined(height) && !isColumnStyleDimDefined &&
        heightMode == ABI16_0_0YGMeasureModeExactly && ABI16_0_0YGNodeAlignItem(node, child) == ABI16_0_0YGAlignStretch) {
      childHeight = height;
      childHeightMeasureMode = ABI16_0_0YGMeasureModeExactly;
    }

    if (!ABI16_0_0YGFloatIsUndefined(child->style.aspectRatio)) {
      if (!isMainAxisRow && childWidthMeasureMode == ABI16_0_0YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf((childWidth - marginRow) / child->style.aspectRatio,
                  ABI16_0_0YGNodePaddingAndBorderForAxis(child, ABI16_0_0YGFlexDirectionColumn, parentWidth));
        return;
      } else if (isMainAxisRow && childHeightMeasureMode == ABI16_0_0YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf((childHeight - marginColumn) * child->style.aspectRatio,
                  ABI16_0_0YGNodePaddingAndBorderForAxis(child, ABI16_0_0YGFlexDirectionRow, parentWidth));
        return;
      }
    }

    ABI16_0_0YGConstrainMaxSizeForMode(ABI16_0_0YGValueResolve(&child->style.maxDimensions[ABI16_0_0YGDimensionWidth],
                                             parentWidth),
                              &childWidthMeasureMode,
                              &childWidth);
    ABI16_0_0YGConstrainMaxSizeForMode(ABI16_0_0YGValueResolve(&child->style.maxDimensions[ABI16_0_0YGDimensionHeight],
                                             parentHeight),
                              &childHeightMeasureMode,
                              &childHeight);

    // Measure the child
    ABI16_0_0YGLayoutNodeInternal(child,
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
              ABI16_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
  }

  child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
}

static void ABI16_0_0YGNodeAbsoluteLayoutChild(const ABI16_0_0YGNodeRef node,
                                      const ABI16_0_0YGNodeRef child,
                                      const float width,
                                      const ABI16_0_0YGMeasureMode widthMode,
                                      const float height,
                                      const ABI16_0_0YGDirection direction,
                                      const ABI16_0_0YGConfigRef config) {
  const ABI16_0_0YGFlexDirection mainAxis = ABI16_0_0YGFlexDirectionResolve(node->style.flexDirection, direction);
  const ABI16_0_0YGFlexDirection crossAxis = ABI16_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI16_0_0YGFlexDirectionIsRow(mainAxis);

  float childWidth = ABI16_0_0YGUndefined;
  float childHeight = ABI16_0_0YGUndefined;
  ABI16_0_0YGMeasureMode childWidthMeasureMode = ABI16_0_0YGMeasureModeUndefined;
  ABI16_0_0YGMeasureMode childHeightMeasureMode = ABI16_0_0YGMeasureModeUndefined;

  const float marginRow = ABI16_0_0YGNodeMarginForAxis(child, ABI16_0_0YGFlexDirectionRow, width);
  const float marginColumn = ABI16_0_0YGNodeMarginForAxis(child, ABI16_0_0YGFlexDirectionColumn, width);

  if (ABI16_0_0YGNodeIsStyleDimDefined(child, ABI16_0_0YGFlexDirectionRow, width)) {
    childWidth = ABI16_0_0YGValueResolve(child->resolvedDimensions[ABI16_0_0YGDimensionWidth], width) + marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (ABI16_0_0YGNodeIsLeadingPosDefined(child, ABI16_0_0YGFlexDirectionRow) &&
        ABI16_0_0YGNodeIsTrailingPosDefined(child, ABI16_0_0YGFlexDirectionRow)) {
      childWidth = node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] -
                   (ABI16_0_0YGNodeLeadingBorder(node, ABI16_0_0YGFlexDirectionRow) +
                    ABI16_0_0YGNodeTrailingBorder(node, ABI16_0_0YGFlexDirectionRow)) -
                   (ABI16_0_0YGNodeLeadingPosition(child, ABI16_0_0YGFlexDirectionRow, width) +
                    ABI16_0_0YGNodeTrailingPosition(child, ABI16_0_0YGFlexDirectionRow, width));
      childWidth = ABI16_0_0YGNodeBoundAxis(child, ABI16_0_0YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (ABI16_0_0YGNodeIsStyleDimDefined(child, ABI16_0_0YGFlexDirectionColumn, height)) {
    childHeight =
        ABI16_0_0YGValueResolve(child->resolvedDimensions[ABI16_0_0YGDimensionHeight], height) + marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (ABI16_0_0YGNodeIsLeadingPosDefined(child, ABI16_0_0YGFlexDirectionColumn) &&
        ABI16_0_0YGNodeIsTrailingPosDefined(child, ABI16_0_0YGFlexDirectionColumn)) {
      childHeight = node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] -
                    (ABI16_0_0YGNodeLeadingBorder(node, ABI16_0_0YGFlexDirectionColumn) +
                     ABI16_0_0YGNodeTrailingBorder(node, ABI16_0_0YGFlexDirectionColumn)) -
                    (ABI16_0_0YGNodeLeadingPosition(child, ABI16_0_0YGFlexDirectionColumn, height) +
                     ABI16_0_0YGNodeTrailingPosition(child, ABI16_0_0YGFlexDirectionColumn, height));
      childHeight = ABI16_0_0YGNodeBoundAxis(child, ABI16_0_0YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (ABI16_0_0YGFloatIsUndefined(childWidth) ^ ABI16_0_0YGFloatIsUndefined(childHeight)) {
    if (!ABI16_0_0YGFloatIsUndefined(child->style.aspectRatio)) {
      if (ABI16_0_0YGFloatIsUndefined(childWidth)) {
        childWidth =
            marginRow + fmaxf((childHeight - marginColumn) * child->style.aspectRatio,
                              ABI16_0_0YGNodePaddingAndBorderForAxis(child, ABI16_0_0YGFlexDirectionColumn, width));
      } else if (ABI16_0_0YGFloatIsUndefined(childHeight)) {
        childHeight =
            marginColumn + fmaxf((childWidth - marginRow) / child->style.aspectRatio,
                                 ABI16_0_0YGNodePaddingAndBorderForAxis(child, ABI16_0_0YGFlexDirectionRow, width));
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (ABI16_0_0YGFloatIsUndefined(childWidth) || ABI16_0_0YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode =
        ABI16_0_0YGFloatIsUndefined(childWidth) ? ABI16_0_0YGMeasureModeUndefined : ABI16_0_0YGMeasureModeExactly;
    childHeightMeasureMode =
        ABI16_0_0YGFloatIsUndefined(childHeight) ? ABI16_0_0YGMeasureModeUndefined : ABI16_0_0YGMeasureModeExactly;

    // If the size of the parent is defined then try to constrain the absolute child to that size
    // as well. This allows text within the absolute child to wrap to the size of its parent.
    // This is the same behavior as many browsers implement.
    if (!isMainAxisRow && ABI16_0_0YGFloatIsUndefined(childWidth) && widthMode != ABI16_0_0YGMeasureModeUndefined &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = ABI16_0_0YGMeasureModeAtMost;
    }

    ABI16_0_0YGLayoutNodeInternal(child,
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
    childWidth = child->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] +
                 ABI16_0_0YGNodeMarginForAxis(child, ABI16_0_0YGFlexDirectionRow, width);
    childHeight = child->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] +
                  ABI16_0_0YGNodeMarginForAxis(child, ABI16_0_0YGFlexDirectionColumn, width);
  }

  ABI16_0_0YGLayoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       ABI16_0_0YGMeasureModeExactly,
                       ABI16_0_0YGMeasureModeExactly,
                       childWidth,
                       childHeight,
                       true,
                       "abs-layout",
                       config);

  if (ABI16_0_0YGNodeIsTrailingPosDefined(child, mainAxis) && !ABI16_0_0YGNodeIsLeadingPosDefined(child, mainAxis)) {
    child->layout.position[leading[mainAxis]] = node->layout.measuredDimensions[dim[mainAxis]] -
                                                child->layout.measuredDimensions[dim[mainAxis]] -
                                                ABI16_0_0YGNodeTrailingBorder(node, mainAxis) -
                                                ABI16_0_0YGNodeTrailingPosition(child, mainAxis, width);
  } else if (!ABI16_0_0YGNodeIsLeadingPosDefined(child, mainAxis) &&
             node->style.justifyContent == ABI16_0_0YGJustifyCenter) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]) /
                                                2.0f;
  } else if (!ABI16_0_0YGNodeIsLeadingPosDefined(child, mainAxis) &&
             node->style.justifyContent == ABI16_0_0YGJustifyFlexEnd) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]);
  }

  if (ABI16_0_0YGNodeIsTrailingPosDefined(child, crossAxis) &&
      !ABI16_0_0YGNodeIsLeadingPosDefined(child, crossAxis)) {
    child->layout.position[leading[crossAxis]] = node->layout.measuredDimensions[dim[crossAxis]] -
                                                 child->layout.measuredDimensions[dim[crossAxis]] -
                                                 ABI16_0_0YGNodeTrailingBorder(node, crossAxis) -
                                                 ABI16_0_0YGNodeTrailingPosition(child, crossAxis, width);
  } else if (!ABI16_0_0YGNodeIsLeadingPosDefined(child, crossAxis) &&
             ABI16_0_0YGNodeAlignItem(node, child) == ABI16_0_0YGAlignCenter) {
    child->layout.position[leading[crossAxis]] =
        (node->layout.measuredDimensions[dim[crossAxis]] -
         child->layout.measuredDimensions[dim[crossAxis]]) /
        2.0f;
  } else if (!ABI16_0_0YGNodeIsLeadingPosDefined(child, crossAxis) &&
             ABI16_0_0YGNodeAlignItem(node, child) == ABI16_0_0YGAlignFlexEnd) {
    child->layout.position[leading[crossAxis]] = (node->layout.measuredDimensions[dim[crossAxis]] -
                                                  child->layout.measuredDimensions[dim[crossAxis]]);
  }
}

static void ABI16_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(const ABI16_0_0YGNodeRef node,
                                                       const float availableWidth,
                                                       const float availableHeight,
                                                       const ABI16_0_0YGMeasureMode widthMeasureMode,
                                                       const ABI16_0_0YGMeasureMode heightMeasureMode,
                                                       const float parentWidth,
                                                       const float parentHeight) {
  ABI16_0_0YG_ASSERT(node->measure, "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow =
      ABI16_0_0YGNodePaddingAndBorderForAxis(node, ABI16_0_0YGFlexDirectionRow, availableWidth);
  const float paddingAndBorderAxisColumn =
      ABI16_0_0YGNodePaddingAndBorderForAxis(node, ABI16_0_0YGFlexDirectionColumn, availableWidth);
  const float marginAxisRow = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionRow, availableWidth);
  const float marginAxisColumn = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionColumn, availableWidth);

  const float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

  if (widthMeasureMode == ABI16_0_0YGMeasureModeExactly && heightMeasureMode == ABI16_0_0YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] = ABI16_0_0YGNodeBoundAxis(
        node, ABI16_0_0YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
    node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] = ABI16_0_0YGNodeBoundAxis(
        node, ABI16_0_0YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);
  } else if (innerWidth <= 0.0f || innerHeight <= 0.0f) {
    // Don't bother sizing the text if there's no horizontal or vertical
    // space.
    node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] =
        ABI16_0_0YGNodeBoundAxis(node, ABI16_0_0YGFlexDirectionRow, 0.0f, availableWidth, availableWidth);
    node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] =
        ABI16_0_0YGNodeBoundAxis(node, ABI16_0_0YGFlexDirectionColumn, 0.0f, availableHeight, availableWidth);
  } else {
    // Measure the text under the current constraints.
    const ABI16_0_0YGSize measuredSize =
        node->measure(node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] =
        ABI16_0_0YGNodeBoundAxis(node,
                        ABI16_0_0YGFlexDirectionRow,
                        (widthMeasureMode == ABI16_0_0YGMeasureModeUndefined ||
                         widthMeasureMode == ABI16_0_0YGMeasureModeAtMost)
                            ? measuredSize.width + paddingAndBorderAxisRow
                            : availableWidth - marginAxisRow,
                        availableWidth,
                        availableWidth);
    node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] =
        ABI16_0_0YGNodeBoundAxis(node,
                        ABI16_0_0YGFlexDirectionColumn,
                        (heightMeasureMode == ABI16_0_0YGMeasureModeUndefined ||
                         heightMeasureMode == ABI16_0_0YGMeasureModeAtMost)
                            ? measuredSize.height + paddingAndBorderAxisColumn
                            : availableHeight - marginAxisColumn,
                        availableHeight,
                        availableWidth);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void ABI16_0_0YGNodeEmptyContainerSetMeasuredDimensions(const ABI16_0_0YGNodeRef node,
                                                      const float availableWidth,
                                                      const float availableHeight,
                                                      const ABI16_0_0YGMeasureMode widthMeasureMode,
                                                      const ABI16_0_0YGMeasureMode heightMeasureMode,
                                                      const float parentWidth,
                                                      const float parentHeight) {
  const float paddingAndBorderAxisRow =
      ABI16_0_0YGNodePaddingAndBorderForAxis(node, ABI16_0_0YGFlexDirectionRow, parentWidth);
  const float paddingAndBorderAxisColumn =
      ABI16_0_0YGNodePaddingAndBorderForAxis(node, ABI16_0_0YGFlexDirectionColumn, parentWidth);
  const float marginAxisRow = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionColumn, parentWidth);

  node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] =
      ABI16_0_0YGNodeBoundAxis(node,
                      ABI16_0_0YGFlexDirectionRow,
                      (widthMeasureMode == ABI16_0_0YGMeasureModeUndefined ||
                       widthMeasureMode == ABI16_0_0YGMeasureModeAtMost)
                          ? paddingAndBorderAxisRow
                          : availableWidth - marginAxisRow,
                      parentWidth,
                      parentWidth);
  node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] =
      ABI16_0_0YGNodeBoundAxis(node,
                      ABI16_0_0YGFlexDirectionColumn,
                      (heightMeasureMode == ABI16_0_0YGMeasureModeUndefined ||
                       heightMeasureMode == ABI16_0_0YGMeasureModeAtMost)
                          ? paddingAndBorderAxisColumn
                          : availableHeight - marginAxisColumn,
                      parentHeight,
                      parentWidth);
}

static bool ABI16_0_0YGNodeFixedSizeSetMeasuredDimensions(const ABI16_0_0YGNodeRef node,
                                                 const float availableWidth,
                                                 const float availableHeight,
                                                 const ABI16_0_0YGMeasureMode widthMeasureMode,
                                                 const ABI16_0_0YGMeasureMode heightMeasureMode,
                                                 const float parentWidth,
                                                 const float parentHeight) {
  if ((widthMeasureMode == ABI16_0_0YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (heightMeasureMode == ABI16_0_0YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == ABI16_0_0YGMeasureModeExactly && heightMeasureMode == ABI16_0_0YGMeasureModeExactly)) {
    const float marginAxisColumn = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionColumn, parentWidth);
    const float marginAxisRow = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionRow, parentWidth);

    node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] =
        ABI16_0_0YGNodeBoundAxis(node,
                        ABI16_0_0YGFlexDirectionRow,
                        ABI16_0_0YGFloatIsUndefined(availableWidth) ||
                                (widthMeasureMode == ABI16_0_0YGMeasureModeAtMost && availableWidth < 0.0f)
                            ? 0.0f
                            : availableWidth - marginAxisRow,
                        parentWidth,
                        parentWidth);

    node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] =
        ABI16_0_0YGNodeBoundAxis(node,
                        ABI16_0_0YGFlexDirectionColumn,
                        ABI16_0_0YGFloatIsUndefined(availableHeight) ||
                                (heightMeasureMode == ABI16_0_0YGMeasureModeAtMost && availableHeight < 0.0f)
                            ? 0.0f
                            : availableHeight - marginAxisColumn,
                        parentHeight,
                        parentWidth);

    return true;
  }

  return false;
}

static void ABI16_0_0YGZeroOutLayoutRecursivly(const ABI16_0_0YGNodeRef node) {
  node->layout.dimensions[ABI16_0_0YGDimensionHeight] = 0;
  node->layout.dimensions[ABI16_0_0YGDimensionWidth] = 0;
  node->layout.position[ABI16_0_0YGEdgeTop] = 0;
  node->layout.position[ABI16_0_0YGEdgeBottom] = 0;
  node->layout.position[ABI16_0_0YGEdgeLeft] = 0;
  node->layout.position[ABI16_0_0YGEdgeRight] = 0;
  const uint32_t childCount = ABI16_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, i);
    ABI16_0_0YGZeroOutLayoutRecursivly(child);
  }
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C ABI16_0_0YG documentation: https://www.w3.org/TR/ABI16_0_0YG3-flexbox/.
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
//      or ABI16_0_0YGUndefined if the size is not available; interpretation depends on
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
//    from the spec (https://www.w3.org/TR/ABI16_0_0YG3-sizing/#terms):
//      - ABI16_0_0YGMeasureModeUndefined: max content
//      - ABI16_0_0YGMeasureModeExactly: fill available
//      - ABI16_0_0YGMeasureModeAtMost: fit content
//
//    When calling ABI16_0_0YGNodelayoutImpl and ABI16_0_0YGLayoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of ABI16_0_0YGMeasureModeUndefined
//    in that dimension.
//
static void ABI16_0_0YGNodelayoutImpl(const ABI16_0_0YGNodeRef node,
                             const float availableWidth,
                             const float availableHeight,
                             const ABI16_0_0YGDirection parentDirection,
                             const ABI16_0_0YGMeasureMode widthMeasureMode,
                             const ABI16_0_0YGMeasureMode heightMeasureMode,
                             const float parentWidth,
                             const float parentHeight,
                             const bool performLayout,
                             const ABI16_0_0YGConfigRef config) {
  ABI16_0_0YG_ASSERT(ABI16_0_0YGFloatIsUndefined(availableWidth) ? widthMeasureMode == ABI16_0_0YGMeasureModeUndefined : true,
            "availableWidth is indefinite so widthMeasureMode must be "
            "ABI16_0_0YGMeasureModeUndefined");
  ABI16_0_0YG_ASSERT(ABI16_0_0YGFloatIsUndefined(availableHeight) ? heightMeasureMode == ABI16_0_0YGMeasureModeUndefined
                                                : true,
            "availableHeight is indefinite so heightMeasureMode must be "
            "ABI16_0_0YGMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const ABI16_0_0YGDirection direction = ABI16_0_0YGNodeResolveDirection(node, parentDirection);
  node->layout.direction = direction;

  const ABI16_0_0YGFlexDirection flexRowDirection = ABI16_0_0YGFlexDirectionResolve(ABI16_0_0YGFlexDirectionRow, direction);
  const ABI16_0_0YGFlexDirection flexColumnDirection =
      ABI16_0_0YGFlexDirectionResolve(ABI16_0_0YGFlexDirectionColumn, direction);

  node->layout.margin[ABI16_0_0YGEdgeStart] = ABI16_0_0YGNodeLeadingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[ABI16_0_0YGEdgeEnd] = ABI16_0_0YGNodeTrailingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[ABI16_0_0YGEdgeTop] = ABI16_0_0YGNodeLeadingMargin(node, flexColumnDirection, parentWidth);
  node->layout.margin[ABI16_0_0YGEdgeBottom] = ABI16_0_0YGNodeTrailingMargin(node, flexColumnDirection, parentWidth);

  node->layout.border[ABI16_0_0YGEdgeStart] = ABI16_0_0YGNodeLeadingBorder(node, flexRowDirection);
  node->layout.border[ABI16_0_0YGEdgeEnd] = ABI16_0_0YGNodeTrailingBorder(node, flexRowDirection);
  node->layout.border[ABI16_0_0YGEdgeTop] = ABI16_0_0YGNodeLeadingBorder(node, flexColumnDirection);
  node->layout.border[ABI16_0_0YGEdgeBottom] = ABI16_0_0YGNodeTrailingBorder(node, flexColumnDirection);

  node->layout.padding[ABI16_0_0YGEdgeStart] = ABI16_0_0YGNodeLeadingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[ABI16_0_0YGEdgeEnd] = ABI16_0_0YGNodeTrailingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[ABI16_0_0YGEdgeTop] = ABI16_0_0YGNodeLeadingPadding(node, flexColumnDirection, parentWidth);
  node->layout.padding[ABI16_0_0YGEdgeBottom] =
      ABI16_0_0YGNodeTrailingPadding(node, flexColumnDirection, parentWidth);

  if (node->measure) {
    ABI16_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(node,
                                               availableWidth,
                                               availableHeight,
                                               widthMeasureMode,
                                               heightMeasureMode,
                                               parentWidth,
                                               parentHeight);
    return;
  }

  const uint32_t childCount = ABI16_0_0YGNodeListCount(node->children);
  if (childCount == 0) {
    ABI16_0_0YGNodeEmptyContainerSetMeasuredDimensions(node,
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
  if (!performLayout && ABI16_0_0YGNodeFixedSizeSetMeasuredDimensions(node,
                                                             availableWidth,
                                                             availableHeight,
                                                             widthMeasureMode,
                                                             heightMeasureMode,
                                                             parentWidth,
                                                             parentHeight)) {
    return;
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const ABI16_0_0YGFlexDirection mainAxis = ABI16_0_0YGFlexDirectionResolve(node->style.flexDirection, direction);
  const ABI16_0_0YGFlexDirection crossAxis = ABI16_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI16_0_0YGFlexDirectionIsRow(mainAxis);
  const ABI16_0_0YGJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap != ABI16_0_0YGWrapNoWrap;

  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;
  const float crossAxisParentSize = isMainAxisRow ? parentHeight : parentWidth;

  ABI16_0_0YGNodeRef firstAbsoluteChild = NULL;
  ABI16_0_0YGNodeRef currentAbsoluteChild = NULL;

  const float leadingPaddingAndBorderMain =
      ABI16_0_0YGNodeLeadingPaddingAndBorder(node, mainAxis, parentWidth);
  const float trailingPaddingAndBorderMain =
      ABI16_0_0YGNodeTrailingPaddingAndBorder(node, mainAxis, parentWidth);
  const float leadingPaddingAndBorderCross =
      ABI16_0_0YGNodeLeadingPaddingAndBorder(node, crossAxis, parentWidth);
  const float paddingAndBorderAxisMain = ABI16_0_0YGNodePaddingAndBorderForAxis(node, mainAxis, parentWidth);
  const float paddingAndBorderAxisCross =
      ABI16_0_0YGNodePaddingAndBorderForAxis(node, crossAxis, parentWidth);

  ABI16_0_0YGMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  ABI16_0_0YGMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  const float marginAxisRow = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionColumn, parentWidth);

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  const float minInnerWidth =
      ABI16_0_0YGValueResolve(&node->style.minDimensions[ABI16_0_0YGDimensionWidth], parentWidth) - marginAxisRow -
      paddingAndBorderAxisRow;
  const float maxInnerWidth =
      ABI16_0_0YGValueResolve(&node->style.maxDimensions[ABI16_0_0YGDimensionWidth], parentWidth) - marginAxisRow -
      paddingAndBorderAxisRow;
  const float minInnerHeight =
      ABI16_0_0YGValueResolve(&node->style.minDimensions[ABI16_0_0YGDimensionHeight], parentHeight) -
      marginAxisColumn - paddingAndBorderAxisColumn;
  const float maxInnerHeight =
      ABI16_0_0YGValueResolve(&node->style.maxDimensions[ABI16_0_0YGDimensionHeight], parentHeight) -
      marginAxisColumn - paddingAndBorderAxisColumn;
  const float minInnerMainDim = isMainAxisRow ? minInnerWidth : minInnerHeight;
  const float maxInnerMainDim = isMainAxisRow ? maxInnerWidth : maxInnerHeight;

  // Max dimension overrides predefined dimension value; Min dimension in turn overrides both of the
  // above
  float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  if (!ABI16_0_0YGFloatIsUndefined(availableInnerWidth)) {
    // We want to make sure our available width does not violate min and max constraints
    availableInnerWidth = fmaxf(fminf(availableInnerWidth, maxInnerWidth), minInnerWidth);
  }

  float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  if (!ABI16_0_0YGFloatIsUndefined(availableInnerHeight)) {
    // We want to make sure our available height does not violate min and max constraints
    availableInnerHeight = fmaxf(fminf(availableInnerHeight, maxInnerHeight), minInnerHeight);
  }

  float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // If there is only one child with flexGrow + flexShrink it means we can set the
  // computedFlexBasis to 0 instead of measuring and shrinking / flexing the child to exactly
  // match the remaining space
  ABI16_0_0YGNodeRef singleFlexChild = NULL;
  if (measureModeMainDim == ABI16_0_0YGMeasureModeExactly) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeGetChild(node, i);
      if (singleFlexChild) {
        if (ABI16_0_0YGNodeIsFlex(child)) {
          // There is already a flexible child, abort.
          singleFlexChild = NULL;
          break;
        }
      } else if (ABI16_0_0YGResolveFlexGrow(child) > 0.0f && ABI16_0_0YGNodeResolveFlexShrink(child) > 0.0f) {
        singleFlexChild = child;
      }
    }
  }

  float totalFlexBasis = 0;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, i);
    if (child->style.display == ABI16_0_0YGDisplayNone) {
      ABI16_0_0YGZeroOutLayoutRecursivly(child);
      child->hasNewLayout = true;
      child->isDirty = false;
      continue;
    }
    ABI16_0_0YGResolveDimensions(child);
    if (performLayout) {
      // Set the initial position (relative to the parent).
      const ABI16_0_0YGDirection childDirection = ABI16_0_0YGNodeResolveDirection(child, direction);
      ABI16_0_0YGNodeSetPosition(child,
                        childDirection,
                        availableInnerMainDim,
                        availableInnerCrossDim,
                        availableInnerWidth);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == ABI16_0_0YGPositionTypeAbsolute) {
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
        ABI16_0_0YGNodeComputeFlexBasisForChild(node,
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
      measureModeMainDim == ABI16_0_0YGMeasureModeUndefined ? false : totalFlexBasis > availableInnerMainDim;
  if (isNodeFlexWrap && flexBasisOverflows && measureModeMainDim == ABI16_0_0YGMeasureModeAtMost) {
    measureModeMainDim = ABI16_0_0YGMeasureModeExactly;
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
    ABI16_0_0YGNodeRef firstRelativeChild = NULL;
    ABI16_0_0YGNodeRef currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    for (uint32_t i = startOfLineIndex; i < childCount; i++, endOfLineIndex++) {
      const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, i);
      if (child->style.display == ABI16_0_0YGDisplayNone) {
        continue;
      }
      child->lineIndex = lineCount;

      if (child->style.positionType != ABI16_0_0YGPositionTypeAbsolute) {
        const float outerFlexBasis =
            fmaxf(ABI16_0_0YGValueResolve(&child->style.minDimensions[dim[mainAxis]], mainAxisParentSize),
                  child->layout.computedFlexBasis) +
            ABI16_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);

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

        if (ABI16_0_0YGNodeIsFlex(child)) {
          totalFlexGrowFactors += ABI16_0_0YGResolveFlexGrow(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the
          // child
          // dimension.
          totalFlexShrinkScaledFactors +=
              -ABI16_0_0YGNodeResolveFlexShrink(child) * child->layout.computedFlexBasis;
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
    const bool canSkipFlex = !performLayout && measureModeCrossDim == ABI16_0_0YGMeasureModeExactly;

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
    if (measureModeMainDim != ABI16_0_0YGMeasureModeExactly) {
      if (!ABI16_0_0YGFloatIsUndefined(minInnerMainDim) && sizeConsumedOnCurrentLine < minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (!ABI16_0_0YGFloatIsUndefined(maxInnerMainDim) && sizeConsumedOnCurrentLine > maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else if (ABI16_0_0YGConfigIsExperimentalFeatureEnabled(config, ABI16_0_0YGExperimentalFeatureMinFlexFix)) {
        // TODO: this needs to be moved out of experimental feature, as this is legitimate fix
        // If the measurement isn't exact, we want to use as little space as possible
        availableInnerMainDim = sizeConsumedOnCurrentLine;
      }
    }

    float remainingFreeSpace = 0;
    if (!ABI16_0_0YGFloatIsUndefined(availableInnerMainDim)) {
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
      // spec (https://www.w3.org/TR/ABI16_0_0YG-flexbox-1/#resolve-flexible-lengths)
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
          flexShrinkScaledFactor = -ABI16_0_0YGNodeResolveFlexShrink(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize =
                childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = ABI16_0_0YGNodeBoundAxis(currentRelativeChild,
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
          flexGrowFactor = ABI16_0_0YGResolveFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize =
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = ABI16_0_0YGNodeBoundAxis(currentRelativeChild,
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
          flexShrinkScaledFactor = -ABI16_0_0YGNodeResolveFlexShrink(currentRelativeChild) * childFlexBasis;
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

            updatedMainSize = ABI16_0_0YGNodeBoundAxis(currentRelativeChild,
                                              mainAxis,
                                              childSize,
                                              availableInnerMainDim,
                                              availableInnerWidth);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = ABI16_0_0YGResolveFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize =
                ABI16_0_0YGNodeBoundAxis(currentRelativeChild,
                                mainAxis,
                                childFlexBasis +
                                    remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor,
                                availableInnerMainDim,
                                availableInnerWidth);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        const float marginMain =
            ABI16_0_0YGNodeMarginForAxis(currentRelativeChild, mainAxis, availableInnerWidth);
        const float marginCross =
            ABI16_0_0YGNodeMarginForAxis(currentRelativeChild, crossAxis, availableInnerWidth);

        float childCrossSize;
        float childMainSize = updatedMainSize + marginMain;
        ABI16_0_0YGMeasureMode childCrossMeasureMode;
        ABI16_0_0YGMeasureMode childMainMeasureMode = ABI16_0_0YGMeasureModeExactly;

        if (!ABI16_0_0YGFloatIsUndefined(availableInnerCrossDim) &&
            !ABI16_0_0YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis, availableInnerCrossDim) &&
            measureModeCrossDim == ABI16_0_0YGMeasureModeExactly &&
            !(isNodeFlexWrap && flexBasisOverflows) &&
            ABI16_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI16_0_0YGAlignStretch) {
          childCrossSize = availableInnerCrossDim;
          childCrossMeasureMode = ABI16_0_0YGMeasureModeExactly;
        } else if (!ABI16_0_0YGNodeIsStyleDimDefined(currentRelativeChild,
                                            crossAxis,
                                            availableInnerCrossDim)) {
          childCrossSize = availableInnerCrossDim;
          childCrossMeasureMode =
              ABI16_0_0YGFloatIsUndefined(childCrossSize) ? ABI16_0_0YGMeasureModeUndefined : ABI16_0_0YGMeasureModeAtMost;
        } else {
          childCrossSize = ABI16_0_0YGValueResolve(currentRelativeChild->resolvedDimensions[dim[crossAxis]],
                                          availableInnerCrossDim) +
                           marginCross;
          const bool isLoosePercentageMeasurement =
              currentRelativeChild->resolvedDimensions[dim[crossAxis]]->unit == ABI16_0_0YGUnitPercent &&
              measureModeCrossDim != ABI16_0_0YGMeasureModeExactly;
          childCrossMeasureMode = ABI16_0_0YGFloatIsUndefined(childCrossSize) || isLoosePercentageMeasurement
                                      ? ABI16_0_0YGMeasureModeUndefined
                                      : ABI16_0_0YGMeasureModeExactly;
        }

        if (!ABI16_0_0YGFloatIsUndefined(currentRelativeChild->style.aspectRatio)) {
          childCrossSize = fmaxf(
              isMainAxisRow
                  ? (childMainSize - marginMain) / currentRelativeChild->style.aspectRatio
                  : (childMainSize - marginMain) * currentRelativeChild->style.aspectRatio,
              ABI16_0_0YGNodePaddingAndBorderForAxis(currentRelativeChild, crossAxis, availableInnerWidth));
          childCrossMeasureMode = ABI16_0_0YGMeasureModeExactly;

          // Parent size constraint should have higher priority than flex
          if (ABI16_0_0YGNodeIsFlex(currentRelativeChild)) {
            childCrossSize = fminf(childCrossSize - marginCross, availableInnerCrossDim);
            childMainSize =
                marginMain + (isMainAxisRow
                                  ? childCrossSize * currentRelativeChild->style.aspectRatio
                                  : childCrossSize / currentRelativeChild->style.aspectRatio);
          }

          childCrossSize += marginCross;
        }

        ABI16_0_0YGConstrainMaxSizeForMode(
            ABI16_0_0YGValueResolve(&currentRelativeChild->style.maxDimensions[dim[mainAxis]],
                           availableInnerWidth),
            &childMainMeasureMode,
            &childMainSize);
        ABI16_0_0YGConstrainMaxSizeForMode(
            ABI16_0_0YGValueResolve(&currentRelativeChild->style.maxDimensions[dim[crossAxis]],
                           availableInnerHeight),
            &childCrossMeasureMode,
            &childCrossSize);

        const bool requiresStretchLayout =
            !ABI16_0_0YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis, availableInnerCrossDim) &&
            ABI16_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI16_0_0YGAlignStretch;

        const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
        const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

        const ABI16_0_0YGMeasureMode childWidthMeasureMode =
            isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
        const ABI16_0_0YGMeasureMode childHeightMeasureMode =
            !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        ABI16_0_0YGLayoutNodeInternal(currentRelativeChild,
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

    if (measureModeMainDim == ABI16_0_0YGMeasureModeAtMost && remainingFreeSpace > 0) {
      if (node->style.minDimensions[dim[mainAxis]].unit != ABI16_0_0YGUnitUndefined &&
          ABI16_0_0YGValueResolve(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) >= 0) {
        remainingFreeSpace =
            fmaxf(0,
                  ABI16_0_0YGValueResolve(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) -
                      (availableInnerMainDim - remainingFreeSpace));
      } else {
        remainingFreeSpace = 0;
      }
    }

    int numberOfAutoMarginsOnCurrentLine = 0;
    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, i);
      if (child->style.positionType == ABI16_0_0YGPositionTypeRelative) {
        if (ABI16_0_0YGMarginLeadingValue(child, mainAxis)->unit == ABI16_0_0YGUnitAuto) {
          numberOfAutoMarginsOnCurrentLine++;
        }
        if (ABI16_0_0YGMarginTrailingValue(child, mainAxis)->unit == ABI16_0_0YGUnitAuto) {
          numberOfAutoMarginsOnCurrentLine++;
        }
      }
    }

    if (numberOfAutoMarginsOnCurrentLine == 0) {
      switch (justifyContent) {
        case ABI16_0_0YGJustifyCenter:
          leadingMainDim = remainingFreeSpace / 2;
          break;
        case ABI16_0_0YGJustifyFlexEnd:
          leadingMainDim = remainingFreeSpace;
          break;
        case ABI16_0_0YGJustifySpaceBetween:
          if (itemsOnLine > 1) {
            betweenMainDim = fmaxf(remainingFreeSpace, 0) / (itemsOnLine - 1);
          } else {
            betweenMainDim = 0;
          }
          break;
        case ABI16_0_0YGJustifySpaceAround:
          // Space on the edges is half of the space between elements
          betweenMainDim = remainingFreeSpace / itemsOnLine;
          leadingMainDim = betweenMainDim / 2;
          break;
        case ABI16_0_0YGJustifyFlexStart:
          break;
      }
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, i);
      if (child->style.display == ABI16_0_0YGDisplayNone) {
        continue;
      }
      if (child->style.positionType == ABI16_0_0YGPositionTypeAbsolute &&
          ABI16_0_0YGNodeIsLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] =
              ABI16_0_0YGNodeLeadingPosition(child, mainAxis, availableInnerMainDim) +
              ABI16_0_0YGNodeLeadingBorder(node, mainAxis) +
              ABI16_0_0YGNodeLeadingMargin(child, mainAxis, availableInnerWidth);
        }
      } else {
        // Now that we placed the element, we need to update the variables.
        // We need to do that only for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.positionType == ABI16_0_0YGPositionTypeRelative) {
          if (ABI16_0_0YGMarginLeadingValue(child, mainAxis)->unit == ABI16_0_0YGUnitAuto) {
            mainDim += remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
          }

          if (performLayout) {
            child->layout.position[pos[mainAxis]] += mainDim;
          }

          if (ABI16_0_0YGMarginTrailingValue(child, mainAxis)->unit == ABI16_0_0YGUnitAuto) {
            mainDim += remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
          }

          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the
            // measuredDims because
            // they weren't computed. This means we can't call ABI16_0_0YGNodeDimWithMargin.
            mainDim += betweenMainDim + ABI16_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth) +
                       child->layout.computedFlexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus the spacing.
            mainDim += betweenMainDim + ABI16_0_0YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

            // The cross dimension is the max of the elements dimension since
            // there can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, ABI16_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
          }
        } else if (performLayout) {
          child->layout.position[pos[mainAxis]] +=
              ABI16_0_0YGNodeLeadingBorder(node, mainAxis) + leadingMainDim;
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == ABI16_0_0YGMeasureModeUndefined ||
        measureModeCrossDim == ABI16_0_0YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = ABI16_0_0YGNodeBoundAxis(node,
                                           crossAxis,
                                           crossDim + paddingAndBorderAxisCross,
                                           crossAxisParentSize,
                                           parentWidth) -
                           paddingAndBorderAxisCross;

      if (measureModeCrossDim == ABI16_0_0YGMeasureModeAtMost) {
        containerCrossAxis = fminf(containerCrossAxis, availableInnerCrossDim);
      }
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI16_0_0YGMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = ABI16_0_0YGNodeBoundAxis(node,
                               crossAxis,
                               crossDim + paddingAndBorderAxisCross,
                               crossAxisParentSize,
                               parentWidth) -
               paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, i);
        if (child->style.display == ABI16_0_0YGDisplayNone) {
          continue;
        }
        if (child->style.positionType == ABI16_0_0YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          if (ABI16_0_0YGNodeIsLeadingPosDefined(child, crossAxis)) {
            child->layout.position[pos[crossAxis]] =
                ABI16_0_0YGNodeLeadingPosition(child, crossAxis, availableInnerCrossDim) +
                ABI16_0_0YGNodeLeadingBorder(node, crossAxis) +
                ABI16_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          } else {
            child->layout.position[pos[crossAxis]] =
                ABI16_0_0YGNodeLeadingBorder(node, crossAxis) +
                ABI16_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const ABI16_0_0YGAlign alignItem = ABI16_0_0YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == ABI16_0_0YGAlignStretch &&
              ABI16_0_0YGMarginLeadingValue(child, crossAxis)->unit != ABI16_0_0YGUnitAuto &&
              ABI16_0_0YGMarginTrailingValue(child, crossAxis)->unit != ABI16_0_0YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!ABI16_0_0YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
              float childMainSize = child->layout.measuredDimensions[dim[mainAxis]];
              float childCrossSize =
                  !ABI16_0_0YGFloatIsUndefined(child->style.aspectRatio)
                      ? ((ABI16_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth) +
                          (isMainAxisRow ? childMainSize / child->style.aspectRatio
                                         : childMainSize * child->style.aspectRatio)))
                      : crossDim;

              childMainSize += ABI16_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);

              ABI16_0_0YGMeasureMode childMainMeasureMode = ABI16_0_0YGMeasureModeExactly;
              ABI16_0_0YGMeasureMode childCrossMeasureMode = ABI16_0_0YGMeasureModeExactly;
              ABI16_0_0YGConstrainMaxSizeForMode(ABI16_0_0YGValueResolve(&child->style.maxDimensions[dim[mainAxis]],
                                                       availableInnerMainDim),
                                        &childMainMeasureMode,
                                        &childMainSize);
              ABI16_0_0YGConstrainMaxSizeForMode(ABI16_0_0YGValueResolve(&child->style.maxDimensions[dim[crossAxis]],
                                                       availableInnerCrossDim),
                                        &childCrossMeasureMode,
                                        &childCrossSize);

              const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
              const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

              const ABI16_0_0YGMeasureMode childWidthMeasureMode =
                  ABI16_0_0YGFloatIsUndefined(childWidth) ? ABI16_0_0YGMeasureModeUndefined : ABI16_0_0YGMeasureModeExactly;
              const ABI16_0_0YGMeasureMode childHeightMeasureMode =
                  ABI16_0_0YGFloatIsUndefined(childHeight) ? ABI16_0_0YGMeasureModeUndefined : ABI16_0_0YGMeasureModeExactly;

              ABI16_0_0YGLayoutNodeInternal(child,
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
                containerCrossAxis - ABI16_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

            if (ABI16_0_0YGMarginLeadingValue(child, crossAxis)->unit == ABI16_0_0YGUnitAuto &&
                ABI16_0_0YGMarginTrailingValue(child, crossAxis)->unit == ABI16_0_0YGUnitAuto) {
              leadingCrossDim += remainingCrossDim / 2;
            } else if (ABI16_0_0YGMarginTrailingValue(child, crossAxis)->unit == ABI16_0_0YGUnitAuto) {
              // No-Op
            } else if (ABI16_0_0YGMarginLeadingValue(child, crossAxis)->unit == ABI16_0_0YGUnitAuto) {
              leadingCrossDim += remainingCrossDim;
            } else if (alignItem == ABI16_0_0YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == ABI16_0_0YGAlignCenter) {
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
  if (performLayout && (lineCount > 1 || ABI16_0_0YGIsBaselineLayout(node)) &&
      !ABI16_0_0YGFloatIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->style.alignContent) {
      case ABI16_0_0YGAlignFlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case ABI16_0_0YGAlignCenter:
        currentLead += remainingAlignContentDim / 2;
        break;
      case ABI16_0_0YGAlignStretch:
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = remainingAlignContentDim / lineCount;
        }
        break;
      case ABI16_0_0YGAlignSpaceAround:
        if (availableInnerCrossDim > totalLineCrossDim) {
          currentLead += remainingAlignContentDim / (2 * lineCount);
          if (lineCount > 1) {
            crossDimLead = remainingAlignContentDim / lineCount;
          }
        } else {
          currentLead += remainingAlignContentDim / 2;
        }
        break;
      case ABI16_0_0YGAlignSpaceBetween:
        if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
          crossDimLead = remainingAlignContentDim / (lineCount - 1);
        }
        break;
      case ABI16_0_0YGAlignAuto:
      case ABI16_0_0YGAlignFlexStart:
      case ABI16_0_0YGAlignBaseline:
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
        const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, ii);
        if (child->style.display == ABI16_0_0YGDisplayNone) {
          continue;
        }
        if (child->style.positionType == ABI16_0_0YGPositionTypeRelative) {
          if (child->lineIndex != i) {
            break;
          }
          if (ABI16_0_0YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = fmaxf(lineHeight,
                               child->layout.measuredDimensions[dim[crossAxis]] +
                                   ABI16_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth));
          }
          if (ABI16_0_0YGNodeAlignItem(node, child) == ABI16_0_0YGAlignBaseline) {
            const float ascent =
                ABI16_0_0YGBaseline(child) +
                ABI16_0_0YGNodeLeadingMargin(child, ABI16_0_0YGFlexDirectionColumn, availableInnerWidth);
            const float descent =
                child->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] +
                ABI16_0_0YGNodeMarginForAxis(child, ABI16_0_0YGFlexDirectionColumn, availableInnerWidth) - ascent;
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
          const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, ii);
          if (child->style.display == ABI16_0_0YGDisplayNone) {
            continue;
          }
          if (child->style.positionType == ABI16_0_0YGPositionTypeRelative) {
            switch (ABI16_0_0YGNodeAlignItem(node, child)) {
              case ABI16_0_0YGAlignFlexStart: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + ABI16_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
                break;
              }
              case ABI16_0_0YGAlignFlexEnd: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight -
                    ABI16_0_0YGNodeTrailingMargin(child, crossAxis, availableInnerWidth) -
                    child->layout.measuredDimensions[dim[crossAxis]];
                break;
              }
              case ABI16_0_0YGAlignCenter: {
                float childHeight = child->layout.measuredDimensions[dim[crossAxis]];
                child->layout.position[pos[crossAxis]] =
                    currentLead + (lineHeight - childHeight) / 2;
                break;
              }
              case ABI16_0_0YGAlignStretch: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + ABI16_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);

                // Remeasure child with the line height as it as been only measured with the
                // parents height yet.
                if (!ABI16_0_0YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth =
                      isMainAxisRow ? (child->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] +
                                       ABI16_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth))
                                    : lineHeight;

                  const float childHeight =
                      !isMainAxisRow ? (child->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] +
                                        ABI16_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth))
                                     : lineHeight;

                  if (!(ABI16_0_0YGFloatsEqual(childWidth,
                                      child->layout.measuredDimensions[ABI16_0_0YGDimensionWidth]) &&
                        ABI16_0_0YGFloatsEqual(childHeight,
                                      child->layout.measuredDimensions[ABI16_0_0YGDimensionHeight]))) {
                    ABI16_0_0YGLayoutNodeInternal(child,
                                         childWidth,
                                         childHeight,
                                         direction,
                                         ABI16_0_0YGMeasureModeExactly,
                                         ABI16_0_0YGMeasureModeExactly,
                                         availableInnerWidth,
                                         availableInnerHeight,
                                         true,
                                         "stretch",
                                         config);
                  }
                }
                break;
              }
              case ABI16_0_0YGAlignBaseline: {
                child->layout.position[ABI16_0_0YGEdgeTop] =
                    currentLead + maxAscentForCurrentLine - ABI16_0_0YGBaseline(child) +
                    ABI16_0_0YGNodeLeadingPosition(child, ABI16_0_0YGFlexDirectionColumn, availableInnerCrossDim);
                break;
              }
              case ABI16_0_0YGAlignAuto:
              case ABI16_0_0YGAlignSpaceBetween:
              case ABI16_0_0YGAlignSpaceAround:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth] = ABI16_0_0YGNodeBoundAxis(
      node, ABI16_0_0YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
  node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight] = ABI16_0_0YGNodeBoundAxis(
      node, ABI16_0_0YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI16_0_0YGMeasureModeUndefined ||
      (node->style.overflow != ABI16_0_0YGOverflowScroll && measureModeMainDim == ABI16_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] =
        ABI16_0_0YGNodeBoundAxis(node, mainAxis, maxLineMainDim, mainAxisParentSize, parentWidth);
  } else if (measureModeMainDim == ABI16_0_0YGMeasureModeAtMost &&
             node->style.overflow == ABI16_0_0YGOverflowScroll) {
    node->layout.measuredDimensions[dim[mainAxis]] = fmaxf(
        fminf(availableInnerMainDim + paddingAndBorderAxisMain,
              ABI16_0_0YGNodeBoundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim, mainAxisParentSize)),
        paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == ABI16_0_0YGMeasureModeUndefined ||
      (node->style.overflow != ABI16_0_0YGOverflowScroll && measureModeCrossDim == ABI16_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        ABI16_0_0YGNodeBoundAxis(node,
                        crossAxis,
                        totalLineCrossDim + paddingAndBorderAxisCross,
                        crossAxisParentSize,
                        parentWidth);
  } else if (measureModeCrossDim == ABI16_0_0YGMeasureModeAtMost &&
             node->style.overflow == ABI16_0_0YGOverflowScroll) {
    node->layout.measuredDimensions[dim[crossAxis]] =
        fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    ABI16_0_0YGNodeBoundAxisWithinMinAndMax(node,
                                                   crossAxis,
                                                   totalLineCrossDim + paddingAndBorderAxisCross,
                                                   crossAxisParentSize)),
              paddingAndBorderAxisCross);
  }

  // As we only wrapped in normal direction yet, we need to reverse the positions on wrap-reverse.
  if (performLayout && node->style.flexWrap == ABI16_0_0YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeGetChild(node, i);
      if (child->style.positionType == ABI16_0_0YGPositionTypeRelative) {
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
      ABI16_0_0YGNodeAbsoluteLayoutChild(node,
                                currentAbsoluteChild,
                                availableInnerWidth,
                                isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
                                availableInnerHeight,
                                direction,
                                config);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos =
        mainAxis == ABI16_0_0YGFlexDirectionRowReverse || mainAxis == ABI16_0_0YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        crossAxis == ABI16_0_0YGFlexDirectionRowReverse || crossAxis == ABI16_0_0YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const ABI16_0_0YGNodeRef child = ABI16_0_0YGNodeListGet(node->children, i);
        if (child->style.display == ABI16_0_0YGDisplayNone) {
          continue;
        }
        if (needsMainTrailingPos) {
          ABI16_0_0YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          ABI16_0_0YGNodeSetChildTrailingPosition(node, child, crossAxis);
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

static const char *ABI16_0_0YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char *ABI16_0_0YGMeasureModeName(const ABI16_0_0YGMeasureMode mode, const bool performLayout) {
  const char *kMeasureModeNames[ABI16_0_0YGMeasureModeCount] = {"UNDEFINED", "ABI16_0_0EXACTLY", "AT_MOST"};
  const char *kLayoutModeNames[ABI16_0_0YGMeasureModeCount] = {"LAY_UNDEFINED",
                                                      "LAY_EXACTLY",
                                                      "LAY_AT_"
                                                      "MOST"};

  if (mode >= ABI16_0_0YGMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool ABI16_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(ABI16_0_0YGMeasureMode sizeMode,
                                                                     float size,
                                                                     float lastComputedSize) {
  return sizeMode == ABI16_0_0YGMeasureModeExactly && ABI16_0_0YGFloatsEqual(size, lastComputedSize);
}

static inline bool ABI16_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(ABI16_0_0YGMeasureMode sizeMode,
                                                                 float size,
                                                                 ABI16_0_0YGMeasureMode lastSizeMode,
                                                                 float lastComputedSize) {
  return sizeMode == ABI16_0_0YGMeasureModeAtMost && lastSizeMode == ABI16_0_0YGMeasureModeUndefined &&
         (size >= lastComputedSize || ABI16_0_0YGFloatsEqual(size, lastComputedSize));
}

static inline bool ABI16_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(ABI16_0_0YGMeasureMode sizeMode,
                                                                      float size,
                                                                      ABI16_0_0YGMeasureMode lastSizeMode,
                                                                      float lastSize,
                                                                      float lastComputedSize) {
  return lastSizeMode == ABI16_0_0YGMeasureModeAtMost && sizeMode == ABI16_0_0YGMeasureModeAtMost &&
         lastSize > size && (lastComputedSize <= size || ABI16_0_0YGFloatsEqual(size, lastComputedSize));
}

bool ABI16_0_0YGNodeCanUseCachedMeasurement(const ABI16_0_0YGMeasureMode widthMode,
                                   const float width,
                                   const ABI16_0_0YGMeasureMode heightMode,
                                   const float height,
                                   const ABI16_0_0YGMeasureMode lastWidthMode,
                                   const float lastWidth,
                                   const ABI16_0_0YGMeasureMode lastHeightMode,
                                   const float lastHeight,
                                   const float lastComputedWidth,
                                   const float lastComputedHeight,
                                   const float marginRow,
                                   const float marginColumn) {
  if (lastComputedHeight < 0 || lastComputedWidth < 0) {
    return false;
  }

  const bool hasSameWidthSpec = lastWidthMode == widthMode && ABI16_0_0YGFloatsEqual(lastWidth, width);
  const bool hasSameHeightSpec = lastHeightMode == heightMode && ABI16_0_0YGFloatsEqual(lastHeight, height);

  const bool widthIsCompatible =
      hasSameWidthSpec || ABI16_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(widthMode,
                                                                            width - marginRow,
                                                                            lastComputedWidth) ||
      ABI16_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(widthMode,
                                                    width - marginRow,
                                                    lastWidthMode,
                                                    lastComputedWidth) ||
      ABI16_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode, width - marginRow, lastWidthMode, lastWidth, lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec || ABI16_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(heightMode,
                                                                             height - marginColumn,
                                                                             lastComputedHeight) ||
      ABI16_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(heightMode,
                                                    height - marginColumn,
                                                    lastHeightMode,
                                                    lastComputedHeight) ||
      ABI16_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode, height - marginColumn, lastHeightMode, lastHeight, lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the ABI16_0_0YGNodelayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as ABI16_0_0YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool ABI16_0_0YGLayoutNodeInternal(const ABI16_0_0YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const ABI16_0_0YGDirection parentDirection,
                          const ABI16_0_0YGMeasureMode widthMeasureMode,
                          const ABI16_0_0YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason,
                          const ABI16_0_0YGConfigRef config) {
  ABI16_0_0YGLayout *layout = &node->layout;

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.widthMeasureMode = (ABI16_0_0YGMeasureMode) -1;
    layout->cachedLayout.heightMeasureMode = (ABI16_0_0YGMeasureMode) -1;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  ABI16_0_0YGCachedMeasurement *cachedResults = NULL;

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
    const float marginAxisRow = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionRow, parentWidth);
    const float marginAxisColumn = ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionColumn, parentWidth);

    // First, try to use the layout cache.
    if (ABI16_0_0YGNodeCanUseCachedMeasurement(widthMeasureMode,
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
        if (ABI16_0_0YGNodeCanUseCachedMeasurement(widthMeasureMode,
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
    if (ABI16_0_0YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        ABI16_0_0YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (ABI16_0_0YGFloatsEqual(layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          ABI16_0_0YGFloatsEqual(layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != NULL) {
    layout->measuredDimensions[ABI16_0_0YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI16_0_0YGDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", ABI16_0_0YGSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
             ABI16_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI16_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             cachedResults->computedWidth,
             cachedResults->computedHeight,
             reason);
    }
  } else {
    if (gPrintChanges) {
      printf("%s%d.{%s", ABI16_0_0YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n",
             ABI16_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI16_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             reason);
    }

    ABI16_0_0YGNodelayoutImpl(node,
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
      printf("%s%d.}%s", ABI16_0_0YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
             ABI16_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI16_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             layout->measuredDimensions[ABI16_0_0YGDimensionWidth],
             layout->measuredDimensions[ABI16_0_0YGDimensionHeight],
             reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == NULL) {
      if (layout->nextCachedMeasurementsIndex == ABI16_0_0YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI16_0_0YGCachedMeasurement *newCacheEntry;
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
      newCacheEntry->computedWidth = layout->measuredDimensions[ABI16_0_0YGDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[ABI16_0_0YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[ABI16_0_0YGDimensionWidth] = node->layout.measuredDimensions[ABI16_0_0YGDimensionWidth];
    node->layout.dimensions[ABI16_0_0YGDimensionHeight] = node->layout.measuredDimensions[ABI16_0_0YGDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

static float gPointScaleFactor = 1.0;

void ABI16_0_0YGSetPointScaleFactor(float pixelsInPoint) {
  ABI16_0_0YG_ASSERT(pixelsInPoint >= 0.0, "Scale factor should not be less than zero");
  // We store points for Pixel as we will use it for rounding
  if (pixelsInPoint == 0.0) {
    // Zero is used to skip rounding
    gPointScaleFactor = 0.0;
  } else {
    gPointScaleFactor = 1.0 / pixelsInPoint;
  }
}

static void ABI16_0_0YGRoundToPixelGrid(const ABI16_0_0YGNodeRef node) {
  if (gPointScaleFactor == 0.0) {
    return;
  }
  const float nodeLeft = node->layout.position[ABI16_0_0YGEdgeLeft];
  const float nodeTop = node->layout.position[ABI16_0_0YGEdgeTop];

  // To round correctly to the pixel grid, first we calculate left and top coordinates
  float fractialLeft = fmodf(nodeLeft, gPointScaleFactor);
  float fractialTop = fmodf(nodeTop, gPointScaleFactor);
  float roundedLeft = nodeLeft - fractialLeft;
  float roundedTop = nodeTop - fractialTop;

  // To do the actual rounding we check if leftover fraction is bigger or equal than half of the grid step
  if (fractialLeft >= gPointScaleFactor / 2.0) {
    roundedLeft += gPointScaleFactor;
    fractialLeft -= gPointScaleFactor;
  }
  if (fractialTop >= gPointScaleFactor / 2.0) {
    roundedTop += gPointScaleFactor;
    fractialTop -= gPointScaleFactor;
  }
  node->layout.position[ABI16_0_0YGEdgeLeft] = roundedLeft;
  node->layout.position[ABI16_0_0YGEdgeTop] = roundedTop;

  // Now we round width and height in the same way accounting for fractial leftovers from rounding position
  const float adjustedWidth = fractialLeft + node->layout.dimensions[ABI16_0_0YGDimensionWidth];
  const float adjustedHeight = fractialTop + node->layout.dimensions[ABI16_0_0YGDimensionHeight];
  float roundedWidth = adjustedWidth - fmodf(adjustedWidth, gPointScaleFactor);
  float roundedHeight = adjustedHeight - fmodf(adjustedHeight, gPointScaleFactor);

  if (adjustedWidth - roundedWidth >= gPointScaleFactor / 2.0) {
    roundedWidth += gPointScaleFactor;
  }
  if (adjustedHeight - roundedHeight >= gPointScaleFactor / 2.0) {
    roundedHeight += gPointScaleFactor;
  }
  node->layout.dimensions[ABI16_0_0YGDimensionWidth] = roundedWidth;
  node->layout.dimensions[ABI16_0_0YGDimensionHeight] = roundedHeight;

  const uint32_t childCount = ABI16_0_0YGNodeListCount(node->children);
  for (uint32_t i = 0; i < childCount; i++) {
    ABI16_0_0YGRoundToPixelGrid(ABI16_0_0YGNodeGetChild(node, i));
  }
}

void ABI16_0_0YGNodeCalculateLayout(const ABI16_0_0YGNodeRef node,
                           const float parentWidth,
                           const float parentHeight,
                           const ABI16_0_0YGDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  ABI16_0_0YGResolveDimensions(node);

  float width = ABI16_0_0YGUndefined;
  ABI16_0_0YGMeasureMode widthMeasureMode = ABI16_0_0YGMeasureModeUndefined;
  if (ABI16_0_0YGNodeIsStyleDimDefined(node, ABI16_0_0YGFlexDirectionRow, parentWidth)) {
    width = ABI16_0_0YGValueResolve(node->resolvedDimensions[dim[ABI16_0_0YGFlexDirectionRow]], parentWidth) +
            ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionRow, parentWidth);
    widthMeasureMode = ABI16_0_0YGMeasureModeExactly;
  } else if (ABI16_0_0YGValueResolve(&node->style.maxDimensions[ABI16_0_0YGDimensionWidth], parentWidth) >= 0.0f) {
    width = ABI16_0_0YGValueResolve(&node->style.maxDimensions[ABI16_0_0YGDimensionWidth], parentWidth);
    widthMeasureMode = ABI16_0_0YGMeasureModeAtMost;
  } else {
    width = parentWidth;
    widthMeasureMode = ABI16_0_0YGFloatIsUndefined(width) ? ABI16_0_0YGMeasureModeUndefined : ABI16_0_0YGMeasureModeExactly;
  }

  float height = ABI16_0_0YGUndefined;
  ABI16_0_0YGMeasureMode heightMeasureMode = ABI16_0_0YGMeasureModeUndefined;
  if (ABI16_0_0YGNodeIsStyleDimDefined(node, ABI16_0_0YGFlexDirectionColumn, parentHeight)) {
    height = ABI16_0_0YGValueResolve(node->resolvedDimensions[dim[ABI16_0_0YGFlexDirectionColumn]], parentHeight) +
             ABI16_0_0YGNodeMarginForAxis(node, ABI16_0_0YGFlexDirectionColumn, parentWidth);
    heightMeasureMode = ABI16_0_0YGMeasureModeExactly;
  } else if (ABI16_0_0YGValueResolve(&node->style.maxDimensions[ABI16_0_0YGDimensionHeight], parentHeight) >=
             0.0f) {
    height = ABI16_0_0YGValueResolve(&node->style.maxDimensions[ABI16_0_0YGDimensionHeight], parentHeight);
    heightMeasureMode = ABI16_0_0YGMeasureModeAtMost;
  } else {
    height = parentHeight;
    heightMeasureMode = ABI16_0_0YGFloatIsUndefined(height) ? ABI16_0_0YGMeasureModeUndefined : ABI16_0_0YGMeasureModeExactly;
  }

  if (ABI16_0_0YGLayoutNodeInternal(node,
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
    ABI16_0_0YGNodeSetPosition(node, node->layout.direction, parentWidth, parentHeight, parentWidth);

    if (ABI16_0_0YGConfigIsExperimentalFeatureEnabled(node->config, ABI16_0_0YGExperimentalFeatureRounding)) {
      ABI16_0_0YGRoundToPixelGrid(node);
    }

    if (gPrintTree) {
      ABI16_0_0YGNodePrint(node, ABI16_0_0YGPrintOptionsLayout | ABI16_0_0YGPrintOptionsChildren | ABI16_0_0YGPrintOptionsStyle);
    }
  }
}

void ABI16_0_0YGSetLogger(ABI16_0_0YGLogger logger) {
  gLogger = logger;
}

void ABI16_0_0YGLog(ABI16_0_0YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  gLogger(level, format, args);
  va_end(args);
}

void ABI16_0_0YGConfigSetExperimentalFeatureEnabled(const ABI16_0_0YGConfigRef config,
                                     const ABI16_0_0YGExperimentalFeature feature,
                                     const bool enabled) {
  config->experimentalFeatures[feature] = enabled;
}

inline bool ABI16_0_0YGConfigIsExperimentalFeatureEnabled(const ABI16_0_0YGConfigRef config,
                                           const ABI16_0_0YGExperimentalFeature feature) {
  return config->experimentalFeatures[feature];
}

void ABI16_0_0YGSetMemoryFuncs(ABI16_0_0YGMalloc ygmalloc, ABI16_0_0YGCalloc yccalloc, ABI16_0_0YGRealloc ygrealloc, ABI16_0_0YGFree ygfree) {
  ABI16_0_0YG_ASSERT(gNodeInstanceCount == 0, "Cannot set memory functions: all node must be freed first");
  ABI16_0_0YG_ASSERT((ygmalloc == NULL && yccalloc == NULL && ygrealloc == NULL && ygfree == NULL) ||
                (ygmalloc != NULL && yccalloc != NULL && ygrealloc != NULL && ygfree != NULL),
            "Cannot set memory functions: functions must be all NULL or Non-NULL");

  if (ygmalloc == NULL || yccalloc == NULL || ygrealloc == NULL || ygfree == NULL) {
    gABI16_0_0YGMalloc = &malloc;
    gABI16_0_0YGCalloc = &calloc;
    gABI16_0_0YGRealloc = &realloc;
    gABI16_0_0YGFree = &free;
  } else {
    gABI16_0_0YGMalloc = ygmalloc;
    gABI16_0_0YGCalloc = yccalloc;
    gABI16_0_0YGRealloc = ygrealloc;
    gABI16_0_0YGFree = ygfree;
  }
}
