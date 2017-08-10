/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "ABI20_0_0YGNodeList.h"
#include "ABI20_0_0Yoga.h"

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

typedef struct ABI20_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI20_0_0YGMeasureMode widthMeasureMode;
  ABI20_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} ABI20_0_0YGCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
#define ABI20_0_0YG_MAX_CACHED_RESULT_COUNT 16

typedef struct ABI20_0_0YGLayout {
  float position[4];
  float dimensions[2];
  float margin[6];
  float border[6];
  float padding[6];
  ABI20_0_0YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;
  bool hadOverflow;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI20_0_0YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  ABI20_0_0YGCachedMeasurement cachedMeasurements[ABI20_0_0YG_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  ABI20_0_0YGCachedMeasurement cachedLayout;
} ABI20_0_0YGLayout;

typedef struct ABI20_0_0YGStyle {
  ABI20_0_0YGDirection direction;
  ABI20_0_0YGFlexDirection flexDirection;
  ABI20_0_0YGJustify justifyContent;
  ABI20_0_0YGAlign alignContent;
  ABI20_0_0YGAlign alignItems;
  ABI20_0_0YGAlign alignSelf;
  ABI20_0_0YGPositionType positionType;
  ABI20_0_0YGWrap flexWrap;
  ABI20_0_0YGOverflow overflow;
  ABI20_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI20_0_0YGValue flexBasis;
  ABI20_0_0YGValue margin[ABI20_0_0YGEdgeCount];
  ABI20_0_0YGValue position[ABI20_0_0YGEdgeCount];
  ABI20_0_0YGValue padding[ABI20_0_0YGEdgeCount];
  ABI20_0_0YGValue border[ABI20_0_0YGEdgeCount];
  ABI20_0_0YGValue dimensions[2];
  ABI20_0_0YGValue minDimensions[2];
  ABI20_0_0YGValue maxDimensions[2];

  // Yoga specific properties, not compatible with flexbox specification
  float aspectRatio;
} ABI20_0_0YGStyle;

typedef struct ABI20_0_0YGConfig {
  bool experimentalFeatures[ABI20_0_0YGExperimentalFeatureCount + 1];
  bool useWebDefaults;
  bool useLegacyStretchBehaviour;
  float pointScaleFactor;
  ABI20_0_0YGLogger logger;
  void *context;
} ABI20_0_0YGConfig;

typedef struct ABI20_0_0YGNode {
  ABI20_0_0YGStyle style;
  ABI20_0_0YGLayout layout;
  uint32_t lineIndex;

  ABI20_0_0YGNodeRef parent;
  ABI20_0_0YGNodeListRef children;

  struct ABI20_0_0YGNode *nextChild;

  ABI20_0_0YGMeasureFunc measure;
  ABI20_0_0YGBaselineFunc baseline;
  ABI20_0_0YGPrintFunc print;
  ABI20_0_0YGConfigRef config;
  void *context;

  bool isDirty;
  bool hasNewLayout;
  ABI20_0_0YGNodeType nodeType;

  ABI20_0_0YGValue const *resolvedDimensions[2];
} ABI20_0_0YGNode;

#define ABI20_0_0YG_UNDEFINED_VALUES \
  { .value = ABI20_0_0YGUndefined, .unit = ABI20_0_0YGUnitUndefined }

#define ABI20_0_0YG_AUTO_VALUES \
  { .value = ABI20_0_0YGUndefined, .unit = ABI20_0_0YGUnitAuto }

#define ABI20_0_0YG_DEFAULT_EDGE_VALUES_UNIT                                                   \
  {                                                                                   \
    [ABI20_0_0YGEdgeLeft] = ABI20_0_0YG_UNDEFINED_VALUES, [ABI20_0_0YGEdgeTop] = ABI20_0_0YG_UNDEFINED_VALUES,            \
    [ABI20_0_0YGEdgeRight] = ABI20_0_0YG_UNDEFINED_VALUES, [ABI20_0_0YGEdgeBottom] = ABI20_0_0YG_UNDEFINED_VALUES,        \
    [ABI20_0_0YGEdgeStart] = ABI20_0_0YG_UNDEFINED_VALUES, [ABI20_0_0YGEdgeEnd] = ABI20_0_0YG_UNDEFINED_VALUES,           \
    [ABI20_0_0YGEdgeHorizontal] = ABI20_0_0YG_UNDEFINED_VALUES, [ABI20_0_0YGEdgeVertical] = ABI20_0_0YG_UNDEFINED_VALUES, \
    [ABI20_0_0YGEdgeAll] = ABI20_0_0YG_UNDEFINED_VALUES,                                                \
  }

#define ABI20_0_0YG_DEFAULT_DIMENSION_VALUES \
  { [ABI20_0_0YGDimensionWidth] = ABI20_0_0YGUndefined, [ABI20_0_0YGDimensionHeight] = ABI20_0_0YGUndefined, }

#define ABI20_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT \
  { [ABI20_0_0YGDimensionWidth] = ABI20_0_0YG_UNDEFINED_VALUES, [ABI20_0_0YGDimensionHeight] = ABI20_0_0YG_UNDEFINED_VALUES, }

#define ABI20_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT \
  { [ABI20_0_0YGDimensionWidth] = ABI20_0_0YG_AUTO_VALUES, [ABI20_0_0YGDimensionHeight] = ABI20_0_0YG_AUTO_VALUES, }

static const float kDefaultFlexGrow = 0.0f;
static const float kDefaultFlexShrink = 0.0f;
static const float kWebDefaultFlexShrink = 1.0f;

static ABI20_0_0YGNode gABI20_0_0YGNodeDefaults = {
    .parent = NULL,
    .children = NULL,
    .hasNewLayout = true,
    .isDirty = false,
    .nodeType = ABI20_0_0YGNodeTypeDefault,
    .resolvedDimensions = {[ABI20_0_0YGDimensionWidth] = &ABI20_0_0YGValueUndefined,
                           [ABI20_0_0YGDimensionHeight] = &ABI20_0_0YGValueUndefined},

    .style =
        {
            .flex = ABI20_0_0YGUndefined,
            .flexGrow = ABI20_0_0YGUndefined,
            .flexShrink = ABI20_0_0YGUndefined,
            .flexBasis = ABI20_0_0YG_AUTO_VALUES,
            .justifyContent = ABI20_0_0YGJustifyFlexStart,
            .alignItems = ABI20_0_0YGAlignStretch,
            .alignContent = ABI20_0_0YGAlignFlexStart,
            .direction = ABI20_0_0YGDirectionInherit,
            .flexDirection = ABI20_0_0YGFlexDirectionColumn,
            .overflow = ABI20_0_0YGOverflowVisible,
            .display = ABI20_0_0YGDisplayFlex,
            .dimensions = ABI20_0_0YG_DEFAULT_DIMENSION_VALUES_AUTO_UNIT,
            .minDimensions = ABI20_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .maxDimensions = ABI20_0_0YG_DEFAULT_DIMENSION_VALUES_UNIT,
            .position = ABI20_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .margin = ABI20_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .padding = ABI20_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .border = ABI20_0_0YG_DEFAULT_EDGE_VALUES_UNIT,
            .aspectRatio = ABI20_0_0YGUndefined,
        },

    .layout =
        {
            .dimensions = ABI20_0_0YG_DEFAULT_DIMENSION_VALUES,
            .lastParentDirection = (ABI20_0_0YGDirection) -1,
            .nextCachedMeasurementsIndex = 0,
            .computedFlexBasis = ABI20_0_0YGUndefined,
            .hadOverflow = false,
            .measuredDimensions = ABI20_0_0YG_DEFAULT_DIMENSION_VALUES,

            .cachedLayout =
                {
                    .widthMeasureMode = (ABI20_0_0YGMeasureMode) -1,
                    .heightMeasureMode = (ABI20_0_0YGMeasureMode) -1,
                    .computedWidth = -1,
                    .computedHeight = -1,
                },
        },
};

#ifdef ANDROID
static int ABI20_0_0YGAndroidLog(const ABI20_0_0YGConfigRef config,
                        const ABI20_0_0YGNodeRef node,
                        ABI20_0_0YGLogLevel level,
                        const char *format,
                        va_list args);
#else
static int ABI20_0_0YGDefaultLog(const ABI20_0_0YGConfigRef config,
                        const ABI20_0_0YGNodeRef node,
                        ABI20_0_0YGLogLevel level,
                        const char *format,
                        va_list args);
#endif

static ABI20_0_0YGConfig gABI20_0_0YGConfigDefaults = {
    .experimentalFeatures =
        {
                [ABI20_0_0YGExperimentalFeatureWebFlexBasis] = false,
        },
    .useWebDefaults = false,
    .pointScaleFactor = 1.0f,
#ifdef ANDROID
    .logger = &ABI20_0_0YGAndroidLog,
#else
    .logger = &ABI20_0_0YGDefaultLog,
#endif
    .context = NULL,
};

static void ABI20_0_0YGNodeMarkDirtyInternal(const ABI20_0_0YGNodeRef node);

ABI20_0_0YGMalloc gABI20_0_0YGMalloc = &malloc;
ABI20_0_0YGCalloc gABI20_0_0YGCalloc = &calloc;
ABI20_0_0YGRealloc gABI20_0_0YGRealloc = &realloc;
ABI20_0_0YGFree gABI20_0_0YGFree = &free;

static ABI20_0_0YGValue ABI20_0_0YGValueZero = {.value = 0, .unit = ABI20_0_0YGUnitPoint};

#ifdef ANDROID
#include <android/log.h>
static int ABI20_0_0YGAndroidLog(const ABI20_0_0YGConfigRef config,
                        const ABI20_0_0YGNodeRef node,
                        ABI20_0_0YGLogLevel level,
                        const char *format,
                        va_list args) {
  int androidLevel = ABI20_0_0YGLogLevelDebug;
  switch (level) {
    case ABI20_0_0YGLogLevelFatal:
      androidLevel = ANDROID_LOG_FATAL;
      break;
    case ABI20_0_0YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case ABI20_0_0YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case ABI20_0_0YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case ABI20_0_0YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case ABI20_0_0YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
  }
  const int result = __android_log_vprint(androidLevel, "yoga", format, args);
  return result;
}
#else
static int ABI20_0_0YGDefaultLog(const ABI20_0_0YGConfigRef config,
                        const ABI20_0_0YGNodeRef node,
                        ABI20_0_0YGLogLevel level,
                        const char *format,
                        va_list args) {
  switch (level) {
    case ABI20_0_0YGLogLevelError:
    case ABI20_0_0YGLogLevelFatal:
      return vfprintf(stderr, format, args);
    case ABI20_0_0YGLogLevelWarn:
    case ABI20_0_0YGLogLevelInfo:
    case ABI20_0_0YGLogLevelDebug:
    case ABI20_0_0YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}
#endif

static inline const ABI20_0_0YGValue *ABI20_0_0YGComputedEdgeValue(const ABI20_0_0YGValue edges[ABI20_0_0YGEdgeCount],
                                                 const ABI20_0_0YGEdge edge,
                                                 const ABI20_0_0YGValue *const defaultValue) {
  if (edges[edge].unit != ABI20_0_0YGUnitUndefined) {
    return &edges[edge];
  }

  if ((edge == ABI20_0_0YGEdgeTop || edge == ABI20_0_0YGEdgeBottom) &&
      edges[ABI20_0_0YGEdgeVertical].unit != ABI20_0_0YGUnitUndefined) {
    return &edges[ABI20_0_0YGEdgeVertical];
  }

  if ((edge == ABI20_0_0YGEdgeLeft || edge == ABI20_0_0YGEdgeRight || edge == ABI20_0_0YGEdgeStart || edge == ABI20_0_0YGEdgeEnd) &&
      edges[ABI20_0_0YGEdgeHorizontal].unit != ABI20_0_0YGUnitUndefined) {
    return &edges[ABI20_0_0YGEdgeHorizontal];
  }

  if (edges[ABI20_0_0YGEdgeAll].unit != ABI20_0_0YGUnitUndefined) {
    return &edges[ABI20_0_0YGEdgeAll];
  }

  if (edge == ABI20_0_0YGEdgeStart || edge == ABI20_0_0YGEdgeEnd) {
    return &ABI20_0_0YGValueUndefined;
  }

  return defaultValue;
}

static inline float ABI20_0_0YGResolveValue(const ABI20_0_0YGValue *const value, const float parentSize) {
  switch (value->unit) {
    case ABI20_0_0YGUnitUndefined:
    case ABI20_0_0YGUnitAuto:
      return ABI20_0_0YGUndefined;
    case ABI20_0_0YGUnitPoint:
      return value->value;
    case ABI20_0_0YGUnitPercent:
      return value->value * parentSize / 100.0f;
  }
  return ABI20_0_0YGUndefined;
}

static inline float ABI20_0_0YGResolveValueMargin(const ABI20_0_0YGValue *const value, const float parentSize) {
  return value->unit == ABI20_0_0YGUnitAuto ? 0 : ABI20_0_0YGResolveValue(value, parentSize);
}

int32_t gNodeInstanceCount = 0;
int32_t gConfigInstanceCount = 0;

WIN_EXPORT ABI20_0_0YGNodeRef ABI20_0_0YGNodeNewWithConfig(const ABI20_0_0YGConfigRef config) {
  const ABI20_0_0YGNodeRef node = gABI20_0_0YGMalloc(sizeof(ABI20_0_0YGNode));
  ABI20_0_0YGAssertWithConfig(config, node != NULL, "Could not allocate memory for node");
  gNodeInstanceCount++;

  memcpy(node, &gABI20_0_0YGNodeDefaults, sizeof(ABI20_0_0YGNode));
  if (config->useWebDefaults) {
    node->style.flexDirection = ABI20_0_0YGFlexDirectionRow;
    node->style.alignContent = ABI20_0_0YGAlignStretch;
  }
  node->config = config;
  return node;
}

ABI20_0_0YGNodeRef ABI20_0_0YGNodeNew(void) {
  return ABI20_0_0YGNodeNewWithConfig(&gABI20_0_0YGConfigDefaults);
}

void ABI20_0_0YGNodeFree(const ABI20_0_0YGNodeRef node) {
  if (node->parent) {
    ABI20_0_0YGNodeListDelete(node->parent->children, node);
    node->parent = NULL;
  }

  const uint32_t childCount = ABI20_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeGetChild(node, i);
    child->parent = NULL;
  }

  ABI20_0_0YGNodeListFree(node->children);
  gABI20_0_0YGFree(node);
  gNodeInstanceCount--;
}

void ABI20_0_0YGNodeFreeRecursive(const ABI20_0_0YGNodeRef root) {
  while (ABI20_0_0YGNodeGetChildCount(root) > 0) {
    const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeGetChild(root, 0);
    ABI20_0_0YGNodeRemoveChild(root, child);
    ABI20_0_0YGNodeFreeRecursive(child);
  }
  ABI20_0_0YGNodeFree(root);
}

void ABI20_0_0YGNodeReset(const ABI20_0_0YGNodeRef node) {
  ABI20_0_0YGAssertWithNode(node,
                   ABI20_0_0YGNodeGetChildCount(node) == 0,
                   "Cannot reset a node which still has children attached");
  ABI20_0_0YGAssertWithNode(node, node->parent == NULL, "Cannot reset a node still attached to a parent");

  ABI20_0_0YGNodeListFree(node->children);

  const ABI20_0_0YGConfigRef config = node->config;
  memcpy(node, &gABI20_0_0YGNodeDefaults, sizeof(ABI20_0_0YGNode));
  if (config->useWebDefaults) {
    node->style.flexDirection = ABI20_0_0YGFlexDirectionRow;
    node->style.alignContent = ABI20_0_0YGAlignStretch;
  }
  node->config = config;
}

int32_t ABI20_0_0YGNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

int32_t ABI20_0_0YGConfigGetInstanceCount(void) {
  return gConfigInstanceCount;
}

// Export only for C#
ABI20_0_0YGConfigRef ABI20_0_0YGConfigGetDefault() {
  return &gABI20_0_0YGConfigDefaults;
}

ABI20_0_0YGConfigRef ABI20_0_0YGConfigNew(void) {
  const ABI20_0_0YGConfigRef config = gABI20_0_0YGMalloc(sizeof(ABI20_0_0YGConfig));
  ABI20_0_0YGAssert(config != NULL, "Could not allocate memory for config");

  gConfigInstanceCount++;
  memcpy(config, &gABI20_0_0YGConfigDefaults, sizeof(ABI20_0_0YGConfig));
  return config;
}

void ABI20_0_0YGConfigFree(const ABI20_0_0YGConfigRef config) {
  gABI20_0_0YGFree(config);
  gConfigInstanceCount--;
}

void ABI20_0_0YGConfigCopy(const ABI20_0_0YGConfigRef dest, const ABI20_0_0YGConfigRef src) {
  memcpy(dest, src, sizeof(ABI20_0_0YGConfig));
}

static void ABI20_0_0YGNodeMarkDirtyInternal(const ABI20_0_0YGNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = ABI20_0_0YGUndefined;
    if (node->parent) {
      ABI20_0_0YGNodeMarkDirtyInternal(node->parent);
    }
  }
}

void ABI20_0_0YGNodeSetMeasureFunc(const ABI20_0_0YGNodeRef node, ABI20_0_0YGMeasureFunc measureFunc) {
  if (measureFunc == NULL) {
    node->measure = NULL;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate places in Litho
    node->nodeType = ABI20_0_0YGNodeTypeDefault;
  } else {
    ABI20_0_0YGAssertWithNode(
        node,
        ABI20_0_0YGNodeGetChildCount(node) == 0,
        "Cannot set measure function: Nodes with measure functions cannot have children.");
    node->measure = measureFunc;
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate places in Litho
    node->nodeType = ABI20_0_0YGNodeTypeText;
  }
}

ABI20_0_0YGMeasureFunc ABI20_0_0YGNodeGetMeasureFunc(const ABI20_0_0YGNodeRef node) {
  return node->measure;
}

void ABI20_0_0YGNodeSetBaselineFunc(const ABI20_0_0YGNodeRef node, ABI20_0_0YGBaselineFunc baselineFunc) {
  node->baseline = baselineFunc;
}

ABI20_0_0YGBaselineFunc ABI20_0_0YGNodeGetBaselineFunc(const ABI20_0_0YGNodeRef node) {
  return node->baseline;
}

void ABI20_0_0YGNodeInsertChild(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGNodeRef child, const uint32_t index) {
  ABI20_0_0YGAssertWithNode(node,
                   child->parent == NULL,
                   "Child already has a parent, it must be removed first.");
  ABI20_0_0YGAssertWithNode(node,
                   node->measure == NULL,
                   "Cannot add child: Nodes with measure functions cannot have children.");

  ABI20_0_0YGNodeListInsert(&node->children, child, index);
  child->parent = node;
  ABI20_0_0YGNodeMarkDirtyInternal(node);
}

void ABI20_0_0YGNodeRemoveChild(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGNodeRef child) {
  if (ABI20_0_0YGNodeListDelete(node->children, child) != NULL) {
    child->layout = gABI20_0_0YGNodeDefaults.layout; // layout is no longer valid
    child->parent = NULL;
    ABI20_0_0YGNodeMarkDirtyInternal(node);
  }
}

ABI20_0_0YGNodeRef ABI20_0_0YGNodeGetChild(const ABI20_0_0YGNodeRef node, const uint32_t index) {
  return ABI20_0_0YGNodeListGet(node->children, index);
}

ABI20_0_0YGNodeRef ABI20_0_0YGNodeGetParent(const ABI20_0_0YGNodeRef node) {
  return node->parent;
}

inline uint32_t ABI20_0_0YGNodeGetChildCount(const ABI20_0_0YGNodeRef node) {
  return ABI20_0_0YGNodeListCount(node->children);
}

void ABI20_0_0YGNodeMarkDirty(const ABI20_0_0YGNodeRef node) {
  ABI20_0_0YGAssertWithNode(node,
                   node->measure != NULL,
                   "Only leaf nodes with custom measure functions"
                   "should manually mark themselves as dirty");

  ABI20_0_0YGNodeMarkDirtyInternal(node);
}

bool ABI20_0_0YGNodeIsDirty(const ABI20_0_0YGNodeRef node) {
  return node->isDirty;
}

void ABI20_0_0YGNodeCopyStyle(const ABI20_0_0YGNodeRef dstNode, const ABI20_0_0YGNodeRef srcNode) {
  if (memcmp(&dstNode->style, &srcNode->style, sizeof(ABI20_0_0YGStyle)) != 0) {
    memcpy(&dstNode->style, &srcNode->style, sizeof(ABI20_0_0YGStyle));
    ABI20_0_0YGNodeMarkDirtyInternal(dstNode);
  }
}

static inline float ABI20_0_0YGResolveFlexGrow(const ABI20_0_0YGNodeRef node) {
  // Root nodes flexGrow should always be 0
  if (node->parent == NULL) {
    return 0.0;
  }
  if (!ABI20_0_0YGFloatIsUndefined(node->style.flexGrow)) {
    return node->style.flexGrow;
  }
  if (!ABI20_0_0YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return node->style.flex;
  }
  return kDefaultFlexGrow;
}

float ABI20_0_0YGNodeStyleGetFlexGrow(const ABI20_0_0YGNodeRef node) {
  return ABI20_0_0YGFloatIsUndefined(node->style.flexGrow) ? kDefaultFlexGrow : node->style.flexGrow;
}

float ABI20_0_0YGNodeStyleGetFlexShrink(const ABI20_0_0YGNodeRef node) {
  return ABI20_0_0YGFloatIsUndefined(node->style.flexShrink)
             ? (node->config->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink)
             : node->style.flexShrink;
}

static inline float ABI20_0_0YGNodeResolveFlexShrink(const ABI20_0_0YGNodeRef node) {
  // Root nodes flexShrink should always be 0
  if (node->parent == NULL) {
    return 0.0;
  }
  if (!ABI20_0_0YGFloatIsUndefined(node->style.flexShrink)) {
    return node->style.flexShrink;
  }
  if (!node->config->useWebDefaults && !ABI20_0_0YGFloatIsUndefined(node->style.flex) &&
      node->style.flex < 0.0f) {
    return -node->style.flex;
  }
  return node->config->useWebDefaults ? kWebDefaultFlexShrink : kDefaultFlexShrink;
}

static inline const ABI20_0_0YGValue *ABI20_0_0YGNodeResolveFlexBasisPtr(const ABI20_0_0YGNodeRef node) {
  if (node->style.flexBasis.unit != ABI20_0_0YGUnitAuto && node->style.flexBasis.unit != ABI20_0_0YGUnitUndefined) {
    return &node->style.flexBasis;
  }
  if (!ABI20_0_0YGFloatIsUndefined(node->style.flex) && node->style.flex > 0.0f) {
    return node->config->useWebDefaults ? &ABI20_0_0YGValueAuto : &ABI20_0_0YGValueZero;
  }
  return &ABI20_0_0YGValueAuto;
}

#define ABI20_0_0YG_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
  void ABI20_0_0YGNodeSet##name(const ABI20_0_0YGNodeRef node, type paramName) {     \
    node->instanceName = paramName;                                \
  }                                                                \
                                                                   \
  type ABI20_0_0YGNodeGet##name(const ABI20_0_0YGNodeRef node) {                     \
    return node->instanceName;                                     \
  }

#define ABI20_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
  void ABI20_0_0YGNodeStyleSet##name(const ABI20_0_0YGNodeRef node, const type paramName) {       \
    if (node->style.instanceName != paramName) {                                \
      node->style.instanceName = paramName;                                     \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                            \
    }                                                                           \
  }

#define ABI20_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(type, name, paramName, instanceName)              \
  void ABI20_0_0YGNodeStyleSet##name(const ABI20_0_0YGNodeRef node, const type paramName) {                         \
    if (node->style.instanceName.value != paramName ||                                            \
        node->style.instanceName.unit != ABI20_0_0YGUnitPoint) {                                           \
      node->style.instanceName.value = paramName;                                                 \
      node->style.instanceName.unit = ABI20_0_0YGFloatIsUndefined(paramName) ? ABI20_0_0YGUnitAuto : ABI20_0_0YGUnitPoint;   \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }                                                                                               \
                                                                                                  \
  void ABI20_0_0YGNodeStyleSet##name##Percent(const ABI20_0_0YGNodeRef node, const type paramName) {                \
    if (node->style.instanceName.value != paramName ||                                            \
        node->style.instanceName.unit != ABI20_0_0YGUnitPercent) {                                         \
      node->style.instanceName.value = paramName;                                                 \
      node->style.instanceName.unit = ABI20_0_0YGFloatIsUndefined(paramName) ? ABI20_0_0YGUnitAuto : ABI20_0_0YGUnitPercent; \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }

#define ABI20_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(type, name, paramName, instanceName)         \
  void ABI20_0_0YGNodeStyleSet##name(const ABI20_0_0YGNodeRef node, const type paramName) {                         \
    if (node->style.instanceName.value != paramName ||                                            \
        node->style.instanceName.unit != ABI20_0_0YGUnitPoint) {                                           \
      node->style.instanceName.value = paramName;                                                 \
      node->style.instanceName.unit = ABI20_0_0YGFloatIsUndefined(paramName) ? ABI20_0_0YGUnitAuto : ABI20_0_0YGUnitPoint;   \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }                                                                                               \
                                                                                                  \
  void ABI20_0_0YGNodeStyleSet##name##Percent(const ABI20_0_0YGNodeRef node, const type paramName) {                \
    if (node->style.instanceName.value != paramName ||                                            \
        node->style.instanceName.unit != ABI20_0_0YGUnitPercent) {                                         \
      node->style.instanceName.value = paramName;                                                 \
      node->style.instanceName.unit = ABI20_0_0YGFloatIsUndefined(paramName) ? ABI20_0_0YGUnitAuto : ABI20_0_0YGUnitPercent; \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }                                                                                               \
                                                                                                  \
  void ABI20_0_0YGNodeStyleSet##name##Auto(const ABI20_0_0YGNodeRef node) {                                         \
    if (node->style.instanceName.unit != ABI20_0_0YGUnitAuto) {                                            \
      node->style.instanceName.value = ABI20_0_0YGUndefined;                                               \
      node->style.instanceName.unit = ABI20_0_0YGUnitAuto;                                                 \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                                              \
    }                                                                                             \
  }

#define ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  ABI20_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
                                                                          \
  type ABI20_0_0YGNodeStyleGet##name(const ABI20_0_0YGNodeRef node) {                       \
    return node->style.instanceName;                                      \
  }

#define ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName)   \
  ABI20_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_IMPL(float, name, paramName, instanceName) \
                                                                                \
  type ABI20_0_0YGNodeStyleGet##name(const ABI20_0_0YGNodeRef node) {                             \
    return node->style.instanceName;                                            \
  }

#define ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(type, name, paramName, instanceName)   \
  ABI20_0_0YG_NODE_STYLE_PROPERTY_SETTER_UNIT_AUTO_IMPL(float, name, paramName, instanceName) \
                                                                                     \
  type ABI20_0_0YGNodeStyleGet##name(const ABI20_0_0YGNodeRef node) {                                  \
    return node->style.instanceName;                                                 \
  }

#define ABI20_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(type, name, instanceName) \
  void ABI20_0_0YGNodeStyleSet##name##Auto(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGEdge edge) { \
    if (node->style.instanceName[edge].unit != ABI20_0_0YGUnitAuto) {                 \
      node->style.instanceName[edge].value = ABI20_0_0YGUndefined;                    \
      node->style.instanceName[edge].unit = ABI20_0_0YGUnitAuto;                      \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                         \
    }                                                                        \
  }

#define ABI20_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(type, name, paramName, instanceName)            \
  void ABI20_0_0YGNodeStyleSet##name(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGEdge edge, const float paramName) { \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI20_0_0YGUnitPoint) {                                 \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI20_0_0YGFloatIsUndefined(paramName) ? ABI20_0_0YGUnitUndefined : ABI20_0_0YGUnitPoint;                      \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  void ABI20_0_0YGNodeStyleSet##name##Percent(const ABI20_0_0YGNodeRef node,                                    \
                                     const ABI20_0_0YGEdge edge,                                       \
                                     const float paramName) {                                 \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI20_0_0YGUnitPercent) {                               \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI20_0_0YGFloatIsUndefined(paramName) ? ABI20_0_0YGUnitUndefined : ABI20_0_0YGUnitPercent;                    \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  WIN_STRUCT(type) ABI20_0_0YGNodeStyleGet##name(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGEdge edge) {            \
    return WIN_STRUCT_REF(node->style.instanceName[edge]);                                    \
  }

#define ABI20_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName)                 \
  void ABI20_0_0YGNodeStyleSet##name(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGEdge edge, const float paramName) { \
    if (node->style.instanceName[edge].value != paramName ||                                  \
        node->style.instanceName[edge].unit != ABI20_0_0YGUnitPoint) {                                 \
      node->style.instanceName[edge].value = paramName;                                       \
      node->style.instanceName[edge].unit =                                                   \
          ABI20_0_0YGFloatIsUndefined(paramName) ? ABI20_0_0YGUnitUndefined : ABI20_0_0YGUnitPoint;                      \
      ABI20_0_0YGNodeMarkDirtyInternal(node);                                                          \
    }                                                                                         \
  }                                                                                           \
                                                                                              \
  float ABI20_0_0YGNodeStyleGet##name(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGEdge edge) {                       \
    return node->style.instanceName[edge].value;                                              \
  }

#define ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type ABI20_0_0YGNodeLayoutGet##name(const ABI20_0_0YGNodeRef node) {           \
    return node->layout.instanceName;                          \
  }

#define ABI20_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(type, name, instanceName)        \
  type ABI20_0_0YGNodeLayoutGet##name(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGEdge edge) {        \
    ABI20_0_0YGAssertWithNode(node,                                                     \
                     edge < ABI20_0_0YGEdgeEnd,                                         \
                     "Cannot get layout properties of multi-edge shorthands"); \
                                                                               \
    if (edge == ABI20_0_0YGEdgeLeft) {                                                  \
      if (node->layout.direction == ABI20_0_0YGDirectionRTL) {                          \
        return node->layout.instanceName[ABI20_0_0YGEdgeEnd];                           \
      } else {                                                                 \
        return node->layout.instanceName[ABI20_0_0YGEdgeStart];                         \
      }                                                                        \
    }                                                                          \
                                                                               \
    if (edge == ABI20_0_0YGEdgeRight) {                                                 \
      if (node->layout.direction == ABI20_0_0YGDirectionRTL) {                          \
        return node->layout.instanceName[ABI20_0_0YGEdgeStart];                         \
      } else {                                                                 \
        return node->layout.instanceName[ABI20_0_0YGEdgeEnd];                           \
      }                                                                        \
    }                                                                          \
                                                                               \
    return node->layout.instanceName[edge];                                    \
  }

ABI20_0_0YG_NODE_PROPERTY_IMPL(void *, Context, context, context);
ABI20_0_0YG_NODE_PROPERTY_IMPL(ABI20_0_0YGPrintFunc, PrintFunc, printFunc, print);
ABI20_0_0YG_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);
ABI20_0_0YG_NODE_PROPERTY_IMPL(ABI20_0_0YGNodeType, NodeType, nodeType, nodeType);

ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGDirection, Direction, direction, direction);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGFlexDirection, FlexDirection, flexDirection, flexDirection);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGJustify, JustifyContent, justifyContent, justifyContent);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGAlign, AlignContent, alignContent, alignContent);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGAlign, AlignItems, alignItems, alignItems);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGAlign, AlignSelf, alignSelf, alignSelf);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGPositionType, PositionType, positionType, positionType);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGWrap, FlexWrap, flexWrap, flexWrap);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGOverflow, Overflow, overflow, overflow);
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI20_0_0YGDisplay, Display, display, display);

ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, Flex, flex, flex);
ABI20_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexGrow, flexGrow, flexGrow);
ABI20_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexShrink, flexShrink, flexShrink);
ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI20_0_0YGValue, FlexBasis, flexBasis, flexBasis);

ABI20_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI20_0_0YGValue, Position, position, position);
ABI20_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI20_0_0YGValue, Margin, margin, margin);
ABI20_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO_IMPL(ABI20_0_0YGValue, Margin, margin);
ABI20_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_IMPL(ABI20_0_0YGValue, Padding, padding, padding);
ABI20_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border);

ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI20_0_0YGValue, Width, width, dimensions[ABI20_0_0YGDimensionWidth]);
ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO_IMPL(ABI20_0_0YGValue, Height, height, dimensions[ABI20_0_0YGDimensionHeight]);
ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI20_0_0YGValue, MinWidth, minWidth, minDimensions[ABI20_0_0YGDimensionWidth]);
ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI20_0_0YGValue, MinHeight, minHeight, minDimensions[ABI20_0_0YGDimensionHeight]);
ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI20_0_0YGValue, MaxWidth, maxWidth, maxDimensions[ABI20_0_0YGDimensionWidth]);
ABI20_0_0YG_NODE_STYLE_PROPERTY_UNIT_IMPL(ABI20_0_0YGValue, MaxHeight, maxHeight, maxDimensions[ABI20_0_0YGDimensionHeight]);

// Yoga specific properties, not compatible with flexbox specification
ABI20_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, AspectRatio, aspectRatio, aspectRatio);

ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI20_0_0YGEdgeLeft]);
ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI20_0_0YGEdgeTop]);
ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI20_0_0YGEdgeRight]);
ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI20_0_0YGEdgeBottom]);
ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI20_0_0YGDimensionWidth]);
ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI20_0_0YGDimensionHeight]);
ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(ABI20_0_0YGDirection, Direction, direction);
ABI20_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(bool, HadOverflow, hadOverflow);

ABI20_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Margin, margin);
ABI20_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Border, border);
ABI20_0_0YG_NODE_LAYOUT_RESOLVED_PROPERTY_IMPL(float, Padding, padding);

uint32_t gCurrentGenerationCount = 0;

bool ABI20_0_0YGLayoutNodeInternal(const ABI20_0_0YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const ABI20_0_0YGDirection parentDirection,
                          const ABI20_0_0YGMeasureMode widthMeasureMode,
                          const ABI20_0_0YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason,
                          const ABI20_0_0YGConfigRef config);

inline bool ABI20_0_0YGFloatIsUndefined(const float value) {
  return isnan(value);
}

static inline bool ABI20_0_0YGValueEqual(const ABI20_0_0YGValue a, const ABI20_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI20_0_0YGUnitUndefined) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

static inline void ABI20_0_0YGResolveDimensions(ABI20_0_0YGNodeRef node) {
  for (ABI20_0_0YGDimension dim = ABI20_0_0YGDimensionWidth; dim <= ABI20_0_0YGDimensionHeight; dim++) {
    if (node->style.maxDimensions[dim].unit != ABI20_0_0YGUnitUndefined &&
        ABI20_0_0YGValueEqual(node->style.maxDimensions[dim], node->style.minDimensions[dim])) {
      node->resolvedDimensions[dim] = &node->style.maxDimensions[dim];
    } else {
      node->resolvedDimensions[dim] = &node->style.dimensions[dim];
    }
  }
}

static inline bool ABI20_0_0YGFloatsEqual(const float a, const float b) {
  if (ABI20_0_0YGFloatIsUndefined(a)) {
    return ABI20_0_0YGFloatIsUndefined(b);
  }
  return fabs(a - b) < 0.0001f;
}

static void ABI20_0_0YGIndent(const ABI20_0_0YGNodeRef node, const uint32_t n) {
  for (uint32_t i = 0; i < n; i++) {
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "  ");
  }
}

static void ABI20_0_0YGPrintNumberIfNotUndefinedf(const ABI20_0_0YGNodeRef node,
                                         const char *str,
                                         const float number) {
  if (!ABI20_0_0YGFloatIsUndefined(number)) {
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "%s: %g; ", str, number);
  }
}

static void ABI20_0_0YGPrintNumberIfNotUndefined(const ABI20_0_0YGNodeRef node,
                                        const char *str,
                                        const ABI20_0_0YGValue *const number) {
  if (number->unit != ABI20_0_0YGUnitUndefined) {
    if (number->unit == ABI20_0_0YGUnitAuto) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "%s: auto; ", str);
    } else {
      const char *unit = number->unit == ABI20_0_0YGUnitPoint ? "px" : "%";
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "%s: %g%s; ", str, number->value, unit);
    }
  }
}

static void ABI20_0_0YGPrintNumberIfNotAuto(const ABI20_0_0YGNodeRef node,
                                   const char *str,
                                   const ABI20_0_0YGValue *const number) {
  if (number->unit != ABI20_0_0YGUnitAuto) {
    ABI20_0_0YGPrintNumberIfNotUndefined(node, str, number);
  }
}

static void ABI20_0_0YGPrintEdgeIfNotUndefined(const ABI20_0_0YGNodeRef node,
                                      const char *str,
                                      const ABI20_0_0YGValue *edges,
                                      const ABI20_0_0YGEdge edge) {
  ABI20_0_0YGPrintNumberIfNotUndefined(node, str, ABI20_0_0YGComputedEdgeValue(edges, edge, &ABI20_0_0YGValueUndefined));
}

static void ABI20_0_0YGPrintNumberIfNotZero(const ABI20_0_0YGNodeRef node,
                                   const char *str,
                                   const ABI20_0_0YGValue *const number) {
  if (!ABI20_0_0YGFloatsEqual(number->value, 0)) {
    ABI20_0_0YGPrintNumberIfNotUndefined(node, str, number);
  }
}

static bool ABI20_0_0YGFourValuesEqual(const ABI20_0_0YGValue four[4]) {
  return ABI20_0_0YGValueEqual(four[0], four[1]) && ABI20_0_0YGValueEqual(four[0], four[2]) &&
         ABI20_0_0YGValueEqual(four[0], four[3]);
}

static void ABI20_0_0YGPrintEdges(const ABI20_0_0YGNodeRef node, const char *str, const ABI20_0_0YGValue *edges) {
  if (ABI20_0_0YGFourValuesEqual(edges)) {
    ABI20_0_0YGPrintNumberIfNotZero(node, str, &edges[ABI20_0_0YGEdgeLeft]);
  } else {
    for (ABI20_0_0YGEdge edge = ABI20_0_0YGEdgeLeft; edge < ABI20_0_0YGEdgeCount; edge++) {
      char buf[30];
      snprintf(buf, sizeof(buf), "%s-%s", str, ABI20_0_0YGEdgeToString(edge));
      ABI20_0_0YGPrintNumberIfNotZero(node, buf, &edges[edge]);
    }
  }
}

static void ABI20_0_0YGNodePrintInternal(const ABI20_0_0YGNodeRef node,
                                const ABI20_0_0YGPrintOptions options,
                                const uint32_t level) {
  ABI20_0_0YGIndent(node, level);
  ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "<div ");

  if (node->print) {
    node->print(node);
  }

  if (options & ABI20_0_0YGPrintOptionsLayout) {
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "layout=\"");
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "width: %g; ", node->layout.dimensions[ABI20_0_0YGDimensionWidth]);
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "height: %g; ", node->layout.dimensions[ABI20_0_0YGDimensionHeight]);
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "top: %g; ", node->layout.position[ABI20_0_0YGEdgeTop]);
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "left: %g;", node->layout.position[ABI20_0_0YGEdgeLeft]);
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "\" ");
  }

  if (options & ABI20_0_0YGPrintOptionsStyle) {
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "style=\"");
    if (node->style.flexDirection != gABI20_0_0YGNodeDefaults.style.flexDirection) {
      ABI20_0_0YGLog(node,
            ABI20_0_0YGLogLevelDebug,
            "flex-direction: %s; ",
            ABI20_0_0YGFlexDirectionToString(node->style.flexDirection));
    }
    if (node->style.justifyContent != gABI20_0_0YGNodeDefaults.style.justifyContent) {
      ABI20_0_0YGLog(node,
            ABI20_0_0YGLogLevelDebug,
            "justify-content: %s; ",
            ABI20_0_0YGJustifyToString(node->style.justifyContent));
    }
    if (node->style.alignItems != gABI20_0_0YGNodeDefaults.style.alignItems) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "align-items: %s; ", ABI20_0_0YGAlignToString(node->style.alignItems));
    }
    if (node->style.alignContent != gABI20_0_0YGNodeDefaults.style.alignContent) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "align-content: %s; ", ABI20_0_0YGAlignToString(node->style.alignContent));
    }
    if (node->style.alignSelf != gABI20_0_0YGNodeDefaults.style.alignSelf) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "align-self: %s; ", ABI20_0_0YGAlignToString(node->style.alignSelf));
    }

    ABI20_0_0YGPrintNumberIfNotUndefinedf(node, "flex-grow", node->style.flexGrow);
    ABI20_0_0YGPrintNumberIfNotUndefinedf(node, "flex-shrink", node->style.flexShrink);
    ABI20_0_0YGPrintNumberIfNotAuto(node, "flex-basis", &node->style.flexBasis);
    ABI20_0_0YGPrintNumberIfNotUndefinedf(node, "flex", node->style.flex);

    if (node->style.flexWrap != gABI20_0_0YGNodeDefaults.style.flexWrap) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "flexWrap: %s; ", ABI20_0_0YGWrapToString(node->style.flexWrap));
    }

    if (node->style.overflow != gABI20_0_0YGNodeDefaults.style.overflow) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "overflow: %s; ", ABI20_0_0YGOverflowToString(node->style.overflow));
    }

    if (node->style.display != gABI20_0_0YGNodeDefaults.style.display) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "display: %s; ", ABI20_0_0YGDisplayToString(node->style.display));
    }

    ABI20_0_0YGPrintEdges(node, "margin", node->style.margin);
    ABI20_0_0YGPrintEdges(node, "padding", node->style.padding);
    ABI20_0_0YGPrintEdges(node, "border", node->style.border);

    ABI20_0_0YGPrintNumberIfNotAuto(node, "width", &node->style.dimensions[ABI20_0_0YGDimensionWidth]);
    ABI20_0_0YGPrintNumberIfNotAuto(node, "height", &node->style.dimensions[ABI20_0_0YGDimensionHeight]);
    ABI20_0_0YGPrintNumberIfNotAuto(node, "max-width", &node->style.maxDimensions[ABI20_0_0YGDimensionWidth]);
    ABI20_0_0YGPrintNumberIfNotAuto(node, "max-height", &node->style.maxDimensions[ABI20_0_0YGDimensionHeight]);
    ABI20_0_0YGPrintNumberIfNotAuto(node, "min-width", &node->style.minDimensions[ABI20_0_0YGDimensionWidth]);
    ABI20_0_0YGPrintNumberIfNotAuto(node, "min-height", &node->style.minDimensions[ABI20_0_0YGDimensionHeight]);

    if (node->style.positionType != gABI20_0_0YGNodeDefaults.style.positionType) {
      ABI20_0_0YGLog(node,
            ABI20_0_0YGLogLevelDebug,
            "position: %s; ",
            ABI20_0_0YGPositionTypeToString(node->style.positionType));
    }

    ABI20_0_0YGPrintEdgeIfNotUndefined(node, "left", node->style.position, ABI20_0_0YGEdgeLeft);
    ABI20_0_0YGPrintEdgeIfNotUndefined(node, "right", node->style.position, ABI20_0_0YGEdgeRight);
    ABI20_0_0YGPrintEdgeIfNotUndefined(node, "top", node->style.position, ABI20_0_0YGEdgeTop);
    ABI20_0_0YGPrintEdgeIfNotUndefined(node, "bottom", node->style.position, ABI20_0_0YGEdgeBottom);
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "\" ");

    if (node->measure != NULL) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "has-custom-measure=\"true\"");
    }
  }
  ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, ">");

  const uint32_t childCount = ABI20_0_0YGNodeListCount(node->children);
  if (options & ABI20_0_0YGPrintOptionsChildren && childCount > 0) {
    for (uint32_t i = 0; i < childCount; i++) {
      ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "\n");
      ABI20_0_0YGNodePrintInternal(ABI20_0_0YGNodeGetChild(node, i), options, level + 1);
    }
    ABI20_0_0YGIndent(node, level);
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "\n");
  }
  ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelDebug, "</div>");
}

void ABI20_0_0YGNodePrint(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGPrintOptions options) {
  ABI20_0_0YGNodePrintInternal(node, options, 0);
}

static const ABI20_0_0YGEdge leading[4] = {
        [ABI20_0_0YGFlexDirectionColumn] = ABI20_0_0YGEdgeTop,
        [ABI20_0_0YGFlexDirectionColumnReverse] = ABI20_0_0YGEdgeBottom,
        [ABI20_0_0YGFlexDirectionRow] = ABI20_0_0YGEdgeLeft,
        [ABI20_0_0YGFlexDirectionRowReverse] = ABI20_0_0YGEdgeRight,
};
static const ABI20_0_0YGEdge trailing[4] = {
        [ABI20_0_0YGFlexDirectionColumn] = ABI20_0_0YGEdgeBottom,
        [ABI20_0_0YGFlexDirectionColumnReverse] = ABI20_0_0YGEdgeTop,
        [ABI20_0_0YGFlexDirectionRow] = ABI20_0_0YGEdgeRight,
        [ABI20_0_0YGFlexDirectionRowReverse] = ABI20_0_0YGEdgeLeft,
};
static const ABI20_0_0YGEdge pos[4] = {
        [ABI20_0_0YGFlexDirectionColumn] = ABI20_0_0YGEdgeTop,
        [ABI20_0_0YGFlexDirectionColumnReverse] = ABI20_0_0YGEdgeBottom,
        [ABI20_0_0YGFlexDirectionRow] = ABI20_0_0YGEdgeLeft,
        [ABI20_0_0YGFlexDirectionRowReverse] = ABI20_0_0YGEdgeRight,
};
static const ABI20_0_0YGDimension dim[4] = {
        [ABI20_0_0YGFlexDirectionColumn] = ABI20_0_0YGDimensionHeight,
        [ABI20_0_0YGFlexDirectionColumnReverse] = ABI20_0_0YGDimensionHeight,
        [ABI20_0_0YGFlexDirectionRow] = ABI20_0_0YGDimensionWidth,
        [ABI20_0_0YGFlexDirectionRowReverse] = ABI20_0_0YGDimensionWidth,
};

static inline bool ABI20_0_0YGFlexDirectionIsRow(const ABI20_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI20_0_0YGFlexDirectionRow || flexDirection == ABI20_0_0YGFlexDirectionRowReverse;
}

static inline bool ABI20_0_0YGFlexDirectionIsColumn(const ABI20_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI20_0_0YGFlexDirectionColumn || flexDirection == ABI20_0_0YGFlexDirectionColumnReverse;
}

static inline float ABI20_0_0YGNodeLeadingMargin(const ABI20_0_0YGNodeRef node,
                                        const ABI20_0_0YGFlexDirection axis,
                                        const float widthSize) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI20_0_0YGEdgeStart].unit != ABI20_0_0YGUnitUndefined) {
    return ABI20_0_0YGResolveValueMargin(&node->style.margin[ABI20_0_0YGEdgeStart], widthSize);
  }

  return ABI20_0_0YGResolveValueMargin(ABI20_0_0YGComputedEdgeValue(node->style.margin, leading[axis], &ABI20_0_0YGValueZero),
                              widthSize);
}

static float ABI20_0_0YGNodeTrailingMargin(const ABI20_0_0YGNodeRef node,
                                  const ABI20_0_0YGFlexDirection axis,
                                  const float widthSize) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI20_0_0YGEdgeEnd].unit != ABI20_0_0YGUnitUndefined) {
    return ABI20_0_0YGResolveValueMargin(&node->style.margin[ABI20_0_0YGEdgeEnd], widthSize);
  }

  return ABI20_0_0YGResolveValueMargin(ABI20_0_0YGComputedEdgeValue(node->style.margin, trailing[axis], &ABI20_0_0YGValueZero),
                              widthSize);
}

static float ABI20_0_0YGNodeLeadingPadding(const ABI20_0_0YGNodeRef node,
                                  const ABI20_0_0YGFlexDirection axis,
                                  const float widthSize) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis) && node->style.padding[ABI20_0_0YGEdgeStart].unit != ABI20_0_0YGUnitUndefined &&
      ABI20_0_0YGResolveValue(&node->style.padding[ABI20_0_0YGEdgeStart], widthSize) >= 0.0f) {
    return ABI20_0_0YGResolveValue(&node->style.padding[ABI20_0_0YGEdgeStart], widthSize);
  }

  return fmaxf(ABI20_0_0YGResolveValue(ABI20_0_0YGComputedEdgeValue(node->style.padding, leading[axis], &ABI20_0_0YGValueZero),
                              widthSize),
               0.0f);
}

static float ABI20_0_0YGNodeTrailingPadding(const ABI20_0_0YGNodeRef node,
                                   const ABI20_0_0YGFlexDirection axis,
                                   const float widthSize) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis) && node->style.padding[ABI20_0_0YGEdgeEnd].unit != ABI20_0_0YGUnitUndefined &&
      ABI20_0_0YGResolveValue(&node->style.padding[ABI20_0_0YGEdgeEnd], widthSize) >= 0.0f) {
    return ABI20_0_0YGResolveValue(&node->style.padding[ABI20_0_0YGEdgeEnd], widthSize);
  }

  return fmaxf(ABI20_0_0YGResolveValue(ABI20_0_0YGComputedEdgeValue(node->style.padding, trailing[axis], &ABI20_0_0YGValueZero),
                              widthSize),
               0.0f);
}

static float ABI20_0_0YGNodeLeadingBorder(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGFlexDirection axis) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis) && node->style.border[ABI20_0_0YGEdgeStart].unit != ABI20_0_0YGUnitUndefined &&
      node->style.border[ABI20_0_0YGEdgeStart].value >= 0.0f) {
    return node->style.border[ABI20_0_0YGEdgeStart].value;
  }

  return fmaxf(ABI20_0_0YGComputedEdgeValue(node->style.border, leading[axis], &ABI20_0_0YGValueZero)->value, 0.0f);
}

static float ABI20_0_0YGNodeTrailingBorder(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGFlexDirection axis) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis) && node->style.border[ABI20_0_0YGEdgeEnd].unit != ABI20_0_0YGUnitUndefined &&
      node->style.border[ABI20_0_0YGEdgeEnd].value >= 0.0f) {
    return node->style.border[ABI20_0_0YGEdgeEnd].value;
  }

  return fmaxf(ABI20_0_0YGComputedEdgeValue(node->style.border, trailing[axis], &ABI20_0_0YGValueZero)->value, 0.0f);
}

static inline float ABI20_0_0YGNodeLeadingPaddingAndBorder(const ABI20_0_0YGNodeRef node,
                                                  const ABI20_0_0YGFlexDirection axis,
                                                  const float widthSize) {
  return ABI20_0_0YGNodeLeadingPadding(node, axis, widthSize) + ABI20_0_0YGNodeLeadingBorder(node, axis);
}

static inline float ABI20_0_0YGNodeTrailingPaddingAndBorder(const ABI20_0_0YGNodeRef node,
                                                   const ABI20_0_0YGFlexDirection axis,
                                                   const float widthSize) {
  return ABI20_0_0YGNodeTrailingPadding(node, axis, widthSize) + ABI20_0_0YGNodeTrailingBorder(node, axis);
}

static inline float ABI20_0_0YGNodeMarginForAxis(const ABI20_0_0YGNodeRef node,
                                        const ABI20_0_0YGFlexDirection axis,
                                        const float widthSize) {
  return ABI20_0_0YGNodeLeadingMargin(node, axis, widthSize) + ABI20_0_0YGNodeTrailingMargin(node, axis, widthSize);
}

static inline float ABI20_0_0YGNodePaddingAndBorderForAxis(const ABI20_0_0YGNodeRef node,
                                                  const ABI20_0_0YGFlexDirection axis,
                                                  const float widthSize) {
  return ABI20_0_0YGNodeLeadingPaddingAndBorder(node, axis, widthSize) +
         ABI20_0_0YGNodeTrailingPaddingAndBorder(node, axis, widthSize);
}

static inline ABI20_0_0YGAlign ABI20_0_0YGNodeAlignItem(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGNodeRef child) {
  const ABI20_0_0YGAlign align =
      child->style.alignSelf == ABI20_0_0YGAlignAuto ? node->style.alignItems : child->style.alignSelf;
  if (align == ABI20_0_0YGAlignBaseline && ABI20_0_0YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return ABI20_0_0YGAlignFlexStart;
  }
  return align;
}

static inline ABI20_0_0YGDirection ABI20_0_0YGNodeResolveDirection(const ABI20_0_0YGNodeRef node,
                                                 const ABI20_0_0YGDirection parentDirection) {
  if (node->style.direction == ABI20_0_0YGDirectionInherit) {
    return parentDirection > ABI20_0_0YGDirectionInherit ? parentDirection : ABI20_0_0YGDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static float ABI20_0_0YGBaseline(const ABI20_0_0YGNodeRef node) {
  if (node->baseline != NULL) {
    const float baseline = node->baseline(node,
                                          node->layout.measuredDimensions[ABI20_0_0YGDimensionWidth],
                                          node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight]);
    ABI20_0_0YGAssertWithNode(node,
                     !ABI20_0_0YGFloatIsUndefined(baseline),
                     "Expect custom baseline function to not return NaN");
    return baseline;
  }

  ABI20_0_0YGNodeRef baselineChild = NULL;
  const uint32_t childCount = ABI20_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeGetChild(node, i);
    if (child->lineIndex > 0) {
      break;
    }
    if (child->style.positionType == ABI20_0_0YGPositionTypeAbsolute) {
      continue;
    }
    if (ABI20_0_0YGNodeAlignItem(node, child) == ABI20_0_0YGAlignBaseline) {
      baselineChild = child;
      break;
    }

    if (baselineChild == NULL) {
      baselineChild = child;
    }
  }

  if (baselineChild == NULL) {
    return node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight];
  }

  const float baseline = ABI20_0_0YGBaseline(baselineChild);
  return baseline + baselineChild->layout.position[ABI20_0_0YGEdgeTop];
}

static inline ABI20_0_0YGFlexDirection ABI20_0_0YGResolveFlexDirection(const ABI20_0_0YGFlexDirection flexDirection,
                                                     const ABI20_0_0YGDirection direction) {
  if (direction == ABI20_0_0YGDirectionRTL) {
    if (flexDirection == ABI20_0_0YGFlexDirectionRow) {
      return ABI20_0_0YGFlexDirectionRowReverse;
    } else if (flexDirection == ABI20_0_0YGFlexDirectionRowReverse) {
      return ABI20_0_0YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static ABI20_0_0YGFlexDirection ABI20_0_0YGFlexDirectionCross(const ABI20_0_0YGFlexDirection flexDirection,
                                            const ABI20_0_0YGDirection direction) {
  return ABI20_0_0YGFlexDirectionIsColumn(flexDirection)
             ? ABI20_0_0YGResolveFlexDirection(ABI20_0_0YGFlexDirectionRow, direction)
             : ABI20_0_0YGFlexDirectionColumn;
}

static inline bool ABI20_0_0YGNodeIsFlex(const ABI20_0_0YGNodeRef node) {
  return (node->style.positionType == ABI20_0_0YGPositionTypeRelative &&
          (ABI20_0_0YGResolveFlexGrow(node) != 0 || ABI20_0_0YGNodeResolveFlexShrink(node) != 0));
}

static bool ABI20_0_0YGIsBaselineLayout(const ABI20_0_0YGNodeRef node) {
  if (ABI20_0_0YGFlexDirectionIsColumn(node->style.flexDirection)) {
    return false;
  }
  if (node->style.alignItems == ABI20_0_0YGAlignBaseline) {
    return true;
  }
  const uint32_t childCount = ABI20_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeGetChild(node, i);
    if (child->style.positionType == ABI20_0_0YGPositionTypeRelative &&
        child->style.alignSelf == ABI20_0_0YGAlignBaseline) {
      return true;
    }
  }

  return false;
}

static inline float ABI20_0_0YGNodeDimWithMargin(const ABI20_0_0YGNodeRef node,
                                        const ABI20_0_0YGFlexDirection axis,
                                        const float widthSize) {
  return node->layout.measuredDimensions[dim[axis]] + ABI20_0_0YGNodeLeadingMargin(node, axis, widthSize) +
         ABI20_0_0YGNodeTrailingMargin(node, axis, widthSize);
}

static inline bool ABI20_0_0YGNodeIsStyleDimDefined(const ABI20_0_0YGNodeRef node,
                                           const ABI20_0_0YGFlexDirection axis,
                                           const float parentSize) {
  return !(node->resolvedDimensions[dim[axis]]->unit == ABI20_0_0YGUnitAuto ||
           node->resolvedDimensions[dim[axis]]->unit == ABI20_0_0YGUnitUndefined ||
           (node->resolvedDimensions[dim[axis]]->unit == ABI20_0_0YGUnitPoint &&
            node->resolvedDimensions[dim[axis]]->value < 0.0f) ||
           (node->resolvedDimensions[dim[axis]]->unit == ABI20_0_0YGUnitPercent &&
            (node->resolvedDimensions[dim[axis]]->value < 0.0f || ABI20_0_0YGFloatIsUndefined(parentSize))));
}

static inline bool ABI20_0_0YGNodeIsLayoutDimDefined(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !ABI20_0_0YGFloatIsUndefined(value) && value >= 0.0f;
}

static inline bool ABI20_0_0YGNodeIsLeadingPosDefined(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGFlexDirection axis) {
  return (ABI20_0_0YGFlexDirectionIsRow(axis) &&
          ABI20_0_0YGComputedEdgeValue(node->style.position, ABI20_0_0YGEdgeStart, &ABI20_0_0YGValueUndefined)->unit !=
              ABI20_0_0YGUnitUndefined) ||
         ABI20_0_0YGComputedEdgeValue(node->style.position, leading[axis], &ABI20_0_0YGValueUndefined)->unit !=
             ABI20_0_0YGUnitUndefined;
}

static inline bool ABI20_0_0YGNodeIsTrailingPosDefined(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGFlexDirection axis) {
  return (ABI20_0_0YGFlexDirectionIsRow(axis) &&
          ABI20_0_0YGComputedEdgeValue(node->style.position, ABI20_0_0YGEdgeEnd, &ABI20_0_0YGValueUndefined)->unit !=
              ABI20_0_0YGUnitUndefined) ||
         ABI20_0_0YGComputedEdgeValue(node->style.position, trailing[axis], &ABI20_0_0YGValueUndefined)->unit !=
             ABI20_0_0YGUnitUndefined;
}

static float ABI20_0_0YGNodeLeadingPosition(const ABI20_0_0YGNodeRef node,
                                   const ABI20_0_0YGFlexDirection axis,
                                   const float axisSize) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis)) {
    const ABI20_0_0YGValue *leadingPosition =
        ABI20_0_0YGComputedEdgeValue(node->style.position, ABI20_0_0YGEdgeStart, &ABI20_0_0YGValueUndefined);
    if (leadingPosition->unit != ABI20_0_0YGUnitUndefined) {
      return ABI20_0_0YGResolveValue(leadingPosition, axisSize);
    }
  }

  const ABI20_0_0YGValue *leadingPosition =
      ABI20_0_0YGComputedEdgeValue(node->style.position, leading[axis], &ABI20_0_0YGValueUndefined);

  return leadingPosition->unit == ABI20_0_0YGUnitUndefined ? 0.0f
                                                  : ABI20_0_0YGResolveValue(leadingPosition, axisSize);
}

static float ABI20_0_0YGNodeTrailingPosition(const ABI20_0_0YGNodeRef node,
                                    const ABI20_0_0YGFlexDirection axis,
                                    const float axisSize) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis)) {
    const ABI20_0_0YGValue *trailingPosition =
        ABI20_0_0YGComputedEdgeValue(node->style.position, ABI20_0_0YGEdgeEnd, &ABI20_0_0YGValueUndefined);
    if (trailingPosition->unit != ABI20_0_0YGUnitUndefined) {
      return ABI20_0_0YGResolveValue(trailingPosition, axisSize);
    }
  }

  const ABI20_0_0YGValue *trailingPosition =
      ABI20_0_0YGComputedEdgeValue(node->style.position, trailing[axis], &ABI20_0_0YGValueUndefined);

  return trailingPosition->unit == ABI20_0_0YGUnitUndefined ? 0.0f
                                                   : ABI20_0_0YGResolveValue(trailingPosition, axisSize);
}

static float ABI20_0_0YGNodeBoundAxisWithinMinAndMax(const ABI20_0_0YGNodeRef node,
                                            const ABI20_0_0YGFlexDirection axis,
                                            const float value,
                                            const float axisSize) {
  float min = ABI20_0_0YGUndefined;
  float max = ABI20_0_0YGUndefined;

  if (ABI20_0_0YGFlexDirectionIsColumn(axis)) {
    min = ABI20_0_0YGResolveValue(&node->style.minDimensions[ABI20_0_0YGDimensionHeight], axisSize);
    max = ABI20_0_0YGResolveValue(&node->style.maxDimensions[ABI20_0_0YGDimensionHeight], axisSize);
  } else if (ABI20_0_0YGFlexDirectionIsRow(axis)) {
    min = ABI20_0_0YGResolveValue(&node->style.minDimensions[ABI20_0_0YGDimensionWidth], axisSize);
    max = ABI20_0_0YGResolveValue(&node->style.maxDimensions[ABI20_0_0YGDimensionWidth], axisSize);
  }

  float boundValue = value;

  if (!ABI20_0_0YGFloatIsUndefined(max) && max >= 0.0f && boundValue > max) {
    boundValue = max;
  }

  if (!ABI20_0_0YGFloatIsUndefined(min) && min >= 0.0f && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

static inline ABI20_0_0YGValue *ABI20_0_0YGMarginLeadingValue(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGFlexDirection axis) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI20_0_0YGEdgeStart].unit != ABI20_0_0YGUnitUndefined) {
    return &node->style.margin[ABI20_0_0YGEdgeStart];
  } else {
    return &node->style.margin[leading[axis]];
  }
}

static inline ABI20_0_0YGValue *ABI20_0_0YGMarginTrailingValue(const ABI20_0_0YGNodeRef node, const ABI20_0_0YGFlexDirection axis) {
  if (ABI20_0_0YGFlexDirectionIsRow(axis) && node->style.margin[ABI20_0_0YGEdgeEnd].unit != ABI20_0_0YGUnitUndefined) {
    return &node->style.margin[ABI20_0_0YGEdgeEnd];
  } else {
    return &node->style.margin[trailing[axis]];
  }
}

// Like ABI20_0_0YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static inline float ABI20_0_0YGNodeBoundAxis(const ABI20_0_0YGNodeRef node,
                                    const ABI20_0_0YGFlexDirection axis,
                                    const float value,
                                    const float axisSize,
                                    const float widthSize) {
  return fmaxf(ABI20_0_0YGNodeBoundAxisWithinMinAndMax(node, axis, value, axisSize),
               ABI20_0_0YGNodePaddingAndBorderForAxis(node, axis, widthSize));
}

static void ABI20_0_0YGNodeSetChildTrailingPosition(const ABI20_0_0YGNodeRef node,
                                           const ABI20_0_0YGNodeRef child,
                                           const ABI20_0_0YGFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float ABI20_0_0YGNodeRelativePosition(const ABI20_0_0YGNodeRef node,
                                    const ABI20_0_0YGFlexDirection axis,
                                    const float axisSize) {
  return ABI20_0_0YGNodeIsLeadingPosDefined(node, axis) ? ABI20_0_0YGNodeLeadingPosition(node, axis, axisSize)
                                               : -ABI20_0_0YGNodeTrailingPosition(node, axis, axisSize);
}

static void ABI20_0_0YGConstrainMaxSizeForMode(const ABI20_0_0YGNodeRef node,
                                      const enum ABI20_0_0YGFlexDirection axis,
                                      const float parentAxisSize,
                                      const float parentWidth,
                                      ABI20_0_0YGMeasureMode *mode,
                                      float *size) {
  const float maxSize = ABI20_0_0YGResolveValue(&node->style.maxDimensions[dim[axis]], parentAxisSize) +
                        ABI20_0_0YGNodeMarginForAxis(node, axis, parentWidth);
  switch (*mode) {
    case ABI20_0_0YGMeasureModeExactly:
    case ABI20_0_0YGMeasureModeAtMost:
      *size = (ABI20_0_0YGFloatIsUndefined(maxSize) || *size < maxSize) ? *size : maxSize;
      break;
    case ABI20_0_0YGMeasureModeUndefined:
      if (!ABI20_0_0YGFloatIsUndefined(maxSize)) {
        *mode = ABI20_0_0YGMeasureModeAtMost;
        *size = maxSize;
      }
      break;
  }
}

static void ABI20_0_0YGNodeSetPosition(const ABI20_0_0YGNodeRef node,
                              const ABI20_0_0YGDirection direction,
                              const float mainSize,
                              const float crossSize,
                              const float parentWidth) {
  /* Root nodes should be always layouted as LTR, so we don't return negative values. */
  const ABI20_0_0YGDirection directionRespectingRoot = node->parent != NULL ? direction : ABI20_0_0YGDirectionLTR;
  const ABI20_0_0YGFlexDirection mainAxis =
      ABI20_0_0YGResolveFlexDirection(node->style.flexDirection, directionRespectingRoot);
  const ABI20_0_0YGFlexDirection crossAxis = ABI20_0_0YGFlexDirectionCross(mainAxis, directionRespectingRoot);

  const float relativePositionMain = ABI20_0_0YGNodeRelativePosition(node, mainAxis, mainSize);
  const float relativePositionCross = ABI20_0_0YGNodeRelativePosition(node, crossAxis, crossSize);

  node->layout.position[leading[mainAxis]] =
      ABI20_0_0YGNodeLeadingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[trailing[mainAxis]] =
      ABI20_0_0YGNodeTrailingMargin(node, mainAxis, parentWidth) + relativePositionMain;
  node->layout.position[leading[crossAxis]] =
      ABI20_0_0YGNodeLeadingMargin(node, crossAxis, parentWidth) + relativePositionCross;
  node->layout.position[trailing[crossAxis]] =
      ABI20_0_0YGNodeTrailingMargin(node, crossAxis, parentWidth) + relativePositionCross;
}

static void ABI20_0_0YGNodeComputeFlexBasisForChild(const ABI20_0_0YGNodeRef node,
                                           const ABI20_0_0YGNodeRef child,
                                           const float width,
                                           const ABI20_0_0YGMeasureMode widthMode,
                                           const float height,
                                           const float parentWidth,
                                           const float parentHeight,
                                           const ABI20_0_0YGMeasureMode heightMode,
                                           const ABI20_0_0YGDirection direction,
                                           const ABI20_0_0YGConfigRef config) {
  const ABI20_0_0YGFlexDirection mainAxis = ABI20_0_0YGResolveFlexDirection(node->style.flexDirection, direction);
  const bool isMainAxisRow = ABI20_0_0YGFlexDirectionIsRow(mainAxis);
  const float mainAxisSize = isMainAxisRow ? width : height;
  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;

  float childWidth;
  float childHeight;
  ABI20_0_0YGMeasureMode childWidthMeasureMode;
  ABI20_0_0YGMeasureMode childHeightMeasureMode;

  const float resolvedFlexBasis =
      ABI20_0_0YGResolveValue(ABI20_0_0YGNodeResolveFlexBasisPtr(child), mainAxisParentSize);
  const bool isRowStyleDimDefined = ABI20_0_0YGNodeIsStyleDimDefined(child, ABI20_0_0YGFlexDirectionRow, parentWidth);
  const bool isColumnStyleDimDefined =
      ABI20_0_0YGNodeIsStyleDimDefined(child, ABI20_0_0YGFlexDirectionColumn, parentHeight);

  if (!ABI20_0_0YGFloatIsUndefined(resolvedFlexBasis) && !ABI20_0_0YGFloatIsUndefined(mainAxisSize)) {
    if (ABI20_0_0YGFloatIsUndefined(child->layout.computedFlexBasis) ||
        (ABI20_0_0YGConfigIsExperimentalFeatureEnabled(child->config, ABI20_0_0YGExperimentalFeatureWebFlexBasis) &&
         child->layout.computedFlexBasisGeneration != gCurrentGenerationCount)) {
      child->layout.computedFlexBasis =
          fmaxf(resolvedFlexBasis, ABI20_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(ABI20_0_0YGResolveValue(child->resolvedDimensions[ABI20_0_0YGDimensionWidth], parentWidth),
              ABI20_0_0YGNodePaddingAndBorderForAxis(child, ABI20_0_0YGFlexDirectionRow, parentWidth));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(ABI20_0_0YGResolveValue(child->resolvedDimensions[ABI20_0_0YGDimensionHeight], parentHeight),
              ABI20_0_0YGNodePaddingAndBorderForAxis(child, ABI20_0_0YGFlexDirectionColumn, parentWidth));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = ABI20_0_0YGUndefined;
    childHeight = ABI20_0_0YGUndefined;
    childWidthMeasureMode = ABI20_0_0YGMeasureModeUndefined;
    childHeightMeasureMode = ABI20_0_0YGMeasureModeUndefined;

    const float marginRow = ABI20_0_0YGNodeMarginForAxis(child, ABI20_0_0YGFlexDirectionRow, parentWidth);
    const float marginColumn = ABI20_0_0YGNodeMarginForAxis(child, ABI20_0_0YGFlexDirectionColumn, parentWidth);

    if (isRowStyleDimDefined) {
      childWidth =
          ABI20_0_0YGResolveValue(child->resolvedDimensions[ABI20_0_0YGDimensionWidth], parentWidth) + marginRow;
      childWidthMeasureMode = ABI20_0_0YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight =
          ABI20_0_0YGResolveValue(child->resolvedDimensions[ABI20_0_0YGDimensionHeight], parentHeight) + marginColumn;
      childHeightMeasureMode = ABI20_0_0YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->style.overflow == ABI20_0_0YGOverflowScroll) ||
        node->style.overflow != ABI20_0_0YGOverflowScroll) {
      if (ABI20_0_0YGFloatIsUndefined(childWidth) && !ABI20_0_0YGFloatIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = ABI20_0_0YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->style.overflow == ABI20_0_0YGOverflowScroll) ||
        node->style.overflow != ABI20_0_0YGOverflowScroll) {
      if (ABI20_0_0YGFloatIsUndefined(childHeight) && !ABI20_0_0YGFloatIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = ABI20_0_0YGMeasureModeAtMost;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width
    if (!isMainAxisRow && !ABI20_0_0YGFloatIsUndefined(width) && !isRowStyleDimDefined &&
        widthMode == ABI20_0_0YGMeasureModeExactly && ABI20_0_0YGNodeAlignItem(node, child) == ABI20_0_0YGAlignStretch) {
      childWidth = width;
      childWidthMeasureMode = ABI20_0_0YGMeasureModeExactly;
    }
    if (isMainAxisRow && !ABI20_0_0YGFloatIsUndefined(height) && !isColumnStyleDimDefined &&
        heightMode == ABI20_0_0YGMeasureModeExactly && ABI20_0_0YGNodeAlignItem(node, child) == ABI20_0_0YGAlignStretch) {
      childHeight = height;
      childHeightMeasureMode = ABI20_0_0YGMeasureModeExactly;
    }

    if (!ABI20_0_0YGFloatIsUndefined(child->style.aspectRatio)) {
      if (!isMainAxisRow && childWidthMeasureMode == ABI20_0_0YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf((childWidth - marginRow) / child->style.aspectRatio,
                  ABI20_0_0YGNodePaddingAndBorderForAxis(child, ABI20_0_0YGFlexDirectionColumn, parentWidth));
        return;
      } else if (isMainAxisRow && childHeightMeasureMode == ABI20_0_0YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf((childHeight - marginColumn) * child->style.aspectRatio,
                  ABI20_0_0YGNodePaddingAndBorderForAxis(child, ABI20_0_0YGFlexDirectionRow, parentWidth));
        return;
      }
    }

    ABI20_0_0YGConstrainMaxSizeForMode(
        child, ABI20_0_0YGFlexDirectionRow, parentWidth, parentWidth, &childWidthMeasureMode, &childWidth);
    ABI20_0_0YGConstrainMaxSizeForMode(child,
                              ABI20_0_0YGFlexDirectionColumn,
                              parentHeight,
                              parentWidth,
                              &childHeightMeasureMode,
                              &childHeight);

    // Measure the child
    ABI20_0_0YGLayoutNodeInternal(child,
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
              ABI20_0_0YGNodePaddingAndBorderForAxis(child, mainAxis, parentWidth));
  }

  child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
}

static void ABI20_0_0YGNodeAbsoluteLayoutChild(const ABI20_0_0YGNodeRef node,
                                      const ABI20_0_0YGNodeRef child,
                                      const float width,
                                      const ABI20_0_0YGMeasureMode widthMode,
                                      const float height,
                                      const ABI20_0_0YGDirection direction,
                                      const ABI20_0_0YGConfigRef config) {
  const ABI20_0_0YGFlexDirection mainAxis = ABI20_0_0YGResolveFlexDirection(node->style.flexDirection, direction);
  const ABI20_0_0YGFlexDirection crossAxis = ABI20_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI20_0_0YGFlexDirectionIsRow(mainAxis);

  float childWidth = ABI20_0_0YGUndefined;
  float childHeight = ABI20_0_0YGUndefined;
  ABI20_0_0YGMeasureMode childWidthMeasureMode = ABI20_0_0YGMeasureModeUndefined;
  ABI20_0_0YGMeasureMode childHeightMeasureMode = ABI20_0_0YGMeasureModeUndefined;

  const float marginRow = ABI20_0_0YGNodeMarginForAxis(child, ABI20_0_0YGFlexDirectionRow, width);
  const float marginColumn = ABI20_0_0YGNodeMarginForAxis(child, ABI20_0_0YGFlexDirectionColumn, width);

  if (ABI20_0_0YGNodeIsStyleDimDefined(child, ABI20_0_0YGFlexDirectionRow, width)) {
    childWidth = ABI20_0_0YGResolveValue(child->resolvedDimensions[ABI20_0_0YGDimensionWidth], width) + marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (ABI20_0_0YGNodeIsLeadingPosDefined(child, ABI20_0_0YGFlexDirectionRow) &&
        ABI20_0_0YGNodeIsTrailingPosDefined(child, ABI20_0_0YGFlexDirectionRow)) {
      childWidth = node->layout.measuredDimensions[ABI20_0_0YGDimensionWidth] -
                   (ABI20_0_0YGNodeLeadingBorder(node, ABI20_0_0YGFlexDirectionRow) +
                    ABI20_0_0YGNodeTrailingBorder(node, ABI20_0_0YGFlexDirectionRow)) -
                   (ABI20_0_0YGNodeLeadingPosition(child, ABI20_0_0YGFlexDirectionRow, width) +
                    ABI20_0_0YGNodeTrailingPosition(child, ABI20_0_0YGFlexDirectionRow, width));
      childWidth = ABI20_0_0YGNodeBoundAxis(child, ABI20_0_0YGFlexDirectionRow, childWidth, width, width);
    }
  }

  if (ABI20_0_0YGNodeIsStyleDimDefined(child, ABI20_0_0YGFlexDirectionColumn, height)) {
    childHeight =
        ABI20_0_0YGResolveValue(child->resolvedDimensions[ABI20_0_0YGDimensionHeight], height) + marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (ABI20_0_0YGNodeIsLeadingPosDefined(child, ABI20_0_0YGFlexDirectionColumn) &&
        ABI20_0_0YGNodeIsTrailingPosDefined(child, ABI20_0_0YGFlexDirectionColumn)) {
      childHeight = node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] -
                    (ABI20_0_0YGNodeLeadingBorder(node, ABI20_0_0YGFlexDirectionColumn) +
                     ABI20_0_0YGNodeTrailingBorder(node, ABI20_0_0YGFlexDirectionColumn)) -
                    (ABI20_0_0YGNodeLeadingPosition(child, ABI20_0_0YGFlexDirectionColumn, height) +
                     ABI20_0_0YGNodeTrailingPosition(child, ABI20_0_0YGFlexDirectionColumn, height));
      childHeight = ABI20_0_0YGNodeBoundAxis(child, ABI20_0_0YGFlexDirectionColumn, childHeight, height, width);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (ABI20_0_0YGFloatIsUndefined(childWidth) ^ ABI20_0_0YGFloatIsUndefined(childHeight)) {
    if (!ABI20_0_0YGFloatIsUndefined(child->style.aspectRatio)) {
      if (ABI20_0_0YGFloatIsUndefined(childWidth)) {
        childWidth =
            marginRow + fmaxf((childHeight - marginColumn) * child->style.aspectRatio,
                              ABI20_0_0YGNodePaddingAndBorderForAxis(child, ABI20_0_0YGFlexDirectionColumn, width));
      } else if (ABI20_0_0YGFloatIsUndefined(childHeight)) {
        childHeight =
            marginColumn + fmaxf((childWidth - marginRow) / child->style.aspectRatio,
                                 ABI20_0_0YGNodePaddingAndBorderForAxis(child, ABI20_0_0YGFlexDirectionRow, width));
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (ABI20_0_0YGFloatIsUndefined(childWidth) || ABI20_0_0YGFloatIsUndefined(childHeight)) {
    childWidthMeasureMode =
        ABI20_0_0YGFloatIsUndefined(childWidth) ? ABI20_0_0YGMeasureModeUndefined : ABI20_0_0YGMeasureModeExactly;
    childHeightMeasureMode =
        ABI20_0_0YGFloatIsUndefined(childHeight) ? ABI20_0_0YGMeasureModeUndefined : ABI20_0_0YGMeasureModeExactly;

    // If the size of the parent is defined then try to constrain the absolute child to that size
    // as well. This allows text within the absolute child to wrap to the size of its parent.
    // This is the same behavior as many browsers implement.
    if (!isMainAxisRow && ABI20_0_0YGFloatIsUndefined(childWidth) && widthMode != ABI20_0_0YGMeasureModeUndefined &&
        width > 0) {
      childWidth = width;
      childWidthMeasureMode = ABI20_0_0YGMeasureModeAtMost;
    }

    ABI20_0_0YGLayoutNodeInternal(child,
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
    childWidth = child->layout.measuredDimensions[ABI20_0_0YGDimensionWidth] +
                 ABI20_0_0YGNodeMarginForAxis(child, ABI20_0_0YGFlexDirectionRow, width);
    childHeight = child->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] +
                  ABI20_0_0YGNodeMarginForAxis(child, ABI20_0_0YGFlexDirectionColumn, width);
  }

  ABI20_0_0YGLayoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       ABI20_0_0YGMeasureModeExactly,
                       ABI20_0_0YGMeasureModeExactly,
                       childWidth,
                       childHeight,
                       true,
                       "abs-layout",
                       config);

  if (ABI20_0_0YGNodeIsTrailingPosDefined(child, mainAxis) && !ABI20_0_0YGNodeIsLeadingPosDefined(child, mainAxis)) {
    child->layout.position[leading[mainAxis]] = node->layout.measuredDimensions[dim[mainAxis]] -
                                                child->layout.measuredDimensions[dim[mainAxis]] -
                                                ABI20_0_0YGNodeTrailingBorder(node, mainAxis) -
                                                ABI20_0_0YGNodeTrailingMargin(child, mainAxis, width) -
                                                ABI20_0_0YGNodeTrailingPosition(child, mainAxis, isMainAxisRow ? width : height);
  } else if (!ABI20_0_0YGNodeIsLeadingPosDefined(child, mainAxis) &&
             node->style.justifyContent == ABI20_0_0YGJustifyCenter) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]) /
                                                2.0f;
  } else if (!ABI20_0_0YGNodeIsLeadingPosDefined(child, mainAxis) &&
             node->style.justifyContent == ABI20_0_0YGJustifyFlexEnd) {
    child->layout.position[leading[mainAxis]] = (node->layout.measuredDimensions[dim[mainAxis]] -
                                                 child->layout.measuredDimensions[dim[mainAxis]]);
  }

  if (ABI20_0_0YGNodeIsTrailingPosDefined(child, crossAxis) &&
      !ABI20_0_0YGNodeIsLeadingPosDefined(child, crossAxis)) {
    child->layout.position[leading[crossAxis]] = node->layout.measuredDimensions[dim[crossAxis]] -
                                                 child->layout.measuredDimensions[dim[crossAxis]] -
                                                 ABI20_0_0YGNodeTrailingBorder(node, crossAxis) -
                                                 ABI20_0_0YGNodeTrailingMargin(child, crossAxis, width) -
                                                 ABI20_0_0YGNodeTrailingPosition(child, crossAxis, isMainAxisRow ? height : width);
  } else if (!ABI20_0_0YGNodeIsLeadingPosDefined(child, crossAxis) &&
             ABI20_0_0YGNodeAlignItem(node, child) == ABI20_0_0YGAlignCenter) {
    child->layout.position[leading[crossAxis]] =
        (node->layout.measuredDimensions[dim[crossAxis]] -
         child->layout.measuredDimensions[dim[crossAxis]]) /
        2.0f;
  } else if (!ABI20_0_0YGNodeIsLeadingPosDefined(child, crossAxis) &&
             ((ABI20_0_0YGNodeAlignItem(node, child) == ABI20_0_0YGAlignFlexEnd) ^ (node->style.flexWrap == ABI20_0_0YGWrapWrapReverse))) {
    child->layout.position[leading[crossAxis]] = (node->layout.measuredDimensions[dim[crossAxis]] -
                                                  child->layout.measuredDimensions[dim[crossAxis]]);
  }
}

static void ABI20_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(const ABI20_0_0YGNodeRef node,
                                                       const float availableWidth,
                                                       const float availableHeight,
                                                       const ABI20_0_0YGMeasureMode widthMeasureMode,
                                                       const ABI20_0_0YGMeasureMode heightMeasureMode,
                                                       const float parentWidth,
                                                       const float parentHeight) {
  ABI20_0_0YGAssertWithNode(node, node->measure != NULL, "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow =
      ABI20_0_0YGNodePaddingAndBorderForAxis(node, ABI20_0_0YGFlexDirectionRow, availableWidth);
  const float paddingAndBorderAxisColumn =
      ABI20_0_0YGNodePaddingAndBorderForAxis(node, ABI20_0_0YGFlexDirectionColumn, availableWidth);
  const float marginAxisRow = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionRow, availableWidth);
  const float marginAxisColumn = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionColumn, availableWidth);

  // We want to make sure we don't call measure with negative size
  const float innerWidth = ABI20_0_0YGFloatIsUndefined(availableWidth)
                            ? availableWidth
                            : fmaxf(0, availableWidth - marginAxisRow - paddingAndBorderAxisRow);
  const float innerHeight = ABI20_0_0YGFloatIsUndefined(availableHeight)
                            ? availableHeight
                            : fmaxf(0, availableHeight - marginAxisColumn - paddingAndBorderAxisColumn);

  if (widthMeasureMode == ABI20_0_0YGMeasureModeExactly && heightMeasureMode == ABI20_0_0YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->layout.measuredDimensions[ABI20_0_0YGDimensionWidth] = ABI20_0_0YGNodeBoundAxis(
        node, ABI20_0_0YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
    node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] = ABI20_0_0YGNodeBoundAxis(
        node, ABI20_0_0YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);
  } else {
    // Measure the text under the current constraints.
    const ABI20_0_0YGSize measuredSize =
        node->measure(node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->layout.measuredDimensions[ABI20_0_0YGDimensionWidth] =
        ABI20_0_0YGNodeBoundAxis(node,
                        ABI20_0_0YGFlexDirectionRow,
                        (widthMeasureMode == ABI20_0_0YGMeasureModeUndefined ||
                         widthMeasureMode == ABI20_0_0YGMeasureModeAtMost)
                            ? measuredSize.width + paddingAndBorderAxisRow
                            : availableWidth - marginAxisRow,
                        availableWidth,
                        availableWidth);
    node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] =
        ABI20_0_0YGNodeBoundAxis(node,
                        ABI20_0_0YGFlexDirectionColumn,
                        (heightMeasureMode == ABI20_0_0YGMeasureModeUndefined ||
                         heightMeasureMode == ABI20_0_0YGMeasureModeAtMost)
                            ? measuredSize.height + paddingAndBorderAxisColumn
                            : availableHeight - marginAxisColumn,
                        availableHeight,
                        availableWidth);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void ABI20_0_0YGNodeEmptyContainerSetMeasuredDimensions(const ABI20_0_0YGNodeRef node,
                                                      const float availableWidth,
                                                      const float availableHeight,
                                                      const ABI20_0_0YGMeasureMode widthMeasureMode,
                                                      const ABI20_0_0YGMeasureMode heightMeasureMode,
                                                      const float parentWidth,
                                                      const float parentHeight) {
  const float paddingAndBorderAxisRow =
      ABI20_0_0YGNodePaddingAndBorderForAxis(node, ABI20_0_0YGFlexDirectionRow, parentWidth);
  const float paddingAndBorderAxisColumn =
      ABI20_0_0YGNodePaddingAndBorderForAxis(node, ABI20_0_0YGFlexDirectionColumn, parentWidth);
  const float marginAxisRow = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionColumn, parentWidth);

  node->layout.measuredDimensions[ABI20_0_0YGDimensionWidth] =
      ABI20_0_0YGNodeBoundAxis(node,
                      ABI20_0_0YGFlexDirectionRow,
                      (widthMeasureMode == ABI20_0_0YGMeasureModeUndefined ||
                       widthMeasureMode == ABI20_0_0YGMeasureModeAtMost)
                          ? paddingAndBorderAxisRow
                          : availableWidth - marginAxisRow,
                      parentWidth,
                      parentWidth);
  node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] =
      ABI20_0_0YGNodeBoundAxis(node,
                      ABI20_0_0YGFlexDirectionColumn,
                      (heightMeasureMode == ABI20_0_0YGMeasureModeUndefined ||
                       heightMeasureMode == ABI20_0_0YGMeasureModeAtMost)
                          ? paddingAndBorderAxisColumn
                          : availableHeight - marginAxisColumn,
                      parentHeight,
                      parentWidth);
}

static bool ABI20_0_0YGNodeFixedSizeSetMeasuredDimensions(const ABI20_0_0YGNodeRef node,
                                                 const float availableWidth,
                                                 const float availableHeight,
                                                 const ABI20_0_0YGMeasureMode widthMeasureMode,
                                                 const ABI20_0_0YGMeasureMode heightMeasureMode,
                                                 const float parentWidth,
                                                 const float parentHeight) {
  if ((widthMeasureMode == ABI20_0_0YGMeasureModeAtMost && availableWidth <= 0.0f) ||
      (heightMeasureMode == ABI20_0_0YGMeasureModeAtMost && availableHeight <= 0.0f) ||
      (widthMeasureMode == ABI20_0_0YGMeasureModeExactly && heightMeasureMode == ABI20_0_0YGMeasureModeExactly)) {
    const float marginAxisColumn = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionColumn, parentWidth);
    const float marginAxisRow = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionRow, parentWidth);

    node->layout.measuredDimensions[ABI20_0_0YGDimensionWidth] =
        ABI20_0_0YGNodeBoundAxis(node,
                        ABI20_0_0YGFlexDirectionRow,
                        ABI20_0_0YGFloatIsUndefined(availableWidth) ||
                                (widthMeasureMode == ABI20_0_0YGMeasureModeAtMost && availableWidth < 0.0f)
                            ? 0.0f
                            : availableWidth - marginAxisRow,
                        parentWidth,
                        parentWidth);

    node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] =
        ABI20_0_0YGNodeBoundAxis(node,
                        ABI20_0_0YGFlexDirectionColumn,
                        ABI20_0_0YGFloatIsUndefined(availableHeight) ||
                                (heightMeasureMode == ABI20_0_0YGMeasureModeAtMost && availableHeight < 0.0f)
                            ? 0.0f
                            : availableHeight - marginAxisColumn,
                        parentHeight,
                        parentWidth);

    return true;
  }

  return false;
}

static void ABI20_0_0YGZeroOutLayoutRecursivly(const ABI20_0_0YGNodeRef node) {
  node->layout.dimensions[ABI20_0_0YGDimensionHeight] = 0;
  node->layout.dimensions[ABI20_0_0YGDimensionWidth] = 0;
  node->layout.position[ABI20_0_0YGEdgeTop] = 0;
  node->layout.position[ABI20_0_0YGEdgeBottom] = 0;
  node->layout.position[ABI20_0_0YGEdgeLeft] = 0;
  node->layout.position[ABI20_0_0YGEdgeRight] = 0;
  node->layout.cachedLayout.availableHeight = 0;
  node->layout.cachedLayout.availableWidth = 0;
  node->layout.cachedLayout.heightMeasureMode = ABI20_0_0YGMeasureModeExactly;
  node->layout.cachedLayout.widthMeasureMode = ABI20_0_0YGMeasureModeExactly;
  node->layout.cachedLayout.computedWidth = 0;
  node->layout.cachedLayout.computedHeight = 0;
  node->hasNewLayout = true;
  const uint32_t childCount = ABI20_0_0YGNodeGetChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, i);
    ABI20_0_0YGZeroOutLayoutRecursivly(child);
  }
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C ABI20_0_0YG documentation: https://www.w3.org/TR/ABI20_0_0YG3-flexbox/.
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
//      or ABI20_0_0YGUndefined if the size is not available; interpretation depends on
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
//    from the spec (https://www.w3.org/TR/ABI20_0_0YG3-sizing/#terms):
//      - ABI20_0_0YGMeasureModeUndefined: max content
//      - ABI20_0_0YGMeasureModeExactly: fill available
//      - ABI20_0_0YGMeasureModeAtMost: fit content
//
//    When calling ABI20_0_0YGNodelayoutImpl and ABI20_0_0YGLayoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of ABI20_0_0YGMeasureModeUndefined
//    in that dimension.
//
static void ABI20_0_0YGNodelayoutImpl(const ABI20_0_0YGNodeRef node,
                             const float availableWidth,
                             const float availableHeight,
                             const ABI20_0_0YGDirection parentDirection,
                             const ABI20_0_0YGMeasureMode widthMeasureMode,
                             const ABI20_0_0YGMeasureMode heightMeasureMode,
                             const float parentWidth,
                             const float parentHeight,
                             const bool performLayout,
                             const ABI20_0_0YGConfigRef config) {
  ABI20_0_0YGAssertWithNode(node,
                   ABI20_0_0YGFloatIsUndefined(availableWidth) ? widthMeasureMode == ABI20_0_0YGMeasureModeUndefined
                                                      : true,
                   "availableWidth is indefinite so widthMeasureMode must be "
                   "ABI20_0_0YGMeasureModeUndefined");
  ABI20_0_0YGAssertWithNode(node,
                   ABI20_0_0YGFloatIsUndefined(availableHeight) ? heightMeasureMode == ABI20_0_0YGMeasureModeUndefined
                                                       : true,
                   "availableHeight is indefinite so heightMeasureMode must be "
                   "ABI20_0_0YGMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const ABI20_0_0YGDirection direction = ABI20_0_0YGNodeResolveDirection(node, parentDirection);
  node->layout.direction = direction;

  const ABI20_0_0YGFlexDirection flexRowDirection = ABI20_0_0YGResolveFlexDirection(ABI20_0_0YGFlexDirectionRow, direction);
  const ABI20_0_0YGFlexDirection flexColumnDirection =
      ABI20_0_0YGResolveFlexDirection(ABI20_0_0YGFlexDirectionColumn, direction);

  node->layout.margin[ABI20_0_0YGEdgeStart] = ABI20_0_0YGNodeLeadingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[ABI20_0_0YGEdgeEnd] = ABI20_0_0YGNodeTrailingMargin(node, flexRowDirection, parentWidth);
  node->layout.margin[ABI20_0_0YGEdgeTop] = ABI20_0_0YGNodeLeadingMargin(node, flexColumnDirection, parentWidth);
  node->layout.margin[ABI20_0_0YGEdgeBottom] = ABI20_0_0YGNodeTrailingMargin(node, flexColumnDirection, parentWidth);

  node->layout.border[ABI20_0_0YGEdgeStart] = ABI20_0_0YGNodeLeadingBorder(node, flexRowDirection);
  node->layout.border[ABI20_0_0YGEdgeEnd] = ABI20_0_0YGNodeTrailingBorder(node, flexRowDirection);
  node->layout.border[ABI20_0_0YGEdgeTop] = ABI20_0_0YGNodeLeadingBorder(node, flexColumnDirection);
  node->layout.border[ABI20_0_0YGEdgeBottom] = ABI20_0_0YGNodeTrailingBorder(node, flexColumnDirection);

  node->layout.padding[ABI20_0_0YGEdgeStart] = ABI20_0_0YGNodeLeadingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[ABI20_0_0YGEdgeEnd] = ABI20_0_0YGNodeTrailingPadding(node, flexRowDirection, parentWidth);
  node->layout.padding[ABI20_0_0YGEdgeTop] = ABI20_0_0YGNodeLeadingPadding(node, flexColumnDirection, parentWidth);
  node->layout.padding[ABI20_0_0YGEdgeBottom] =
      ABI20_0_0YGNodeTrailingPadding(node, flexColumnDirection, parentWidth);

  if (node->measure) {
    ABI20_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(node,
                                               availableWidth,
                                               availableHeight,
                                               widthMeasureMode,
                                               heightMeasureMode,
                                               parentWidth,
                                               parentHeight);
    return;
  }

  const uint32_t childCount = ABI20_0_0YGNodeListCount(node->children);
  if (childCount == 0) {
    ABI20_0_0YGNodeEmptyContainerSetMeasuredDimensions(node,
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
  if (!performLayout && ABI20_0_0YGNodeFixedSizeSetMeasuredDimensions(node,
                                                             availableWidth,
                                                             availableHeight,
                                                             widthMeasureMode,
                                                             heightMeasureMode,
                                                             parentWidth,
                                                             parentHeight)) {
    return;
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const ABI20_0_0YGFlexDirection mainAxis = ABI20_0_0YGResolveFlexDirection(node->style.flexDirection, direction);
  const ABI20_0_0YGFlexDirection crossAxis = ABI20_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI20_0_0YGFlexDirectionIsRow(mainAxis);
  const ABI20_0_0YGJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap != ABI20_0_0YGWrapNoWrap;

  const float mainAxisParentSize = isMainAxisRow ? parentWidth : parentHeight;
  const float crossAxisParentSize = isMainAxisRow ? parentHeight : parentWidth;

  ABI20_0_0YGNodeRef firstAbsoluteChild = NULL;
  ABI20_0_0YGNodeRef currentAbsoluteChild = NULL;

  const float leadingPaddingAndBorderMain =
      ABI20_0_0YGNodeLeadingPaddingAndBorder(node, mainAxis, parentWidth);
  const float trailingPaddingAndBorderMain =
      ABI20_0_0YGNodeTrailingPaddingAndBorder(node, mainAxis, parentWidth);
  const float leadingPaddingAndBorderCross =
      ABI20_0_0YGNodeLeadingPaddingAndBorder(node, crossAxis, parentWidth);
  const float paddingAndBorderAxisMain = ABI20_0_0YGNodePaddingAndBorderForAxis(node, mainAxis, parentWidth);
  const float paddingAndBorderAxisCross =
      ABI20_0_0YGNodePaddingAndBorderForAxis(node, crossAxis, parentWidth);

  ABI20_0_0YGMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  ABI20_0_0YGMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow =
      isMainAxisRow ? paddingAndBorderAxisMain : paddingAndBorderAxisCross;
  const float paddingAndBorderAxisColumn =
      isMainAxisRow ? paddingAndBorderAxisCross : paddingAndBorderAxisMain;

  const float marginAxisRow = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionRow, parentWidth);
  const float marginAxisColumn = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionColumn, parentWidth);

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  const float minInnerWidth =
      ABI20_0_0YGResolveValue(&node->style.minDimensions[ABI20_0_0YGDimensionWidth], parentWidth) - marginAxisRow -
      paddingAndBorderAxisRow;
  const float maxInnerWidth =
      ABI20_0_0YGResolveValue(&node->style.maxDimensions[ABI20_0_0YGDimensionWidth], parentWidth) - marginAxisRow -
      paddingAndBorderAxisRow;
  const float minInnerHeight =
      ABI20_0_0YGResolveValue(&node->style.minDimensions[ABI20_0_0YGDimensionHeight], parentHeight) -
      marginAxisColumn - paddingAndBorderAxisColumn;
  const float maxInnerHeight =
      ABI20_0_0YGResolveValue(&node->style.maxDimensions[ABI20_0_0YGDimensionHeight], parentHeight) -
      marginAxisColumn - paddingAndBorderAxisColumn;
  const float minInnerMainDim = isMainAxisRow ? minInnerWidth : minInnerHeight;
  const float maxInnerMainDim = isMainAxisRow ? maxInnerWidth : maxInnerHeight;

  // Max dimension overrides predefined dimension value; Min dimension in turn overrides both of the
  // above
  float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  if (!ABI20_0_0YGFloatIsUndefined(availableInnerWidth)) {
    // We want to make sure our available width does not violate min and max constraints
    availableInnerWidth = fmaxf(fminf(availableInnerWidth, maxInnerWidth), minInnerWidth);
  }

  float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  if (!ABI20_0_0YGFloatIsUndefined(availableInnerHeight)) {
    // We want to make sure our available height does not violate min and max constraints
    availableInnerHeight = fmaxf(fminf(availableInnerHeight, maxInnerHeight), minInnerHeight);
  }

  float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // If there is only one child with flexGrow + flexShrink it means we can set the
  // computedFlexBasis to 0 instead of measuring and shrinking / flexing the child to exactly
  // match the remaining space
  ABI20_0_0YGNodeRef singleFlexChild = NULL;
  if (measureModeMainDim == ABI20_0_0YGMeasureModeExactly) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeGetChild(node, i);
      if (singleFlexChild) {
        if (ABI20_0_0YGNodeIsFlex(child)) {
          // There is already a flexible child, abort.
          singleFlexChild = NULL;
          break;
        }
      } else if (ABI20_0_0YGResolveFlexGrow(child) > 0.0f && ABI20_0_0YGNodeResolveFlexShrink(child) > 0.0f) {
        singleFlexChild = child;
      }
    }
  }

  float totalOuterFlexBasis = 0;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, i);
    if (child->style.display == ABI20_0_0YGDisplayNone) {
      ABI20_0_0YGZeroOutLayoutRecursivly(child);
      child->hasNewLayout = true;
      child->isDirty = false;
      continue;
    }
    ABI20_0_0YGResolveDimensions(child);
    if (performLayout) {
      // Set the initial position (relative to the parent).
      const ABI20_0_0YGDirection childDirection = ABI20_0_0YGNodeResolveDirection(child, direction);
      ABI20_0_0YGNodeSetPosition(child,
                        childDirection,
                        availableInnerMainDim,
                        availableInnerCrossDim,
                        availableInnerWidth);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == ABI20_0_0YGPositionTypeAbsolute) {
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
        ABI20_0_0YGNodeComputeFlexBasisForChild(node,
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

    totalOuterFlexBasis +=
        child->layout.computedFlexBasis + ABI20_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);
    ;
  }

  const bool flexBasisOverflows = measureModeMainDim == ABI20_0_0YGMeasureModeUndefined
                                      ? false
                                      : totalOuterFlexBasis > availableInnerMainDim;
  if (isNodeFlexWrap && flexBasisOverflows && measureModeMainDim == ABI20_0_0YGMeasureModeAtMost) {
    measureModeMainDim = ABI20_0_0YGMeasureModeExactly;
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
    float sizeConsumedOnCurrentLineIncludingMinConstraint = 0;

    float totalFlexGrowFactors = 0;
    float totalFlexShrinkScaledFactors = 0;

    // Maintain a linked list of the child nodes that can shrink and/or grow.
    ABI20_0_0YGNodeRef firstRelativeChild = NULL;
    ABI20_0_0YGNodeRef currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    for (uint32_t i = startOfLineIndex; i < childCount; i++, endOfLineIndex++) {
      const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, i);
      if (child->style.display == ABI20_0_0YGDisplayNone) {
        continue;
      }
      child->lineIndex = lineCount;

      if (child->style.positionType != ABI20_0_0YGPositionTypeAbsolute) {
        const float childMarginMainAxis = ABI20_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);
        const float flexBasisWithMaxConstraints =
            fminf(ABI20_0_0YGResolveValue(&child->style.maxDimensions[dim[mainAxis]], mainAxisParentSize),
                        child->layout.computedFlexBasis);
        const float flexBasisWithMinAndMaxConstraints =
            fmaxf(ABI20_0_0YGResolveValue(&child->style.minDimensions[dim[mainAxis]], mainAxisParentSize),
                  flexBasisWithMaxConstraints);

        // If this is a multi-line flow and this item pushes us over the
        // available size, we've
        // hit the end of the current line. Break out of the loop and lay out
        // the current line.
        if (sizeConsumedOnCurrentLineIncludingMinConstraint + flexBasisWithMinAndMaxConstraints +
                    childMarginMainAxis >
                availableInnerMainDim &&
            isNodeFlexWrap && itemsOnLine > 0) {
          break;
        }

        sizeConsumedOnCurrentLineIncludingMinConstraint +=
            flexBasisWithMinAndMaxConstraints + childMarginMainAxis;
        sizeConsumedOnCurrentLine += flexBasisWithMinAndMaxConstraints + childMarginMainAxis;
        itemsOnLine++;

        if (ABI20_0_0YGNodeIsFlex(child)) {
          totalFlexGrowFactors += ABI20_0_0YGResolveFlexGrow(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the child dimension.
          totalFlexShrinkScaledFactors +=
              -ABI20_0_0YGNodeResolveFlexShrink(child) * child->layout.computedFlexBasis;
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

    // The total flex factor needs to be floored to 1.
    if (totalFlexGrowFactors > 0 && totalFlexGrowFactors < 1) {
      totalFlexGrowFactors = 1;
    }

    // The total flex shrink factor needs to be floored to 1.
    if (totalFlexShrinkScaledFactors > 0 && totalFlexShrinkScaledFactors < 1) {
      totalFlexShrinkScaledFactors = 1;
    }

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex = !performLayout && measureModeCrossDim == ABI20_0_0YGMeasureModeExactly;

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
    if (measureModeMainDim != ABI20_0_0YGMeasureModeExactly) {
      if (!ABI20_0_0YGFloatIsUndefined(minInnerMainDim) && sizeConsumedOnCurrentLine < minInnerMainDim) {
        availableInnerMainDim = minInnerMainDim;
      } else if (!ABI20_0_0YGFloatIsUndefined(maxInnerMainDim) &&
                 sizeConsumedOnCurrentLine > maxInnerMainDim) {
        availableInnerMainDim = maxInnerMainDim;
      } else {
        if (!node->config->useLegacyStretchBehaviour &&
            (totalFlexGrowFactors == 0 || ABI20_0_0YGResolveFlexGrow(node) == 0)) {
          // If we don't have any children to flex or we can't flex the node itself,
          // space we've used is all space we need. Root node also should be shrunk to minimum
          availableInnerMainDim = sizeConsumedOnCurrentLine;
        }
      }
    }

    float remainingFreeSpace = 0;
    if (!ABI20_0_0YGFloatIsUndefined(availableInnerMainDim)) {
      remainingFreeSpace = availableInnerMainDim - sizeConsumedOnCurrentLine;
    } else if (sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized based on its
      // content.
      // sizeConsumedOnCurrentLine is negative which means the node will allocate 0 points for
      // its content. Consequently, remainingFreeSpace is 0 - sizeConsumedOnCurrentLine.
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
      // spec (https://www.w3.org/TR/ABI20_0_0YG-flexbox-1/#resolve-flexible-lengths)
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
        childFlexBasis =
            fminf(ABI20_0_0YGResolveValue(&currentRelativeChild->style.maxDimensions[dim[mainAxis]],
                                 mainAxisParentSize),
                  fmaxf(ABI20_0_0YGResolveValue(&currentRelativeChild->style.minDimensions[dim[mainAxis]],
                                       mainAxisParentSize),
                        currentRelativeChild->layout.computedFlexBasis));

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = -ABI20_0_0YGNodeResolveFlexShrink(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize =
                childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = ABI20_0_0YGNodeBoundAxis(currentRelativeChild,
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
          flexGrowFactor = ABI20_0_0YGResolveFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize =
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = ABI20_0_0YGNodeBoundAxis(currentRelativeChild,
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
        childFlexBasis =
            fminf(ABI20_0_0YGResolveValue(&currentRelativeChild->style.maxDimensions[dim[mainAxis]],
                                 mainAxisParentSize),
                  fmaxf(ABI20_0_0YGResolveValue(&currentRelativeChild->style.minDimensions[dim[mainAxis]],
                                       mainAxisParentSize),
                        currentRelativeChild->layout.computedFlexBasis));
        float updatedMainSize = childFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = -ABI20_0_0YGNodeResolveFlexShrink(currentRelativeChild) * childFlexBasis;
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

            updatedMainSize = ABI20_0_0YGNodeBoundAxis(currentRelativeChild,
                                              mainAxis,
                                              childSize,
                                              availableInnerMainDim,
                                              availableInnerWidth);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = ABI20_0_0YGResolveFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize =
                ABI20_0_0YGNodeBoundAxis(currentRelativeChild,
                                mainAxis,
                                childFlexBasis +
                                    remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor,
                                availableInnerMainDim,
                                availableInnerWidth);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        const float marginMain =
            ABI20_0_0YGNodeMarginForAxis(currentRelativeChild, mainAxis, availableInnerWidth);
        const float marginCross =
            ABI20_0_0YGNodeMarginForAxis(currentRelativeChild, crossAxis, availableInnerWidth);

        float childCrossSize;
        float childMainSize = updatedMainSize + marginMain;
        ABI20_0_0YGMeasureMode childCrossMeasureMode;
        ABI20_0_0YGMeasureMode childMainMeasureMode = ABI20_0_0YGMeasureModeExactly;

        if (!ABI20_0_0YGFloatIsUndefined(availableInnerCrossDim) &&
            !ABI20_0_0YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis, availableInnerCrossDim) &&
            measureModeCrossDim == ABI20_0_0YGMeasureModeExactly &&
            !(isNodeFlexWrap && flexBasisOverflows) &&
            ABI20_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI20_0_0YGAlignStretch) {
          childCrossSize = availableInnerCrossDim;
          childCrossMeasureMode = ABI20_0_0YGMeasureModeExactly;
        } else if (!ABI20_0_0YGNodeIsStyleDimDefined(currentRelativeChild,
                                            crossAxis,
                                            availableInnerCrossDim)) {
          childCrossSize = availableInnerCrossDim;
          childCrossMeasureMode =
              ABI20_0_0YGFloatIsUndefined(childCrossSize) ? ABI20_0_0YGMeasureModeUndefined : ABI20_0_0YGMeasureModeAtMost;
        } else {
          childCrossSize = ABI20_0_0YGResolveValue(currentRelativeChild->resolvedDimensions[dim[crossAxis]],
                                          availableInnerCrossDim) +
                           marginCross;
          const bool isLoosePercentageMeasurement =
              currentRelativeChild->resolvedDimensions[dim[crossAxis]]->unit == ABI20_0_0YGUnitPercent &&
              measureModeCrossDim != ABI20_0_0YGMeasureModeExactly;
          childCrossMeasureMode = ABI20_0_0YGFloatIsUndefined(childCrossSize) || isLoosePercentageMeasurement
                                      ? ABI20_0_0YGMeasureModeUndefined
                                      : ABI20_0_0YGMeasureModeExactly;
        }

        if (!ABI20_0_0YGFloatIsUndefined(currentRelativeChild->style.aspectRatio)) {
          childCrossSize = fmaxf(
              isMainAxisRow
                  ? (childMainSize - marginMain) / currentRelativeChild->style.aspectRatio
                  : (childMainSize - marginMain) * currentRelativeChild->style.aspectRatio,
              ABI20_0_0YGNodePaddingAndBorderForAxis(currentRelativeChild, crossAxis, availableInnerWidth));
          childCrossMeasureMode = ABI20_0_0YGMeasureModeExactly;

          // Parent size constraint should have higher priority than flex
          if (ABI20_0_0YGNodeIsFlex(currentRelativeChild)) {
            childCrossSize = fminf(childCrossSize - marginCross, availableInnerCrossDim);
            childMainSize =
                marginMain + (isMainAxisRow
                                  ? childCrossSize * currentRelativeChild->style.aspectRatio
                                  : childCrossSize / currentRelativeChild->style.aspectRatio);
          }

          childCrossSize += marginCross;
        }

        ABI20_0_0YGConstrainMaxSizeForMode(currentRelativeChild,
                                  mainAxis,
                                  availableInnerMainDim,
                                  availableInnerWidth,
                                  &childMainMeasureMode,
                                  &childMainSize);
        ABI20_0_0YGConstrainMaxSizeForMode(currentRelativeChild,
                                  crossAxis,
                                  availableInnerCrossDim,
                                  availableInnerWidth,
                                  &childCrossMeasureMode,
                                  &childCrossSize);

        const bool requiresStretchLayout =
            !ABI20_0_0YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis, availableInnerCrossDim) &&
            ABI20_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI20_0_0YGAlignStretch;

        const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
        const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

        const ABI20_0_0YGMeasureMode childWidthMeasureMode =
            isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;
        const ABI20_0_0YGMeasureMode childHeightMeasureMode =
            !isMainAxisRow ? childMainMeasureMode : childCrossMeasureMode;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        ABI20_0_0YGLayoutNodeInternal(currentRelativeChild,
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
        node->layout.hadOverflow = node->layout.hadOverflow || currentRelativeChild->layout.hadOverflow;

        currentRelativeChild = currentRelativeChild->nextChild;
      }
    }

    remainingFreeSpace = originalRemainingFreeSpace + deltaFreeSpace;
    node->layout.hadOverflow = node->layout.hadOverflow || (remainingFreeSpace < 0);

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis.
    // Their dimensions are also set in the cross axis with the exception of
    // items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    // If we are using "at most" rules in the main axis. Calculate the remaining space when
    // constraint by the min size defined for the main axis.

    if (measureModeMainDim == ABI20_0_0YGMeasureModeAtMost && remainingFreeSpace > 0) {
      if (node->style.minDimensions[dim[mainAxis]].unit != ABI20_0_0YGUnitUndefined &&
          ABI20_0_0YGResolveValue(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) >= 0) {
        remainingFreeSpace =
            fmaxf(0,
                  ABI20_0_0YGResolveValue(&node->style.minDimensions[dim[mainAxis]], mainAxisParentSize) -
                      (availableInnerMainDim - remainingFreeSpace));
      } else {
        remainingFreeSpace = 0;
      }
    }

    int numberOfAutoMarginsOnCurrentLine = 0;
    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, i);
      if (child->style.positionType == ABI20_0_0YGPositionTypeRelative) {
        if (ABI20_0_0YGMarginLeadingValue(child, mainAxis)->unit == ABI20_0_0YGUnitAuto) {
          numberOfAutoMarginsOnCurrentLine++;
        }
        if (ABI20_0_0YGMarginTrailingValue(child, mainAxis)->unit == ABI20_0_0YGUnitAuto) {
          numberOfAutoMarginsOnCurrentLine++;
        }
      }
    }

    if (numberOfAutoMarginsOnCurrentLine == 0) {
      switch (justifyContent) {
        case ABI20_0_0YGJustifyCenter:
          leadingMainDim = remainingFreeSpace / 2;
          break;
        case ABI20_0_0YGJustifyFlexEnd:
          leadingMainDim = remainingFreeSpace;
          break;
        case ABI20_0_0YGJustifySpaceBetween:
          if (itemsOnLine > 1) {
            betweenMainDim = fmaxf(remainingFreeSpace, 0) / (itemsOnLine - 1);
          } else {
            betweenMainDim = 0;
          }
          break;
        case ABI20_0_0YGJustifySpaceAround:
          // Space on the edges is half of the space between elements
          betweenMainDim = remainingFreeSpace / itemsOnLine;
          leadingMainDim = betweenMainDim / 2;
          break;
        case ABI20_0_0YGJustifyFlexStart:
          break;
      }
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, i);
      if (child->style.display == ABI20_0_0YGDisplayNone) {
        continue;
      }
      if (child->style.positionType == ABI20_0_0YGPositionTypeAbsolute &&
          ABI20_0_0YGNodeIsLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] =
              ABI20_0_0YGNodeLeadingPosition(child, mainAxis, availableInnerMainDim) +
              ABI20_0_0YGNodeLeadingBorder(node, mainAxis) +
              ABI20_0_0YGNodeLeadingMargin(child, mainAxis, availableInnerWidth);
        }
      } else {
        // Now that we placed the element, we need to update the variables.
        // We need to do that only for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.positionType == ABI20_0_0YGPositionTypeRelative) {
          if (ABI20_0_0YGMarginLeadingValue(child, mainAxis)->unit == ABI20_0_0YGUnitAuto) {
            mainDim += remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
          }

          if (performLayout) {
            child->layout.position[pos[mainAxis]] += mainDim;
          }

          if (ABI20_0_0YGMarginTrailingValue(child, mainAxis)->unit == ABI20_0_0YGUnitAuto) {
            mainDim += remainingFreeSpace / numberOfAutoMarginsOnCurrentLine;
          }

          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the
            // measuredDims because
            // they weren't computed. This means we can't call ABI20_0_0YGNodeDimWithMargin.
            mainDim += betweenMainDim + ABI20_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth) +
                       child->layout.computedFlexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus the spacing.
            mainDim += betweenMainDim + ABI20_0_0YGNodeDimWithMargin(child, mainAxis, availableInnerWidth);

            // The cross dimension is the max of the elements dimension since
            // there can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, ABI20_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth));
          }
        } else if (performLayout) {
          child->layout.position[pos[mainAxis]] +=
              ABI20_0_0YGNodeLeadingBorder(node, mainAxis) + leadingMainDim;
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == ABI20_0_0YGMeasureModeUndefined ||
        measureModeCrossDim == ABI20_0_0YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = ABI20_0_0YGNodeBoundAxis(node,
                                           crossAxis,
                                           crossDim + paddingAndBorderAxisCross,
                                           crossAxisParentSize,
                                           parentWidth) -
                           paddingAndBorderAxisCross;
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI20_0_0YGMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = ABI20_0_0YGNodeBoundAxis(node,
                               crossAxis,
                               crossDim + paddingAndBorderAxisCross,
                               crossAxisParentSize,
                               parentWidth) -
               paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, i);
        if (child->style.display == ABI20_0_0YGDisplayNone) {
          continue;
        }
        if (child->style.positionType == ABI20_0_0YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          if (ABI20_0_0YGNodeIsLeadingPosDefined(child, crossAxis)) {
            child->layout.position[pos[crossAxis]] =
                ABI20_0_0YGNodeLeadingPosition(child, crossAxis, availableInnerCrossDim) +
                ABI20_0_0YGNodeLeadingBorder(node, crossAxis) +
                ABI20_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          } else {
            child->layout.position[pos[crossAxis]] =
                ABI20_0_0YGNodeLeadingBorder(node, crossAxis) +
                ABI20_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const ABI20_0_0YGAlign alignItem = ABI20_0_0YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == ABI20_0_0YGAlignStretch &&
              ABI20_0_0YGMarginLeadingValue(child, crossAxis)->unit != ABI20_0_0YGUnitAuto &&
              ABI20_0_0YGMarginTrailingValue(child, crossAxis)->unit != ABI20_0_0YGUnitAuto) {
            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!ABI20_0_0YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
              float childMainSize = child->layout.measuredDimensions[dim[mainAxis]];
              float childCrossSize =
                  !ABI20_0_0YGFloatIsUndefined(child->style.aspectRatio)
                      ? ((ABI20_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth) +
                          (isMainAxisRow ? childMainSize / child->style.aspectRatio
                                         : childMainSize * child->style.aspectRatio)))
                      : crossDim;

              childMainSize += ABI20_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth);

              ABI20_0_0YGMeasureMode childMainMeasureMode = ABI20_0_0YGMeasureModeExactly;
              ABI20_0_0YGMeasureMode childCrossMeasureMode = ABI20_0_0YGMeasureModeExactly;
              ABI20_0_0YGConstrainMaxSizeForMode(child,
                                        mainAxis,
                                        availableInnerMainDim,
                                        availableInnerWidth,
                                        &childMainMeasureMode,
                                        &childMainSize);
              ABI20_0_0YGConstrainMaxSizeForMode(child,
                                        crossAxis,
                                        availableInnerCrossDim,
                                        availableInnerWidth,
                                        &childCrossMeasureMode,
                                        &childCrossSize);

              const float childWidth = isMainAxisRow ? childMainSize : childCrossSize;
              const float childHeight = !isMainAxisRow ? childMainSize : childCrossSize;

              const ABI20_0_0YGMeasureMode childWidthMeasureMode =
                  ABI20_0_0YGFloatIsUndefined(childWidth) ? ABI20_0_0YGMeasureModeUndefined : ABI20_0_0YGMeasureModeExactly;
              const ABI20_0_0YGMeasureMode childHeightMeasureMode =
                  ABI20_0_0YGFloatIsUndefined(childHeight) ? ABI20_0_0YGMeasureModeUndefined : ABI20_0_0YGMeasureModeExactly;

              ABI20_0_0YGLayoutNodeInternal(child,
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
                containerCrossAxis - ABI20_0_0YGNodeDimWithMargin(child, crossAxis, availableInnerWidth);

            if (ABI20_0_0YGMarginLeadingValue(child, crossAxis)->unit == ABI20_0_0YGUnitAuto &&
                ABI20_0_0YGMarginTrailingValue(child, crossAxis)->unit == ABI20_0_0YGUnitAuto) {
              leadingCrossDim += fmaxf(0.0f, remainingCrossDim / 2);
            } else if (ABI20_0_0YGMarginTrailingValue(child, crossAxis)->unit == ABI20_0_0YGUnitAuto) {
              // No-Op
            } else if (ABI20_0_0YGMarginLeadingValue(child, crossAxis)->unit == ABI20_0_0YGUnitAuto) {
              leadingCrossDim += fmaxf(0.0f, remainingCrossDim);
            } else if (alignItem == ABI20_0_0YGAlignFlexStart) {
              // No-Op
            } else if (alignItem == ABI20_0_0YGAlignCenter) {
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
  if (performLayout && (lineCount > 1 || ABI20_0_0YGIsBaselineLayout(node)) &&
      !ABI20_0_0YGFloatIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->style.alignContent) {
      case ABI20_0_0YGAlignFlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case ABI20_0_0YGAlignCenter:
        currentLead += remainingAlignContentDim / 2;
        break;
      case ABI20_0_0YGAlignStretch:
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = remainingAlignContentDim / lineCount;
        }
        break;
      case ABI20_0_0YGAlignSpaceAround:
        if (availableInnerCrossDim > totalLineCrossDim) {
          currentLead += remainingAlignContentDim / (2 * lineCount);
          if (lineCount > 1) {
            crossDimLead = remainingAlignContentDim / lineCount;
          }
        } else {
          currentLead += remainingAlignContentDim / 2;
        }
        break;
      case ABI20_0_0YGAlignSpaceBetween:
        if (availableInnerCrossDim > totalLineCrossDim && lineCount > 1) {
          crossDimLead = remainingAlignContentDim / (lineCount - 1);
        }
        break;
      case ABI20_0_0YGAlignAuto:
      case ABI20_0_0YGAlignFlexStart:
      case ABI20_0_0YGAlignBaseline:
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
        const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, ii);
        if (child->style.display == ABI20_0_0YGDisplayNone) {
          continue;
        }
        if (child->style.positionType == ABI20_0_0YGPositionTypeRelative) {
          if (child->lineIndex != i) {
            break;
          }
          if (ABI20_0_0YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = fmaxf(lineHeight,
                               child->layout.measuredDimensions[dim[crossAxis]] +
                                   ABI20_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth));
          }
          if (ABI20_0_0YGNodeAlignItem(node, child) == ABI20_0_0YGAlignBaseline) {
            const float ascent =
                ABI20_0_0YGBaseline(child) +
                ABI20_0_0YGNodeLeadingMargin(child, ABI20_0_0YGFlexDirectionColumn, availableInnerWidth);
            const float descent =
                child->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] +
                ABI20_0_0YGNodeMarginForAxis(child, ABI20_0_0YGFlexDirectionColumn, availableInnerWidth) - ascent;
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
          const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, ii);
          if (child->style.display == ABI20_0_0YGDisplayNone) {
            continue;
          }
          if (child->style.positionType == ABI20_0_0YGPositionTypeRelative) {
            switch (ABI20_0_0YGNodeAlignItem(node, child)) {
              case ABI20_0_0YGAlignFlexStart: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + ABI20_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);
                break;
              }
              case ABI20_0_0YGAlignFlexEnd: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight -
                    ABI20_0_0YGNodeTrailingMargin(child, crossAxis, availableInnerWidth) -
                    child->layout.measuredDimensions[dim[crossAxis]];
                break;
              }
              case ABI20_0_0YGAlignCenter: {
                float childHeight = child->layout.measuredDimensions[dim[crossAxis]];
                child->layout.position[pos[crossAxis]] =
                    currentLead + (lineHeight - childHeight) / 2;
                break;
              }
              case ABI20_0_0YGAlignStretch: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + ABI20_0_0YGNodeLeadingMargin(child, crossAxis, availableInnerWidth);

                // Remeasure child with the line height as it as been only measured with the
                // parents height yet.
                if (!ABI20_0_0YGNodeIsStyleDimDefined(child, crossAxis, availableInnerCrossDim)) {
                  const float childWidth =
                      isMainAxisRow ? (child->layout.measuredDimensions[ABI20_0_0YGDimensionWidth] +
                                       ABI20_0_0YGNodeMarginForAxis(child, mainAxis, availableInnerWidth))
                                    : lineHeight;

                  const float childHeight =
                      !isMainAxisRow ? (child->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] +
                                        ABI20_0_0YGNodeMarginForAxis(child, crossAxis, availableInnerWidth))
                                     : lineHeight;

                  if (!(ABI20_0_0YGFloatsEqual(childWidth,
                                      child->layout.measuredDimensions[ABI20_0_0YGDimensionWidth]) &&
                        ABI20_0_0YGFloatsEqual(childHeight,
                                      child->layout.measuredDimensions[ABI20_0_0YGDimensionHeight]))) {
                    ABI20_0_0YGLayoutNodeInternal(child,
                                         childWidth,
                                         childHeight,
                                         direction,
                                         ABI20_0_0YGMeasureModeExactly,
                                         ABI20_0_0YGMeasureModeExactly,
                                         availableInnerWidth,
                                         availableInnerHeight,
                                         true,
                                         "multiline-stretch",
                                         config);
                  }
                }
                break;
              }
              case ABI20_0_0YGAlignBaseline: {
                child->layout.position[ABI20_0_0YGEdgeTop] =
                    currentLead + maxAscentForCurrentLine - ABI20_0_0YGBaseline(child) +
                    ABI20_0_0YGNodeLeadingPosition(child, ABI20_0_0YGFlexDirectionColumn, availableInnerCrossDim);
                break;
              }
              case ABI20_0_0YGAlignAuto:
              case ABI20_0_0YGAlignSpaceBetween:
              case ABI20_0_0YGAlignSpaceAround:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[ABI20_0_0YGDimensionWidth] = ABI20_0_0YGNodeBoundAxis(
      node, ABI20_0_0YGFlexDirectionRow, availableWidth - marginAxisRow, parentWidth, parentWidth);
  node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight] = ABI20_0_0YGNodeBoundAxis(
      node, ABI20_0_0YGFlexDirectionColumn, availableHeight - marginAxisColumn, parentHeight, parentWidth);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI20_0_0YGMeasureModeUndefined ||
      (node->style.overflow != ABI20_0_0YGOverflowScroll && measureModeMainDim == ABI20_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] =
        ABI20_0_0YGNodeBoundAxis(node, mainAxis, maxLineMainDim, mainAxisParentSize, parentWidth);
  } else if (measureModeMainDim == ABI20_0_0YGMeasureModeAtMost &&
             node->style.overflow == ABI20_0_0YGOverflowScroll) {
    node->layout.measuredDimensions[dim[mainAxis]] = fmaxf(
        fminf(availableInnerMainDim + paddingAndBorderAxisMain,
              ABI20_0_0YGNodeBoundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim, mainAxisParentSize)),
        paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == ABI20_0_0YGMeasureModeUndefined ||
      (node->style.overflow != ABI20_0_0YGOverflowScroll && measureModeCrossDim == ABI20_0_0YGMeasureModeAtMost)) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        ABI20_0_0YGNodeBoundAxis(node,
                        crossAxis,
                        totalLineCrossDim + paddingAndBorderAxisCross,
                        crossAxisParentSize,
                        parentWidth);
  } else if (measureModeCrossDim == ABI20_0_0YGMeasureModeAtMost &&
             node->style.overflow == ABI20_0_0YGOverflowScroll) {
    node->layout.measuredDimensions[dim[crossAxis]] =
        fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    ABI20_0_0YGNodeBoundAxisWithinMinAndMax(node,
                                                   crossAxis,
                                                   totalLineCrossDim + paddingAndBorderAxisCross,
                                                   crossAxisParentSize)),
              paddingAndBorderAxisCross);
  }

  // As we only wrapped in normal direction yet, we need to reverse the positions on wrap-reverse.
  if (performLayout && node->style.flexWrap == ABI20_0_0YGWrapWrapReverse) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeGetChild(node, i);
      if (child->style.positionType == ABI20_0_0YGPositionTypeRelative) {
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
      ABI20_0_0YGNodeAbsoluteLayoutChild(node,
                                currentAbsoluteChild,
                                availableInnerWidth,
                                isMainAxisRow ? measureModeMainDim : measureModeCrossDim,
                                availableInnerHeight,
                                direction,
                                config);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos =
        mainAxis == ABI20_0_0YGFlexDirectionRowReverse || mainAxis == ABI20_0_0YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        crossAxis == ABI20_0_0YGFlexDirectionRowReverse || crossAxis == ABI20_0_0YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const ABI20_0_0YGNodeRef child = ABI20_0_0YGNodeListGet(node->children, i);
        if (child->style.display == ABI20_0_0YGDisplayNone) {
          continue;
        }
        if (needsMainTrailingPos) {
          ABI20_0_0YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          ABI20_0_0YGNodeSetChildTrailingPosition(node, child, crossAxis);
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

static const char *ABI20_0_0YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char *ABI20_0_0YGMeasureModeName(const ABI20_0_0YGMeasureMode mode, const bool performLayout) {
  const char *kMeasureModeNames[ABI20_0_0YGMeasureModeCount] = {"UNDEFINED", "ABI20_0_0EXACTLY", "AT_MOST"};
  const char *kLayoutModeNames[ABI20_0_0YGMeasureModeCount] = {"LAY_UNDEFINED",
                                                      "LAY_EXACTLY",
                                                      "LAY_AT_"
                                                      "MOST"};

  if (mode >= ABI20_0_0YGMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool ABI20_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(ABI20_0_0YGMeasureMode sizeMode,
                                                                     float size,
                                                                     float lastComputedSize) {
  return sizeMode == ABI20_0_0YGMeasureModeExactly && ABI20_0_0YGFloatsEqual(size, lastComputedSize);
}

static inline bool ABI20_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(ABI20_0_0YGMeasureMode sizeMode,
                                                                 float size,
                                                                 ABI20_0_0YGMeasureMode lastSizeMode,
                                                                 float lastComputedSize) {
  return sizeMode == ABI20_0_0YGMeasureModeAtMost && lastSizeMode == ABI20_0_0YGMeasureModeUndefined &&
         (size >= lastComputedSize || ABI20_0_0YGFloatsEqual(size, lastComputedSize));
}

static inline bool ABI20_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(ABI20_0_0YGMeasureMode sizeMode,
                                                                      float size,
                                                                      ABI20_0_0YGMeasureMode lastSizeMode,
                                                                      float lastSize,
                                                                      float lastComputedSize) {
  return lastSizeMode == ABI20_0_0YGMeasureModeAtMost && sizeMode == ABI20_0_0YGMeasureModeAtMost &&
         lastSize > size && (lastComputedSize <= size || ABI20_0_0YGFloatsEqual(size, lastComputedSize));
}

static float ABI20_0_0YGRoundValueToPixelGrid(const float value,
                                     const float pointScaleFactor,
                                     const bool forceCeil,
                                     const bool forceFloor) {
  float scaledValue = value * pointScaleFactor;
  float fractial = fmodf(scaledValue, 1.0);
  if (ABI20_0_0YGFloatsEqual(fractial, 0)) {
    // Still remove fractial as fractial could be  extremely small.
    scaledValue = scaledValue - fractial;
  } else if (forceCeil) {
    scaledValue = scaledValue - fractial + 1.0;
  } else if (forceFloor) {
    scaledValue = scaledValue - fractial;
  } else {
    scaledValue = scaledValue - fractial + (fractial >= 0.5f ? 1.0 : 0);
  }
  return scaledValue / pointScaleFactor;
}

bool ABI20_0_0YGNodeCanUseCachedMeasurement(const ABI20_0_0YGMeasureMode widthMode,
                                   const float width,
                                   const ABI20_0_0YGMeasureMode heightMode,
                                   const float height,
                                   const ABI20_0_0YGMeasureMode lastWidthMode,
                                   const float lastWidth,
                                   const ABI20_0_0YGMeasureMode lastHeightMode,
                                   const float lastHeight,
                                   const float lastComputedWidth,
                                   const float lastComputedHeight,
                                   const float marginRow,
                                   const float marginColumn,
                                   const ABI20_0_0YGConfigRef config) {
  if (lastComputedHeight < 0 || lastComputedWidth < 0) {
    return false;
  }
  bool useRoundedComparison = config != NULL && config->pointScaleFactor != 0;
  const float effectiveWidth = useRoundedComparison ? ABI20_0_0YGRoundValueToPixelGrid(width, config->pointScaleFactor, false, false) : width;
  const float effectiveHeight = useRoundedComparison ? ABI20_0_0YGRoundValueToPixelGrid(height, config->pointScaleFactor, false, false) : height;
  const float effectiveLastWidth = useRoundedComparison ? ABI20_0_0YGRoundValueToPixelGrid(lastWidth, config->pointScaleFactor, false, false) : lastWidth;
  const float effectiveLastHeight = useRoundedComparison ? ABI20_0_0YGRoundValueToPixelGrid(lastHeight, config->pointScaleFactor, false, false) : lastHeight;

  const bool hasSameWidthSpec = lastWidthMode == widthMode && ABI20_0_0YGFloatsEqual(effectiveLastWidth, effectiveWidth);
  const bool hasSameHeightSpec = lastHeightMode == heightMode && ABI20_0_0YGFloatsEqual(effectiveLastHeight, effectiveHeight);

  const bool widthIsCompatible =
      hasSameWidthSpec || ABI20_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(widthMode,
                                                                            width - marginRow,
                                                                            lastComputedWidth) ||
      ABI20_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(widthMode,
                                                    width - marginRow,
                                                    lastWidthMode,
                                                    lastComputedWidth) ||
      ABI20_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode, width - marginRow, lastWidthMode, lastWidth, lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec || ABI20_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(heightMode,
                                                                             height - marginColumn,
                                                                             lastComputedHeight) ||
      ABI20_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(heightMode,
                                                    height - marginColumn,
                                                    lastHeightMode,
                                                    lastComputedHeight) ||
      ABI20_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode, height - marginColumn, lastHeightMode, lastHeight, lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the ABI20_0_0YGNodelayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as ABI20_0_0YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool ABI20_0_0YGLayoutNodeInternal(const ABI20_0_0YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const ABI20_0_0YGDirection parentDirection,
                          const ABI20_0_0YGMeasureMode widthMeasureMode,
                          const ABI20_0_0YGMeasureMode heightMeasureMode,
                          const float parentWidth,
                          const float parentHeight,
                          const bool performLayout,
                          const char *reason,
                          const ABI20_0_0YGConfigRef config) {
  ABI20_0_0YGLayout *layout = &node->layout;

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.widthMeasureMode = (ABI20_0_0YGMeasureMode) -1;
    layout->cachedLayout.heightMeasureMode = (ABI20_0_0YGMeasureMode) -1;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  ABI20_0_0YGCachedMeasurement *cachedResults = NULL;

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
    const float marginAxisRow = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionRow, parentWidth);
    const float marginAxisColumn = ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionColumn, parentWidth);

    // First, try to use the layout cache.
    if (ABI20_0_0YGNodeCanUseCachedMeasurement(widthMeasureMode,
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
                                      marginAxisColumn,
                                      config)) {
      cachedResults = &layout->cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (ABI20_0_0YGNodeCanUseCachedMeasurement(widthMeasureMode,
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
                                          marginAxisColumn,
                                          config)) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (ABI20_0_0YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        ABI20_0_0YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (ABI20_0_0YGFloatsEqual(layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          ABI20_0_0YGFloatsEqual(layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != NULL) {
    layout->measuredDimensions[ABI20_0_0YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI20_0_0YGDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", ABI20_0_0YGSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
             ABI20_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI20_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             cachedResults->computedWidth,
             cachedResults->computedHeight,
             reason);
    }
  } else {
    if (gPrintChanges) {
      printf("%s%d.{%s", ABI20_0_0YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n",
             ABI20_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI20_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             reason);
    }

    ABI20_0_0YGNodelayoutImpl(node,
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
      printf("%s%d.}%s", ABI20_0_0YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
             ABI20_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI20_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             layout->measuredDimensions[ABI20_0_0YGDimensionWidth],
             layout->measuredDimensions[ABI20_0_0YGDimensionHeight],
             reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == NULL) {
      if (layout->nextCachedMeasurementsIndex == ABI20_0_0YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI20_0_0YGCachedMeasurement *newCacheEntry;
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
      newCacheEntry->computedWidth = layout->measuredDimensions[ABI20_0_0YGDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[ABI20_0_0YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[ABI20_0_0YGDimensionWidth] = node->layout.measuredDimensions[ABI20_0_0YGDimensionWidth];
    node->layout.dimensions[ABI20_0_0YGDimensionHeight] = node->layout.measuredDimensions[ABI20_0_0YGDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

void ABI20_0_0YGConfigSetPointScaleFactor(const ABI20_0_0YGConfigRef config, const float pixelsInPoint) {
  ABI20_0_0YGAssertWithConfig(config, pixelsInPoint >= 0.0f, "Scale factor should not be less than zero");

  // We store points for Pixel as we will use it for rounding
  if (pixelsInPoint == 0.0f) {
    // Zero is used to skip rounding
    config->pointScaleFactor = 0.0f;
  } else {
    config->pointScaleFactor = pixelsInPoint;
  }
}

static void ABI20_0_0YGRoundToPixelGrid(const ABI20_0_0YGNodeRef node,
                               const float pointScaleFactor,
                               const float absoluteLeft,
                               const float absoluteTop) {
  if (pointScaleFactor == 0.0f) {
    return;
  }

  const float nodeLeft = node->layout.position[ABI20_0_0YGEdgeLeft];
  const float nodeTop = node->layout.position[ABI20_0_0YGEdgeTop];

  const float nodeWidth = node->layout.dimensions[ABI20_0_0YGDimensionWidth];
  const float nodeHeight = node->layout.dimensions[ABI20_0_0YGDimensionHeight];

  const float absoluteNodeLeft = absoluteLeft + nodeLeft;
  const float absoluteNodeTop = absoluteTop + nodeTop;

  const float absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const float absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  // If a node has a custom measure function we never want to round down its size as this could
  // lead to unwanted text truncation.
  const bool textRounding = node->nodeType == ABI20_0_0YGNodeTypeText;

  node->layout.position[ABI20_0_0YGEdgeLeft] =
      ABI20_0_0YGRoundValueToPixelGrid(nodeLeft, pointScaleFactor, false, textRounding);
  node->layout.position[ABI20_0_0YGEdgeTop] =
      ABI20_0_0YGRoundValueToPixelGrid(nodeTop, pointScaleFactor, false, textRounding);

  const bool hasFractionalWidth = !ABI20_0_0YGFloatsEqual(fmodf(nodeWidth, 1 / pointScaleFactor), 0);
  const bool hasFractionalHeight = !ABI20_0_0YGFloatsEqual(fmodf(nodeHeight, 1 / pointScaleFactor), 0);

  node->layout.dimensions[ABI20_0_0YGDimensionWidth] =
      ABI20_0_0YGRoundValueToPixelGrid(
          absoluteNodeRight,
          pointScaleFactor,
          (textRounding && hasFractionalWidth),
          (textRounding && !hasFractionalWidth)) -
      ABI20_0_0YGRoundValueToPixelGrid(absoluteNodeLeft, pointScaleFactor, false, textRounding);
  node->layout.dimensions[ABI20_0_0YGDimensionHeight] =
      ABI20_0_0YGRoundValueToPixelGrid(
          absoluteNodeBottom,
          pointScaleFactor,
          (textRounding && hasFractionalHeight),
          (textRounding && !hasFractionalHeight)) -
      ABI20_0_0YGRoundValueToPixelGrid(absoluteNodeTop, pointScaleFactor, false, textRounding);

  const uint32_t childCount = ABI20_0_0YGNodeListCount(node->children);
  for (uint32_t i = 0; i < childCount; i++) {
    ABI20_0_0YGRoundToPixelGrid(ABI20_0_0YGNodeGetChild(node, i), pointScaleFactor, absoluteNodeLeft, absoluteNodeTop);
  }
}

void ABI20_0_0YGNodeCalculateLayout(const ABI20_0_0YGNodeRef node,
                           const float parentWidth,
                           const float parentHeight,
                           const ABI20_0_0YGDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  ABI20_0_0YGResolveDimensions(node);

  float width = ABI20_0_0YGUndefined;
  ABI20_0_0YGMeasureMode widthMeasureMode = ABI20_0_0YGMeasureModeUndefined;
  if (ABI20_0_0YGNodeIsStyleDimDefined(node, ABI20_0_0YGFlexDirectionRow, parentWidth)) {
    width = ABI20_0_0YGResolveValue(node->resolvedDimensions[dim[ABI20_0_0YGFlexDirectionRow]], parentWidth) +
            ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionRow, parentWidth);
    widthMeasureMode = ABI20_0_0YGMeasureModeExactly;
  } else if (ABI20_0_0YGResolveValue(&node->style.maxDimensions[ABI20_0_0YGDimensionWidth], parentWidth) >= 0.0f) {
    width = ABI20_0_0YGResolveValue(&node->style.maxDimensions[ABI20_0_0YGDimensionWidth], parentWidth);
    widthMeasureMode = ABI20_0_0YGMeasureModeAtMost;
  } else {
    width = parentWidth;
    widthMeasureMode = ABI20_0_0YGFloatIsUndefined(width) ? ABI20_0_0YGMeasureModeUndefined : ABI20_0_0YGMeasureModeExactly;
  }

  float height = ABI20_0_0YGUndefined;
  ABI20_0_0YGMeasureMode heightMeasureMode = ABI20_0_0YGMeasureModeUndefined;
  if (ABI20_0_0YGNodeIsStyleDimDefined(node, ABI20_0_0YGFlexDirectionColumn, parentHeight)) {
    height = ABI20_0_0YGResolveValue(node->resolvedDimensions[dim[ABI20_0_0YGFlexDirectionColumn]], parentHeight) +
             ABI20_0_0YGNodeMarginForAxis(node, ABI20_0_0YGFlexDirectionColumn, parentWidth);
    heightMeasureMode = ABI20_0_0YGMeasureModeExactly;
  } else if (ABI20_0_0YGResolveValue(&node->style.maxDimensions[ABI20_0_0YGDimensionHeight], parentHeight) >= 0.0f) {
    height = ABI20_0_0YGResolveValue(&node->style.maxDimensions[ABI20_0_0YGDimensionHeight], parentHeight);
    heightMeasureMode = ABI20_0_0YGMeasureModeAtMost;
  } else {
    height = parentHeight;
    heightMeasureMode = ABI20_0_0YGFloatIsUndefined(height) ? ABI20_0_0YGMeasureModeUndefined : ABI20_0_0YGMeasureModeExactly;
  }

  if (ABI20_0_0YGLayoutNodeInternal(node,
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
    ABI20_0_0YGNodeSetPosition(node, node->layout.direction, parentWidth, parentHeight, parentWidth);
    ABI20_0_0YGRoundToPixelGrid(node, node->config->pointScaleFactor, 0.0f, 0.0f);

    if (gPrintTree) {
      ABI20_0_0YGNodePrint(node, ABI20_0_0YGPrintOptionsLayout | ABI20_0_0YGPrintOptionsChildren | ABI20_0_0YGPrintOptionsStyle);
    }
  }
}

void ABI20_0_0YGConfigSetLogger(const ABI20_0_0YGConfigRef config, ABI20_0_0YGLogger logger) {
  if (logger != NULL) {
    config->logger = logger;
  } else {
#ifdef ANDROID
    config->logger = &ABI20_0_0YGAndroidLog;
#else
    config->logger = &ABI20_0_0YGDefaultLog;
#endif
  }
}

static void ABI20_0_0YGVLog(const ABI20_0_0YGConfigRef config,
                   const ABI20_0_0YGNodeRef node,
                   ABI20_0_0YGLogLevel level,
                   const char *format,
                   va_list args) {
  const ABI20_0_0YGConfigRef logConfig = config != NULL ? config : &gABI20_0_0YGConfigDefaults;
  logConfig->logger(logConfig, node, level, format, args);

  if (level == ABI20_0_0YGLogLevelFatal) {
    abort();
  }
}

void ABI20_0_0YGLogWithConfig(const ABI20_0_0YGConfigRef config, ABI20_0_0YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  ABI20_0_0YGVLog(config, NULL, level, format, args);
  va_end(args);
}

void ABI20_0_0YGLog(const ABI20_0_0YGNodeRef node, ABI20_0_0YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  ABI20_0_0YGVLog(node == NULL ? NULL : node->config, node, level, format, args);
  va_end(args);
}

void ABI20_0_0YGAssert(const bool condition, const char *message) {
  if (!condition) {
    ABI20_0_0YGLog(NULL, ABI20_0_0YGLogLevelFatal, "%s\n", message);
  }
}

void ABI20_0_0YGAssertWithNode(const ABI20_0_0YGNodeRef node, const bool condition, const char *message) {
  if (!condition) {
    ABI20_0_0YGLog(node, ABI20_0_0YGLogLevelFatal, "%s\n", message);
  }
}

void ABI20_0_0YGAssertWithConfig(const ABI20_0_0YGConfigRef config, const bool condition, const char *message) {
  if (!condition) {
    ABI20_0_0YGLogWithConfig(config, ABI20_0_0YGLogLevelFatal, "%s\n", message);
  }
}

void ABI20_0_0YGConfigSetExperimentalFeatureEnabled(const ABI20_0_0YGConfigRef config,
                                           const ABI20_0_0YGExperimentalFeature feature,
                                           const bool enabled) {
  config->experimentalFeatures[feature] = enabled;
}

inline bool ABI20_0_0YGConfigIsExperimentalFeatureEnabled(const ABI20_0_0YGConfigRef config,
                                                 const ABI20_0_0YGExperimentalFeature feature) {
  return config->experimentalFeatures[feature];
}

void ABI20_0_0YGConfigSetUseWebDefaults(const ABI20_0_0YGConfigRef config, const bool enabled) {
  config->useWebDefaults = enabled;
}

void ABI20_0_0YGConfigSetUseLegacyStretchBehaviour(const ABI20_0_0YGConfigRef config,
                                          const bool useLegacyStretchBehaviour) {
  config->useLegacyStretchBehaviour = useLegacyStretchBehaviour;
}

bool ABI20_0_0YGConfigGetUseWebDefaults(const ABI20_0_0YGConfigRef config) {
  return config->useWebDefaults;
}

void ABI20_0_0YGConfigSetContext(const ABI20_0_0YGConfigRef config, void *context) {
  config->context = context;
}

void *ABI20_0_0YGConfigGetContext(const ABI20_0_0YGConfigRef config) {
  return config->context;
}

void ABI20_0_0YGSetMemoryFuncs(ABI20_0_0YGMalloc ygmalloc, ABI20_0_0YGCalloc yccalloc, ABI20_0_0YGRealloc ygrealloc, ABI20_0_0YGFree ygfree) {
  ABI20_0_0YGAssert(gNodeInstanceCount == 0 && gConfigInstanceCount == 0,
           "Cannot set memory functions: all node must be freed first");
  ABI20_0_0YGAssert((ygmalloc == NULL && yccalloc == NULL && ygrealloc == NULL && ygfree == NULL) ||
               (ygmalloc != NULL && yccalloc != NULL && ygrealloc != NULL && ygfree != NULL),
           "Cannot set memory functions: functions must be all NULL or Non-NULL");

  if (ygmalloc == NULL || yccalloc == NULL || ygrealloc == NULL || ygfree == NULL) {
    gABI20_0_0YGMalloc = &malloc;
    gABI20_0_0YGCalloc = &calloc;
    gABI20_0_0YGRealloc = &realloc;
    gABI20_0_0YGFree = &free;
  } else {
    gABI20_0_0YGMalloc = ygmalloc;
    gABI20_0_0YGCalloc = yccalloc;
    gABI20_0_0YGRealloc = ygrealloc;
    gABI20_0_0YGFree = ygfree;
  }
}
