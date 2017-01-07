/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "ABI13_0_0YGNodeList.h"
#include "ABI13_0_0Yoga.h"

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

typedef struct ABI13_0_0YGCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI13_0_0YGMeasureMode widthMeasureMode;
  ABI13_0_0YGMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} ABI13_0_0YGCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
enum { ABI13_0_0YG_MAX_CACHED_RESULT_COUNT = 16 };

typedef struct ABI13_0_0YGLayout {
  float position[4];
  float dimensions[2];
  ABI13_0_0YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI13_0_0YGDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  ABI13_0_0YGCachedMeasurement cachedMeasurements[ABI13_0_0YG_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  ABI13_0_0YGCachedMeasurement cachedLayout;
} ABI13_0_0YGLayout;

typedef struct ABI13_0_0YGStyle {
  ABI13_0_0YGDirection direction;
  ABI13_0_0YGFlexDirection flexDirection;
  ABI13_0_0YGJustify justifyContent;
  ABI13_0_0YGAlign alignContent;
  ABI13_0_0YGAlign alignItems;
  ABI13_0_0YGAlign alignSelf;
  ABI13_0_0YGPositionType positionType;
  ABI13_0_0YGWrap flexWrap;
  ABI13_0_0YGOverflow overflow;
  float flex;
  float flexGrow;
  float flexShrink;
  float flexBasis;
  float margin[ABI13_0_0YGEdgeCount];
  float position[ABI13_0_0YGEdgeCount];
  float padding[ABI13_0_0YGEdgeCount];
  float border[ABI13_0_0YGEdgeCount];
  float dimensions[2];
  float minDimensions[2];
  float maxDimensions[2];

  // Yoga specific properties, not compatible with flexbox specification
  float aspectRatio;
} ABI13_0_0YGStyle;

typedef struct ABI13_0_0YGNode {
  ABI13_0_0YGStyle style;
  ABI13_0_0YGLayout layout;
  uint32_t lineIndex;
  bool hasNewLayout;
  ABI13_0_0YGNodeRef parent;
  ABI13_0_0YGNodeListRef children;
  bool isDirty;

  struct ABI13_0_0YGNode *nextChild;

  ABI13_0_0YGMeasureFunc measure;
  ABI13_0_0YGPrintFunc print;
  void *context;
} ABI13_0_0YGNode;

static void ABI13_0_0YGNodeMarkDirtyInternal(const ABI13_0_0YGNodeRef node);

ABI13_0_0YGMalloc gABI13_0_0YGMalloc = &malloc;
ABI13_0_0YGCalloc gABI13_0_0YGCalloc = &calloc;
ABI13_0_0YGRealloc gABI13_0_0YGRealloc = &realloc;
ABI13_0_0YGFree gABI13_0_0YGFree = &free;

#ifdef ANDROID
#include <android/log.h>
static int ABI13_0_0YGAndroidLog(ABI13_0_0YGLogLevel level, const char *format, va_list args) {
  int androidLevel = ABI13_0_0YGLogLevelDebug;
  switch (level) {
    case ABI13_0_0YGLogLevelError:
      androidLevel = ANDROID_LOG_ERROR;
      break;
    case ABI13_0_0YGLogLevelWarn:
      androidLevel = ANDROID_LOG_WARN;
      break;
    case ABI13_0_0YGLogLevelInfo:
      androidLevel = ANDROID_LOG_INFO;
      break;
    case ABI13_0_0YGLogLevelDebug:
      androidLevel = ANDROID_LOG_DEBUG;
      break;
    case ABI13_0_0YGLogLevelVerbose:
      androidLevel = ANDROID_LOG_VERBOSE;
      break;
    case ABI13_0_0YGLogLevelCount:
      break;
  }
  const int result = __android_log_vprint(androidLevel, "ABI13_0_0YG-layout", format, args);
  return result;
}
static ABI13_0_0YGLogger gLogger = &ABI13_0_0YGAndroidLog;
#else
static int ABI13_0_0YGDefaultLog(ABI13_0_0YGLogLevel level, const char *format, va_list args) {
  switch (level) {
    case ABI13_0_0YGLogLevelError:
      return vfprintf(stderr, format, args);
    case ABI13_0_0YGLogLevelWarn:
    case ABI13_0_0YGLogLevelInfo:
    case ABI13_0_0YGLogLevelDebug:
    case ABI13_0_0YGLogLevelVerbose:
    default:
      return vprintf(format, args);
  }
}
static ABI13_0_0YGLogger gLogger = &ABI13_0_0YGDefaultLog;
#endif

static inline float ABI13_0_0YGComputedEdgeValue(const float edges[ABI13_0_0YGEdgeCount],
                                        const ABI13_0_0YGEdge edge,
                                        const float defaultValue) {
  ABI13_0_0YG_ASSERT(edge <= ABI13_0_0YGEdgeEnd, "Cannot get computed value of multi-edge shorthands");

  if (!ABI13_0_0YGValueIsUndefined(edges[edge])) {
    return edges[edge];
  }

  if ((edge == ABI13_0_0YGEdgeTop || edge == ABI13_0_0YGEdgeBottom) && !ABI13_0_0YGValueIsUndefined(edges[ABI13_0_0YGEdgeVertical])) {
    return edges[ABI13_0_0YGEdgeVertical];
  }

  if ((edge == ABI13_0_0YGEdgeLeft || edge == ABI13_0_0YGEdgeRight || edge == ABI13_0_0YGEdgeStart || edge == ABI13_0_0YGEdgeEnd) &&
      !ABI13_0_0YGValueIsUndefined(edges[ABI13_0_0YGEdgeHorizontal])) {
    return edges[ABI13_0_0YGEdgeHorizontal];
  }

  if (!ABI13_0_0YGValueIsUndefined(edges[ABI13_0_0YGEdgeAll])) {
    return edges[ABI13_0_0YGEdgeAll];
  }

  if (edge == ABI13_0_0YGEdgeStart || edge == ABI13_0_0YGEdgeEnd) {
    return ABI13_0_0YGUndefined;
  }

  return defaultValue;
}

static void ABI13_0_0YGNodeInit(const ABI13_0_0YGNodeRef node) {
  node->parent = NULL;
  node->children = NULL;
  node->hasNewLayout = true;
  node->isDirty = false;

  node->style.flex = ABI13_0_0YGUndefined;
  node->style.flexGrow = ABI13_0_0YGUndefined;
  node->style.flexShrink = ABI13_0_0YGUndefined;
  node->style.flexBasis = ABI13_0_0YGUndefined;

  node->style.alignItems = ABI13_0_0YGAlignStretch;
  node->style.alignContent = ABI13_0_0YGAlignFlexStart;

  node->style.direction = ABI13_0_0YGDirectionInherit;
  node->style.flexDirection = ABI13_0_0YGFlexDirectionColumn;

  node->style.overflow = ABI13_0_0YGOverflowVisible;

  // Some of the fields default to undefined and not 0
  node->style.dimensions[ABI13_0_0YGDimensionWidth] = ABI13_0_0YGUndefined;
  node->style.dimensions[ABI13_0_0YGDimensionHeight] = ABI13_0_0YGUndefined;

  node->style.minDimensions[ABI13_0_0YGDimensionWidth] = ABI13_0_0YGUndefined;
  node->style.minDimensions[ABI13_0_0YGDimensionHeight] = ABI13_0_0YGUndefined;

  node->style.maxDimensions[ABI13_0_0YGDimensionWidth] = ABI13_0_0YGUndefined;
  node->style.maxDimensions[ABI13_0_0YGDimensionHeight] = ABI13_0_0YGUndefined;

  for (ABI13_0_0YGEdge edge = ABI13_0_0YGEdgeLeft; edge < ABI13_0_0YGEdgeCount; edge++) {
    node->style.position[edge] = ABI13_0_0YGUndefined;
    node->style.margin[edge] = ABI13_0_0YGUndefined;
    node->style.padding[edge] = ABI13_0_0YGUndefined;
    node->style.border[edge] = ABI13_0_0YGUndefined;
  }

  node->style.aspectRatio = ABI13_0_0YGUndefined;

  node->layout.dimensions[ABI13_0_0YGDimensionWidth] = ABI13_0_0YGUndefined;
  node->layout.dimensions[ABI13_0_0YGDimensionHeight] = ABI13_0_0YGUndefined;

  // Such that the comparison is always going to be false
  node->layout.lastParentDirection = (ABI13_0_0YGDirection) -1;
  node->layout.nextCachedMeasurementsIndex = 0;
  node->layout.computedFlexBasis = ABI13_0_0YGUndefined;

  node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] = ABI13_0_0YGUndefined;
  node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] = ABI13_0_0YGUndefined;
  node->layout.cachedLayout.widthMeasureMode = (ABI13_0_0YGMeasureMode) -1;
  node->layout.cachedLayout.heightMeasureMode = (ABI13_0_0YGMeasureMode) -1;
  node->layout.cachedLayout.computedWidth = -1;
  node->layout.cachedLayout.computedHeight = -1;
}

int32_t gNodeInstanceCount = 0;

ABI13_0_0YGNodeRef ABI13_0_0YGNodeNew(void) {
  const ABI13_0_0YGNodeRef node = gABI13_0_0YGCalloc(1, sizeof(ABI13_0_0YGNode));
  ABI13_0_0YG_ASSERT(node, "Could not allocate memory for node");
  gNodeInstanceCount++;

  ABI13_0_0YGNodeInit(node);
  return node;
}

void ABI13_0_0YGNodeFree(const ABI13_0_0YGNodeRef node) {
  if (node->parent) {
    ABI13_0_0YGNodeListDelete(node->parent->children, node);
    node->parent = NULL;
  }

  const uint32_t childCount = ABI13_0_0YGNodeChildCount(node);
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeGetChild(node, i);
    child->parent = NULL;
  }

  ABI13_0_0YGNodeListFree(node->children);
  gABI13_0_0YGFree(node);
  gNodeInstanceCount--;
}

void ABI13_0_0YGNodeFreeRecursive(const ABI13_0_0YGNodeRef root) {
  while (ABI13_0_0YGNodeChildCount(root) > 0) {
    const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeGetChild(root, 0);
    ABI13_0_0YGNodeRemoveChild(root, child);
    ABI13_0_0YGNodeFreeRecursive(child);
  }
  ABI13_0_0YGNodeFree(root);
}

void ABI13_0_0YGNodeReset(const ABI13_0_0YGNodeRef node) {
  ABI13_0_0YG_ASSERT(ABI13_0_0YGNodeChildCount(node) == 0, "Cannot reset a node which still has children attached");
  ABI13_0_0YG_ASSERT(node->parent == NULL, "Cannot reset a node still attached to a parent");

  ABI13_0_0YGNodeListFree(node->children);
  memset(node, 0, sizeof(ABI13_0_0YGNode));
  ABI13_0_0YGNodeInit(node);
}

int32_t ABI13_0_0YGNodeGetInstanceCount(void) {
  return gNodeInstanceCount;
}

static void ABI13_0_0YGNodeMarkDirtyInternal(const ABI13_0_0YGNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = ABI13_0_0YGUndefined;
    if (node->parent) {
      ABI13_0_0YGNodeMarkDirtyInternal(node->parent);
    }
  }
}

void ABI13_0_0YGNodeSetMeasureFunc(const ABI13_0_0YGNodeRef node, ABI13_0_0YGMeasureFunc measureFunc) {
  if (measureFunc == NULL) {
    node->measure = NULL;
  } else {
    ABI13_0_0YG_ASSERT(ABI13_0_0YGNodeChildCount(node) == 0,
              "Cannot set measure function: Nodes with measure functions cannot have children.");
    node->measure = measureFunc;
  }
}

ABI13_0_0YGMeasureFunc ABI13_0_0YGNodeGetMeasureFunc(const ABI13_0_0YGNodeRef node) {
  return node->measure;
}

void ABI13_0_0YGNodeInsertChild(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGNodeRef child, const uint32_t index) {
  ABI13_0_0YG_ASSERT(child->parent == NULL, "Child already has a parent, it must be removed first.");
  ABI13_0_0YG_ASSERT(node->measure == NULL,
            "Cannot add child: Nodes with measure functions cannot have children.");
  ABI13_0_0YGNodeListInsert(&node->children, child, index);
  child->parent = node;
  ABI13_0_0YGNodeMarkDirtyInternal(node);
}

void ABI13_0_0YGNodeRemoveChild(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGNodeRef child) {
  if (ABI13_0_0YGNodeListDelete(node->children, child) != NULL) {
    child->parent = NULL;
    ABI13_0_0YGNodeMarkDirtyInternal(node);
  }
}

ABI13_0_0YGNodeRef ABI13_0_0YGNodeGetChild(const ABI13_0_0YGNodeRef node, const uint32_t index) {
  return ABI13_0_0YGNodeListGet(node->children, index);
}

inline uint32_t ABI13_0_0YGNodeChildCount(const ABI13_0_0YGNodeRef node) {
  return ABI13_0_0YGNodeListCount(node->children);
}

void ABI13_0_0YGNodeMarkDirty(const ABI13_0_0YGNodeRef node) {
  ABI13_0_0YG_ASSERT(node->measure != NULL,
            "Only leaf nodes with custom measure functions"
            "should manually mark themselves as dirty");
  ABI13_0_0YGNodeMarkDirtyInternal(node);
}

bool ABI13_0_0YGNodeIsDirty(const ABI13_0_0YGNodeRef node) {
  return node->isDirty;
}

void ABI13_0_0YGNodeCopyStyle(const ABI13_0_0YGNodeRef dstNode, const ABI13_0_0YGNodeRef srcNode) {
  if (memcmp(&dstNode->style, &srcNode->style, sizeof(ABI13_0_0YGStyle)) != 0) {
    memcpy(&dstNode->style, &srcNode->style, sizeof(ABI13_0_0YGStyle));
    ABI13_0_0YGNodeMarkDirtyInternal(dstNode);
  }
}

inline float ABI13_0_0YGNodeStyleGetFlexGrow(const ABI13_0_0YGNodeRef node) {
  if (!ABI13_0_0YGValueIsUndefined(node->style.flexGrow)) {
    return node->style.flexGrow;
  }
  if (!ABI13_0_0YGValueIsUndefined(node->style.flex) && node->style.flex > 0) {
    return node->style.flex;
  }
  return 0;
}

inline float ABI13_0_0YGNodeStyleGetFlexShrink(const ABI13_0_0YGNodeRef node) {
  if (!ABI13_0_0YGValueIsUndefined(node->style.flexShrink)) {
    return node->style.flexShrink;
  }
  if (!ABI13_0_0YGValueIsUndefined(node->style.flex) && node->style.flex < 0) {
    return -node->style.flex;
  }
  return 0;
}

inline float ABI13_0_0YGNodeStyleGetFlexBasis(const ABI13_0_0YGNodeRef node) {
  if (!ABI13_0_0YGValueIsUndefined(node->style.flexBasis)) {
    return node->style.flexBasis;
  }
  if (!ABI13_0_0YGValueIsUndefined(node->style.flex)) {
    return node->style.flex > 0 ? 0 : ABI13_0_0YGUndefined;
  }
  return ABI13_0_0YGUndefined;
}

void ABI13_0_0YGNodeStyleSetFlex(const ABI13_0_0YGNodeRef node, const float flex) {
  if (node->style.flex != flex) {
    node->style.flex = flex;
    ABI13_0_0YGNodeMarkDirtyInternal(node);
  }
}

#define ABI13_0_0YG_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
  void ABI13_0_0YGNodeSet##name(const ABI13_0_0YGNodeRef node, type paramName) {     \
    node->instanceName = paramName;                                \
  }                                                                \
                                                                   \
  type ABI13_0_0YGNodeGet##name(const ABI13_0_0YGNodeRef node) {                     \
    return node->instanceName;                                     \
  }

#define ABI13_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
  void ABI13_0_0YGNodeStyleSet##name(const ABI13_0_0YGNodeRef node, const type paramName) {       \
    if (node->style.instanceName != paramName) {                                \
      node->style.instanceName = paramName;                                     \
      ABI13_0_0YGNodeMarkDirtyInternal(node);                                            \
    }                                                                           \
  }

#define ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)  \
  ABI13_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(type, name, paramName, instanceName) \
                                                                          \
  type ABI13_0_0YGNodeStyleGet##name(const ABI13_0_0YGNodeRef node) {                       \
    return node->style.instanceName;                                      \
  }

#define ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName, defaultValue)  \
  void ABI13_0_0YGNodeStyleSet##name(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGEdge edge, const type paramName) { \
    if (node->style.instanceName[edge] != paramName) {                                       \
      node->style.instanceName[edge] = paramName;                                            \
      ABI13_0_0YGNodeMarkDirtyInternal(node);                                                         \
    }                                                                                        \
  }                                                                                          \
                                                                                             \
  type ABI13_0_0YGNodeStyleGet##name(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGEdge edge) {                       \
    return ABI13_0_0YGComputedEdgeValue(node->style.instanceName, edge, defaultValue);                \
  }

#define ABI13_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type ABI13_0_0YGNodeLayoutGet##name(const ABI13_0_0YGNodeRef node) {           \
    return node->layout.instanceName;                          \
  }

ABI13_0_0YG_NODE_PROPERTY_IMPL(void *, Context, context, context);
ABI13_0_0YG_NODE_PROPERTY_IMPL(ABI13_0_0YGPrintFunc, PrintFunc, printFunc, print);
ABI13_0_0YG_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);

ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGDirection, Direction, direction, direction);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGFlexDirection, FlexDirection, flexDirection, flexDirection);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGJustify, JustifyContent, justifyContent, justifyContent);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGAlign, AlignContent, alignContent, alignContent);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGAlign, AlignItems, alignItems, alignItems);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGAlign, AlignSelf, alignSelf, alignSelf);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGPositionType, PositionType, positionType, positionType);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGWrap, FlexWrap, flexWrap, flexWrap);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(ABI13_0_0YGOverflow, Overflow, overflow, overflow);

ABI13_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexGrow, flexGrow, flexGrow);
ABI13_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexShrink, flexShrink, flexShrink);
ABI13_0_0YG_NODE_STYLE_PROPERTY_SETTER_IMPL(float, FlexBasis, flexBasis, flexBasis);

ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Position, position, position, ABI13_0_0YGUndefined);
ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Margin, margin, margin, 0);
ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Padding, padding, padding, 0);
ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border, 0);

ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, Width, width, dimensions[ABI13_0_0YGDimensionWidth]);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, Height, height, dimensions[ABI13_0_0YGDimensionHeight]);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, MinWidth, minWidth, minDimensions[ABI13_0_0YGDimensionWidth]);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, MinHeight, minHeight, minDimensions[ABI13_0_0YGDimensionHeight]);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, MaxWidth, maxWidth, maxDimensions[ABI13_0_0YGDimensionWidth]);
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, MaxHeight, maxHeight, maxDimensions[ABI13_0_0YGDimensionHeight]);

// Yoga specific properties, not compatible with flexbox specification
ABI13_0_0YG_NODE_STYLE_PROPERTY_IMPL(float, AspectRatio, aspectRatio, aspectRatio);

ABI13_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI13_0_0YGEdgeLeft]);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI13_0_0YGEdgeTop]);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI13_0_0YGEdgeRight]);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI13_0_0YGEdgeBottom]);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI13_0_0YGDimensionWidth]);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI13_0_0YGDimensionHeight]);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY_IMPL(ABI13_0_0YGDirection, Direction, direction);

uint32_t gCurrentGenerationCount = 0;

bool ABI13_0_0YGLayoutNodeInternal(const ABI13_0_0YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const ABI13_0_0YGDirection parentDirection,
                          const ABI13_0_0YGMeasureMode widthMeasureMode,
                          const ABI13_0_0YGMeasureMode heightMeasureMode,
                          const bool performLayout,
                          const char *reason);

inline bool ABI13_0_0YGValueIsUndefined(const float value) {
  return isnan(value);
}

static inline bool ABI13_0_0YGFloatsEqual(const float a, const float b) {
  if (ABI13_0_0YGValueIsUndefined(a)) {
    return ABI13_0_0YGValueIsUndefined(b);
  }
  return fabs(a - b) < 0.0001;
}

static void ABI13_0_0YGIndent(const uint32_t n) {
  for (uint32_t i = 0; i < n; i++) {
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "  ");
  }
}

static void ABI13_0_0YGPrintNumberIfNotZero(const char *str, const float number) {
  if (!ABI13_0_0YGFloatsEqual(number, 0)) {
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "%s: %g, ", str, number);
  }
}

static void ABI13_0_0YGPrintNumberIfNotUndefined(const char *str, const float number) {
  if (!ABI13_0_0YGValueIsUndefined(number)) {
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "%s: %g, ", str, number);
  }
}

static bool ABI13_0_0YGFourFloatsEqual(const float four[4]) {
  return ABI13_0_0YGFloatsEqual(four[0], four[1]) && ABI13_0_0YGFloatsEqual(four[0], four[2]) &&
         ABI13_0_0YGFloatsEqual(four[0], four[3]);
}

static void ABI13_0_0YGNodePrintInternal(const ABI13_0_0YGNodeRef node,
                                const ABI13_0_0YGPrintOptions options,
                                const uint32_t level) {
  ABI13_0_0YGIndent(level);
  ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "{");

  if (node->print) {
    node->print(node);
  }

  if (options & ABI13_0_0YGPrintOptionsLayout) {
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "layout: {");
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "width: %g, ", node->layout.dimensions[ABI13_0_0YGDimensionWidth]);
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "height: %g, ", node->layout.dimensions[ABI13_0_0YGDimensionHeight]);
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "top: %g, ", node->layout.position[ABI13_0_0YGEdgeTop]);
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "left: %g", node->layout.position[ABI13_0_0YGEdgeLeft]);
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "}, ");
  }

  if (options & ABI13_0_0YGPrintOptionsStyle) {
    if (node->style.flexDirection == ABI13_0_0YGFlexDirectionColumn) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "flexDirection: 'column', ");
    } else if (node->style.flexDirection == ABI13_0_0YGFlexDirectionColumnReverse) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == ABI13_0_0YGFlexDirectionRow) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "flexDirection: 'row', ");
    } else if (node->style.flexDirection == ABI13_0_0YGFlexDirectionRowReverse) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == ABI13_0_0YGJustifyCenter) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "justifyContent: 'center', ");
    } else if (node->style.justifyContent == ABI13_0_0YGJustifyFlexEnd) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == ABI13_0_0YGJustifySpaceAround) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == ABI13_0_0YGJustifySpaceBetween) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == ABI13_0_0YGAlignCenter) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignItems: 'center', ");
    } else if (node->style.alignItems == ABI13_0_0YGAlignFlexEnd) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignItems: 'flex-end', ");
    } else if (node->style.alignItems == ABI13_0_0YGAlignStretch) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignItems: 'stretch', ");
    }

    if (node->style.alignContent == ABI13_0_0YGAlignCenter) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignContent: 'center', ");
    } else if (node->style.alignContent == ABI13_0_0YGAlignFlexEnd) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignContent: 'flex-end', ");
    } else if (node->style.alignContent == ABI13_0_0YGAlignStretch) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == ABI13_0_0YGAlignFlexStart) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == ABI13_0_0YGAlignCenter) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignSelf: 'center', ");
    } else if (node->style.alignSelf == ABI13_0_0YGAlignFlexEnd) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == ABI13_0_0YGAlignStretch) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "alignSelf: 'stretch', ");
    }

    ABI13_0_0YGPrintNumberIfNotUndefined("flexGrow", ABI13_0_0YGNodeStyleGetFlexGrow(node));
    ABI13_0_0YGPrintNumberIfNotUndefined("flexShrink", ABI13_0_0YGNodeStyleGetFlexShrink(node));
    ABI13_0_0YGPrintNumberIfNotUndefined("flexBasis", ABI13_0_0YGNodeStyleGetFlexBasis(node));

    if (node->style.overflow == ABI13_0_0YGOverflowHidden) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "overflow: 'hidden', ");
    } else if (node->style.overflow == ABI13_0_0YGOverflowVisible) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "overflow: 'visible', ");
    } else if (node->style.overflow == ABI13_0_0YGOverflowScroll) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "overflow: 'scroll', ");
    }

    if (ABI13_0_0YGFourFloatsEqual(node->style.margin)) {
      ABI13_0_0YGPrintNumberIfNotZero("margin", ABI13_0_0YGComputedEdgeValue(node->style.margin, ABI13_0_0YGEdgeLeft, 0));
    } else {
      ABI13_0_0YGPrintNumberIfNotZero("marginLeft", ABI13_0_0YGComputedEdgeValue(node->style.margin, ABI13_0_0YGEdgeLeft, 0));
      ABI13_0_0YGPrintNumberIfNotZero("marginRight",
                             ABI13_0_0YGComputedEdgeValue(node->style.margin, ABI13_0_0YGEdgeRight, 0));
      ABI13_0_0YGPrintNumberIfNotZero("marginTop", ABI13_0_0YGComputedEdgeValue(node->style.margin, ABI13_0_0YGEdgeTop, 0));
      ABI13_0_0YGPrintNumberIfNotZero("marginBottom",
                             ABI13_0_0YGComputedEdgeValue(node->style.margin, ABI13_0_0YGEdgeBottom, 0));
      ABI13_0_0YGPrintNumberIfNotZero("marginStart",
                             ABI13_0_0YGComputedEdgeValue(node->style.margin, ABI13_0_0YGEdgeStart, 0));
      ABI13_0_0YGPrintNumberIfNotZero("marginEnd", ABI13_0_0YGComputedEdgeValue(node->style.margin, ABI13_0_0YGEdgeEnd, 0));
    }

    if (ABI13_0_0YGFourFloatsEqual(node->style.padding)) {
      ABI13_0_0YGPrintNumberIfNotZero("padding", ABI13_0_0YGComputedEdgeValue(node->style.padding, ABI13_0_0YGEdgeLeft, 0));
    } else {
      ABI13_0_0YGPrintNumberIfNotZero("paddingLeft",
                             ABI13_0_0YGComputedEdgeValue(node->style.padding, ABI13_0_0YGEdgeLeft, 0));
      ABI13_0_0YGPrintNumberIfNotZero("paddingRight",
                             ABI13_0_0YGComputedEdgeValue(node->style.padding, ABI13_0_0YGEdgeRight, 0));
      ABI13_0_0YGPrintNumberIfNotZero("paddingTop", ABI13_0_0YGComputedEdgeValue(node->style.padding, ABI13_0_0YGEdgeTop, 0));
      ABI13_0_0YGPrintNumberIfNotZero("paddingBottom",
                             ABI13_0_0YGComputedEdgeValue(node->style.padding, ABI13_0_0YGEdgeBottom, 0));
      ABI13_0_0YGPrintNumberIfNotZero("paddingStart",
                             ABI13_0_0YGComputedEdgeValue(node->style.padding, ABI13_0_0YGEdgeStart, 0));
      ABI13_0_0YGPrintNumberIfNotZero("paddingEnd", ABI13_0_0YGComputedEdgeValue(node->style.padding, ABI13_0_0YGEdgeEnd, 0));
    }

    if (ABI13_0_0YGFourFloatsEqual(node->style.border)) {
      ABI13_0_0YGPrintNumberIfNotZero("borderWidth", ABI13_0_0YGComputedEdgeValue(node->style.border, ABI13_0_0YGEdgeLeft, 0));
    } else {
      ABI13_0_0YGPrintNumberIfNotZero("borderLeftWidth",
                             ABI13_0_0YGComputedEdgeValue(node->style.border, ABI13_0_0YGEdgeLeft, 0));
      ABI13_0_0YGPrintNumberIfNotZero("borderRightWidth",
                             ABI13_0_0YGComputedEdgeValue(node->style.border, ABI13_0_0YGEdgeRight, 0));
      ABI13_0_0YGPrintNumberIfNotZero("borderTopWidth",
                             ABI13_0_0YGComputedEdgeValue(node->style.border, ABI13_0_0YGEdgeTop, 0));
      ABI13_0_0YGPrintNumberIfNotZero("borderBottomWidth",
                             ABI13_0_0YGComputedEdgeValue(node->style.border, ABI13_0_0YGEdgeBottom, 0));
      ABI13_0_0YGPrintNumberIfNotZero("borderStartWidth",
                             ABI13_0_0YGComputedEdgeValue(node->style.border, ABI13_0_0YGEdgeStart, 0));
      ABI13_0_0YGPrintNumberIfNotZero("borderEndWidth",
                             ABI13_0_0YGComputedEdgeValue(node->style.border, ABI13_0_0YGEdgeEnd, 0));
    }

    ABI13_0_0YGPrintNumberIfNotUndefined("width", node->style.dimensions[ABI13_0_0YGDimensionWidth]);
    ABI13_0_0YGPrintNumberIfNotUndefined("height", node->style.dimensions[ABI13_0_0YGDimensionHeight]);
    ABI13_0_0YGPrintNumberIfNotUndefined("maxWidth", node->style.maxDimensions[ABI13_0_0YGDimensionWidth]);
    ABI13_0_0YGPrintNumberIfNotUndefined("maxHeight", node->style.maxDimensions[ABI13_0_0YGDimensionHeight]);
    ABI13_0_0YGPrintNumberIfNotUndefined("minWidth", node->style.minDimensions[ABI13_0_0YGDimensionWidth]);
    ABI13_0_0YGPrintNumberIfNotUndefined("minHeight", node->style.minDimensions[ABI13_0_0YGDimensionHeight]);

    if (node->style.positionType == ABI13_0_0YGPositionTypeAbsolute) {
      ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "position: 'absolute', ");
    }

    ABI13_0_0YGPrintNumberIfNotUndefined("left",
                                ABI13_0_0YGComputedEdgeValue(node->style.position, ABI13_0_0YGEdgeLeft, ABI13_0_0YGUndefined));
    ABI13_0_0YGPrintNumberIfNotUndefined(
        "right", ABI13_0_0YGComputedEdgeValue(node->style.position, ABI13_0_0YGEdgeRight, ABI13_0_0YGUndefined));
    ABI13_0_0YGPrintNumberIfNotUndefined("top",
                                ABI13_0_0YGComputedEdgeValue(node->style.position, ABI13_0_0YGEdgeTop, ABI13_0_0YGUndefined));
    ABI13_0_0YGPrintNumberIfNotUndefined(
        "bottom", ABI13_0_0YGComputedEdgeValue(node->style.position, ABI13_0_0YGEdgeBottom, ABI13_0_0YGUndefined));
  }

  const uint32_t childCount = ABI13_0_0YGNodeListCount(node->children);
  if (options & ABI13_0_0YGPrintOptionsChildren && childCount > 0) {
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "children: [\n");
    for (uint32_t i = 0; i < childCount; i++) {
      ABI13_0_0YGNodePrintInternal(ABI13_0_0YGNodeGetChild(node, i), options, level + 1);
    }
    ABI13_0_0YGIndent(level);
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "]},\n");
  } else {
    ABI13_0_0YGLog(ABI13_0_0YGLogLevelDebug, "},\n");
  }
}

void ABI13_0_0YGNodePrint(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGPrintOptions options) {
  ABI13_0_0YGNodePrintInternal(node, options, 0);
}

static const ABI13_0_0YGEdge leading[4] = {
        [ABI13_0_0YGFlexDirectionColumn] = ABI13_0_0YGEdgeTop,
        [ABI13_0_0YGFlexDirectionColumnReverse] = ABI13_0_0YGEdgeBottom,
        [ABI13_0_0YGFlexDirectionRow] = ABI13_0_0YGEdgeLeft,
        [ABI13_0_0YGFlexDirectionRowReverse] = ABI13_0_0YGEdgeRight,
};
static const ABI13_0_0YGEdge trailing[4] = {
        [ABI13_0_0YGFlexDirectionColumn] = ABI13_0_0YGEdgeBottom,
        [ABI13_0_0YGFlexDirectionColumnReverse] = ABI13_0_0YGEdgeTop,
        [ABI13_0_0YGFlexDirectionRow] = ABI13_0_0YGEdgeRight,
        [ABI13_0_0YGFlexDirectionRowReverse] = ABI13_0_0YGEdgeLeft,
};
static const ABI13_0_0YGEdge pos[4] = {
        [ABI13_0_0YGFlexDirectionColumn] = ABI13_0_0YGEdgeTop,
        [ABI13_0_0YGFlexDirectionColumnReverse] = ABI13_0_0YGEdgeBottom,
        [ABI13_0_0YGFlexDirectionRow] = ABI13_0_0YGEdgeLeft,
        [ABI13_0_0YGFlexDirectionRowReverse] = ABI13_0_0YGEdgeRight,
};
static const ABI13_0_0YGDimension dim[4] = {
        [ABI13_0_0YGFlexDirectionColumn] = ABI13_0_0YGDimensionHeight,
        [ABI13_0_0YGFlexDirectionColumnReverse] = ABI13_0_0YGDimensionHeight,
        [ABI13_0_0YGFlexDirectionRow] = ABI13_0_0YGDimensionWidth,
        [ABI13_0_0YGFlexDirectionRowReverse] = ABI13_0_0YGDimensionWidth,
};

static inline bool ABI13_0_0YGFlexDirectionIsRow(const ABI13_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI13_0_0YGFlexDirectionRow || flexDirection == ABI13_0_0YGFlexDirectionRowReverse;
}

static inline bool ABI13_0_0YGFlexDirectionIsColumn(const ABI13_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI13_0_0YGFlexDirectionColumn || flexDirection == ABI13_0_0YGFlexDirectionColumnReverse;
}

static inline float ABI13_0_0YGNodeLeadingMargin(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  if (ABI13_0_0YGFlexDirectionIsRow(axis) && !ABI13_0_0YGValueIsUndefined(node->style.margin[ABI13_0_0YGEdgeStart])) {
    return node->style.margin[ABI13_0_0YGEdgeStart];
  }

  return ABI13_0_0YGComputedEdgeValue(node->style.margin, leading[axis], 0);
}

static float ABI13_0_0YGNodeTrailingMargin(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  if (ABI13_0_0YGFlexDirectionIsRow(axis) && !ABI13_0_0YGValueIsUndefined(node->style.margin[ABI13_0_0YGEdgeEnd])) {
    return node->style.margin[ABI13_0_0YGEdgeEnd];
  }

  return ABI13_0_0YGComputedEdgeValue(node->style.margin, trailing[axis], 0);
}

static float ABI13_0_0YGNodeLeadingPadding(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  if (ABI13_0_0YGFlexDirectionIsRow(axis) && !ABI13_0_0YGValueIsUndefined(node->style.padding[ABI13_0_0YGEdgeStart]) &&
      node->style.padding[ABI13_0_0YGEdgeStart] >= 0) {
    return node->style.padding[ABI13_0_0YGEdgeStart];
  }

  return fmaxf(ABI13_0_0YGComputedEdgeValue(node->style.padding, leading[axis], 0), 0);
}

static float ABI13_0_0YGNodeTrailingPadding(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  if (ABI13_0_0YGFlexDirectionIsRow(axis) && !ABI13_0_0YGValueIsUndefined(node->style.padding[ABI13_0_0YGEdgeEnd]) &&
      node->style.padding[ABI13_0_0YGEdgeEnd] >= 0) {
    return node->style.padding[ABI13_0_0YGEdgeEnd];
  }

  return fmaxf(ABI13_0_0YGComputedEdgeValue(node->style.padding, trailing[axis], 0), 0);
}

static float ABI13_0_0YGNodeLeadingBorder(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  if (ABI13_0_0YGFlexDirectionIsRow(axis) && !ABI13_0_0YGValueIsUndefined(node->style.border[ABI13_0_0YGEdgeStart]) &&
      node->style.border[ABI13_0_0YGEdgeStart] >= 0) {
    return node->style.border[ABI13_0_0YGEdgeStart];
  }

  return fmaxf(ABI13_0_0YGComputedEdgeValue(node->style.border, leading[axis], 0), 0);
}

static float ABI13_0_0YGNodeTrailingBorder(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  if (ABI13_0_0YGFlexDirectionIsRow(axis) && !ABI13_0_0YGValueIsUndefined(node->style.border[ABI13_0_0YGEdgeEnd]) &&
      node->style.border[ABI13_0_0YGEdgeEnd] >= 0) {
    return node->style.border[ABI13_0_0YGEdgeEnd];
  }

  return fmaxf(ABI13_0_0YGComputedEdgeValue(node->style.border, trailing[axis], 0), 0);
}

static inline float ABI13_0_0YGNodeLeadingPaddingAndBorder(const ABI13_0_0YGNodeRef node,
                                                  const ABI13_0_0YGFlexDirection axis) {
  return ABI13_0_0YGNodeLeadingPadding(node, axis) + ABI13_0_0YGNodeLeadingBorder(node, axis);
}

static inline float ABI13_0_0YGNodeTrailingPaddingAndBorder(const ABI13_0_0YGNodeRef node,
                                                   const ABI13_0_0YGFlexDirection axis) {
  return ABI13_0_0YGNodeTrailingPadding(node, axis) + ABI13_0_0YGNodeTrailingBorder(node, axis);
}

static inline float ABI13_0_0YGNodeMarginForAxis(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  return ABI13_0_0YGNodeLeadingMargin(node, axis) + ABI13_0_0YGNodeTrailingMargin(node, axis);
}

static inline float ABI13_0_0YGNodePaddingAndBorderForAxis(const ABI13_0_0YGNodeRef node,
                                                  const ABI13_0_0YGFlexDirection axis) {
  return ABI13_0_0YGNodeLeadingPaddingAndBorder(node, axis) + ABI13_0_0YGNodeTrailingPaddingAndBorder(node, axis);
}

static inline ABI13_0_0YGAlign ABI13_0_0YGNodeAlignItem(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGNodeRef child) {
  return child->style.alignSelf == ABI13_0_0YGAlignAuto ? node->style.alignItems : child->style.alignSelf;
}

static inline ABI13_0_0YGDirection ABI13_0_0YGNodeResolveDirection(const ABI13_0_0YGNodeRef node,
                                                 const ABI13_0_0YGDirection parentDirection) {
  if (node->style.direction == ABI13_0_0YGDirectionInherit) {
    return parentDirection > ABI13_0_0YGDirectionInherit ? parentDirection : ABI13_0_0YGDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static inline ABI13_0_0YGFlexDirection ABI13_0_0YGFlexDirectionResolve(const ABI13_0_0YGFlexDirection flexDirection,
                                                     const ABI13_0_0YGDirection direction) {
  if (direction == ABI13_0_0YGDirectionRTL) {
    if (flexDirection == ABI13_0_0YGFlexDirectionRow) {
      return ABI13_0_0YGFlexDirectionRowReverse;
    } else if (flexDirection == ABI13_0_0YGFlexDirectionRowReverse) {
      return ABI13_0_0YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static ABI13_0_0YGFlexDirection ABI13_0_0YGFlexDirectionCross(const ABI13_0_0YGFlexDirection flexDirection,
                                            const ABI13_0_0YGDirection direction) {
  return ABI13_0_0YGFlexDirectionIsColumn(flexDirection)
             ? ABI13_0_0YGFlexDirectionResolve(ABI13_0_0YGFlexDirectionRow, direction)
             : ABI13_0_0YGFlexDirectionColumn;
}

static inline bool ABI13_0_0YGNodeIsFlex(const ABI13_0_0YGNodeRef node) {
  return (node->style.positionType == ABI13_0_0YGPositionTypeRelative &&
          (node->style.flexGrow != 0 || node->style.flexShrink != 0 || node->style.flex != 0));
}

static inline float ABI13_0_0YGNodeDimWithMargin(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  return node->layout.measuredDimensions[dim[axis]] + ABI13_0_0YGNodeLeadingMargin(node, axis) +
         ABI13_0_0YGNodeTrailingMargin(node, axis);
}

static inline bool ABI13_0_0YGNodeIsStyleDimDefined(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  const float value = node->style.dimensions[dim[axis]];
  return !ABI13_0_0YGValueIsUndefined(value) && value >= 0.0;
}

static inline bool ABI13_0_0YGNodeIsLayoutDimDefined(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !ABI13_0_0YGValueIsUndefined(value) && value >= 0.0;
}

static inline bool ABI13_0_0YGNodeIsLeadingPosDefined(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  return (ABI13_0_0YGFlexDirectionIsRow(axis) &&
          !ABI13_0_0YGValueIsUndefined(
              ABI13_0_0YGComputedEdgeValue(node->style.position, ABI13_0_0YGEdgeStart, ABI13_0_0YGUndefined))) ||
         !ABI13_0_0YGValueIsUndefined(ABI13_0_0YGComputedEdgeValue(node->style.position, leading[axis], ABI13_0_0YGUndefined));
}

static inline bool ABI13_0_0YGNodeIsTrailingPosDefined(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  return (ABI13_0_0YGFlexDirectionIsRow(axis) &&
          !ABI13_0_0YGValueIsUndefined(ABI13_0_0YGComputedEdgeValue(node->style.position, ABI13_0_0YGEdgeEnd, ABI13_0_0YGUndefined))) ||
         !ABI13_0_0YGValueIsUndefined(
             ABI13_0_0YGComputedEdgeValue(node->style.position, trailing[axis], ABI13_0_0YGUndefined));
}

static float ABI13_0_0YGNodeLeadingPosition(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  if (ABI13_0_0YGFlexDirectionIsRow(axis)) {
    const float leadingPosition =
        ABI13_0_0YGComputedEdgeValue(node->style.position, ABI13_0_0YGEdgeStart, ABI13_0_0YGUndefined);
    if (!ABI13_0_0YGValueIsUndefined(leadingPosition)) {
      return leadingPosition;
    }
  }

  const float leadingPosition =
      ABI13_0_0YGComputedEdgeValue(node->style.position, leading[axis], ABI13_0_0YGUndefined);

  return ABI13_0_0YGValueIsUndefined(leadingPosition) ? 0 : leadingPosition;
}

static float ABI13_0_0YGNodeTrailingPosition(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  if (ABI13_0_0YGFlexDirectionIsRow(axis)) {
    const float trailingPosition =
        ABI13_0_0YGComputedEdgeValue(node->style.position, ABI13_0_0YGEdgeEnd, ABI13_0_0YGUndefined);
    if (!ABI13_0_0YGValueIsUndefined(trailingPosition)) {
      return trailingPosition;
    }
  }

  const float trailingPosition =
      ABI13_0_0YGComputedEdgeValue(node->style.position, trailing[axis], ABI13_0_0YGUndefined);

  return ABI13_0_0YGValueIsUndefined(trailingPosition) ? 0 : trailingPosition;
}

static float ABI13_0_0YGNodeBoundAxisWithinMinAndMax(const ABI13_0_0YGNodeRef node,
                                            const ABI13_0_0YGFlexDirection axis,
                                            const float value) {
  float min = ABI13_0_0YGUndefined;
  float max = ABI13_0_0YGUndefined;

  if (ABI13_0_0YGFlexDirectionIsColumn(axis)) {
    min = node->style.minDimensions[ABI13_0_0YGDimensionHeight];
    max = node->style.maxDimensions[ABI13_0_0YGDimensionHeight];
  } else if (ABI13_0_0YGFlexDirectionIsRow(axis)) {
    min = node->style.minDimensions[ABI13_0_0YGDimensionWidth];
    max = node->style.maxDimensions[ABI13_0_0YGDimensionWidth];
  }

  float boundValue = value;

  if (!ABI13_0_0YGValueIsUndefined(max) && max >= 0.0 && boundValue > max) {
    boundValue = max;
  }

  if (!ABI13_0_0YGValueIsUndefined(min) && min >= 0.0 && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

// Like ABI13_0_0YGNodeBoundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static inline float ABI13_0_0YGNodeBoundAxis(const ABI13_0_0YGNodeRef node,
                                    const ABI13_0_0YGFlexDirection axis,
                                    const float value) {
  return fmaxf(ABI13_0_0YGNodeBoundAxisWithinMinAndMax(node, axis, value),
               ABI13_0_0YGNodePaddingAndBorderForAxis(node, axis));
}

static void ABI13_0_0YGNodeSetChildTrailingPosition(const ABI13_0_0YGNodeRef node,
                                           const ABI13_0_0YGNodeRef child,
                                           const ABI13_0_0YGFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float ABI13_0_0YGNodeRelativePosition(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGFlexDirection axis) {
  return ABI13_0_0YGNodeIsLeadingPosDefined(node, axis) ? ABI13_0_0YGNodeLeadingPosition(node, axis)
                                               : -ABI13_0_0YGNodeTrailingPosition(node, axis);
}

static void ABI13_0_0YGConstrainMaxSizeForMode(const float maxSize, ABI13_0_0YGMeasureMode *mode, float *size) {
  switch (*mode) {
    case ABI13_0_0YGMeasureModeExactly:
    case ABI13_0_0YGMeasureModeAtMost:
      *size = (ABI13_0_0YGValueIsUndefined(maxSize) || *size < maxSize) ? *size : maxSize;
      break;
    case ABI13_0_0YGMeasureModeUndefined:
      if (!ABI13_0_0YGValueIsUndefined(maxSize)) {
        *mode = ABI13_0_0YGMeasureModeAtMost;
        *size = maxSize;
      }
      break;
    case ABI13_0_0YGMeasureModeCount:
      break;
  }
}

static void ABI13_0_0YGNodeSetPosition(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGDirection direction) {
  const ABI13_0_0YGFlexDirection mainAxis = ABI13_0_0YGFlexDirectionResolve(node->style.flexDirection, direction);
  const ABI13_0_0YGFlexDirection crossAxis = ABI13_0_0YGFlexDirectionCross(mainAxis, direction);
  const float relativePositionMain = ABI13_0_0YGNodeRelativePosition(node, mainAxis);
  const float relativePositionCross = ABI13_0_0YGNodeRelativePosition(node, crossAxis);

  node->layout.position[leading[mainAxis]] =
      ABI13_0_0YGNodeLeadingMargin(node, mainAxis) + relativePositionMain;
  node->layout.position[trailing[mainAxis]] =
      ABI13_0_0YGNodeTrailingMargin(node, mainAxis) + relativePositionMain;
  node->layout.position[leading[crossAxis]] =
      ABI13_0_0YGNodeLeadingMargin(node, crossAxis) + relativePositionCross;
  node->layout.position[trailing[crossAxis]] =
      ABI13_0_0YGNodeTrailingMargin(node, crossAxis) + relativePositionCross;
}

static void ABI13_0_0YGNodeComputeFlexBasisForChild(const ABI13_0_0YGNodeRef node,
                                           const ABI13_0_0YGNodeRef child,
                                           const float width,
                                           const ABI13_0_0YGMeasureMode widthMode,
                                           const float height,
                                           const ABI13_0_0YGMeasureMode heightMode,
                                           const ABI13_0_0YGDirection direction) {
  const ABI13_0_0YGFlexDirection mainAxis = ABI13_0_0YGFlexDirectionResolve(node->style.flexDirection, direction);
  const bool isMainAxisRow = ABI13_0_0YGFlexDirectionIsRow(mainAxis);

  float childWidth;
  float childHeight;
  ABI13_0_0YGMeasureMode childWidthMeasureMode;
  ABI13_0_0YGMeasureMode childHeightMeasureMode;

  const bool isRowStyleDimDefined = ABI13_0_0YGNodeIsStyleDimDefined(child, ABI13_0_0YGFlexDirectionRow);
  const bool isColumnStyleDimDefined = ABI13_0_0YGNodeIsStyleDimDefined(child, ABI13_0_0YGFlexDirectionColumn);

  if (!ABI13_0_0YGValueIsUndefined(ABI13_0_0YGNodeStyleGetFlexBasis(child)) &&
      !ABI13_0_0YGValueIsUndefined(isMainAxisRow ? width : height)) {
    if (ABI13_0_0YGValueIsUndefined(child->layout.computedFlexBasis) ||
        (ABI13_0_0YGIsExperimentalFeatureEnabled(ABI13_0_0YGExperimentalFeatureWebFlexBasis) &&
         child->layout.computedFlexBasisGeneration != gCurrentGenerationCount)) {
      child->layout.computedFlexBasis =
          fmaxf(ABI13_0_0YGNodeStyleGetFlexBasis(child), ABI13_0_0YGNodePaddingAndBorderForAxis(child, mainAxis));
    }
  } else if (isMainAxisRow && isRowStyleDimDefined) {
    // The width is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(child->style.dimensions[ABI13_0_0YGDimensionWidth],
              ABI13_0_0YGNodePaddingAndBorderForAxis(child, ABI13_0_0YGFlexDirectionRow));
  } else if (!isMainAxisRow && isColumnStyleDimDefined) {
    // The height is definite, so use that as the flex basis.
    child->layout.computedFlexBasis =
        fmaxf(child->style.dimensions[ABI13_0_0YGDimensionHeight],
              ABI13_0_0YGNodePaddingAndBorderForAxis(child, ABI13_0_0YGFlexDirectionColumn));
  } else {
    // Compute the flex basis and hypothetical main size (i.e. the clamped
    // flex basis).
    childWidth = ABI13_0_0YGUndefined;
    childHeight = ABI13_0_0YGUndefined;
    childWidthMeasureMode = ABI13_0_0YGMeasureModeUndefined;
    childHeightMeasureMode = ABI13_0_0YGMeasureModeUndefined;

    if (isRowStyleDimDefined) {
      childWidth = child->style.dimensions[ABI13_0_0YGDimensionWidth] +
                   ABI13_0_0YGNodeMarginForAxis(child, ABI13_0_0YGFlexDirectionRow);
      childWidthMeasureMode = ABI13_0_0YGMeasureModeExactly;
    }
    if (isColumnStyleDimDefined) {
      childHeight = child->style.dimensions[ABI13_0_0YGDimensionHeight] +
                    ABI13_0_0YGNodeMarginForAxis(child, ABI13_0_0YGFlexDirectionColumn);
      childHeightMeasureMode = ABI13_0_0YGMeasureModeExactly;
    }

    // The W3C spec doesn't say anything about the 'overflow' property,
    // but all major browsers appear to implement the following logic.
    if ((!isMainAxisRow && node->style.overflow == ABI13_0_0YGOverflowScroll) ||
        node->style.overflow != ABI13_0_0YGOverflowScroll) {
      if (ABI13_0_0YGValueIsUndefined(childWidth) && !ABI13_0_0YGValueIsUndefined(width)) {
        childWidth = width;
        childWidthMeasureMode = ABI13_0_0YGMeasureModeAtMost;
      }
    }

    if ((isMainAxisRow && node->style.overflow == ABI13_0_0YGOverflowScroll) ||
        node->style.overflow != ABI13_0_0YGOverflowScroll) {
      if (ABI13_0_0YGValueIsUndefined(childHeight) && !ABI13_0_0YGValueIsUndefined(height)) {
        childHeight = height;
        childHeightMeasureMode = ABI13_0_0YGMeasureModeAtMost;
      }
    }

    // If child has no defined size in the cross axis and is set to stretch,
    // set the cross
    // axis to be measured exactly with the available inner width
    if (!isMainAxisRow && !ABI13_0_0YGValueIsUndefined(width) && !isRowStyleDimDefined &&
        widthMode == ABI13_0_0YGMeasureModeExactly && ABI13_0_0YGNodeAlignItem(node, child) == ABI13_0_0YGAlignStretch) {
      childWidth = width;
      childWidthMeasureMode = ABI13_0_0YGMeasureModeExactly;
    }
    if (isMainAxisRow && !ABI13_0_0YGValueIsUndefined(height) && !isColumnStyleDimDefined &&
        heightMode == ABI13_0_0YGMeasureModeExactly && ABI13_0_0YGNodeAlignItem(node, child) == ABI13_0_0YGAlignStretch) {
      childHeight = height;
      childHeightMeasureMode = ABI13_0_0YGMeasureModeExactly;
    }

    if (!ABI13_0_0YGValueIsUndefined(child->style.aspectRatio)) {
      if (!isMainAxisRow && childWidthMeasureMode == ABI13_0_0YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf(childWidth * child->style.aspectRatio,
                  ABI13_0_0YGNodePaddingAndBorderForAxis(child, ABI13_0_0YGFlexDirectionColumn));
        return;
      } else if (isMainAxisRow && childHeightMeasureMode == ABI13_0_0YGMeasureModeExactly) {
        child->layout.computedFlexBasis =
            fmaxf(childHeight * child->style.aspectRatio,
                  ABI13_0_0YGNodePaddingAndBorderForAxis(child, ABI13_0_0YGFlexDirectionRow));
        return;
      }
    }

    ABI13_0_0YGConstrainMaxSizeForMode(child->style.maxDimensions[ABI13_0_0YGDimensionWidth],
                              &childWidthMeasureMode,
                              &childWidth);
    ABI13_0_0YGConstrainMaxSizeForMode(child->style.maxDimensions[ABI13_0_0YGDimensionHeight],
                              &childHeightMeasureMode,
                              &childHeight);

    // Measure the child
    ABI13_0_0YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         false,
                         "measure");

    child->layout.computedFlexBasis =
        fmaxf(isMainAxisRow ? child->layout.measuredDimensions[ABI13_0_0YGDimensionWidth]
                            : child->layout.measuredDimensions[ABI13_0_0YGDimensionHeight],
              ABI13_0_0YGNodePaddingAndBorderForAxis(child, mainAxis));
  }

  child->layout.computedFlexBasisGeneration = gCurrentGenerationCount;
}

static void ABI13_0_0YGNodeAbsoluteLayoutChild(const ABI13_0_0YGNodeRef node,
                                      const ABI13_0_0YGNodeRef child,
                                      const float width,
                                      const ABI13_0_0YGMeasureMode widthMode,
                                      const ABI13_0_0YGDirection direction) {
  const ABI13_0_0YGFlexDirection mainAxis = ABI13_0_0YGFlexDirectionResolve(node->style.flexDirection, direction);
  const ABI13_0_0YGFlexDirection crossAxis = ABI13_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI13_0_0YGFlexDirectionIsRow(mainAxis);

  float childWidth = ABI13_0_0YGUndefined;
  float childHeight = ABI13_0_0YGUndefined;
  ABI13_0_0YGMeasureMode childWidthMeasureMode = ABI13_0_0YGMeasureModeUndefined;
  ABI13_0_0YGMeasureMode childHeightMeasureMode = ABI13_0_0YGMeasureModeUndefined;

  if (ABI13_0_0YGNodeIsStyleDimDefined(child, ABI13_0_0YGFlexDirectionRow)) {
    childWidth =
        child->style.dimensions[ABI13_0_0YGDimensionWidth] + ABI13_0_0YGNodeMarginForAxis(child, ABI13_0_0YGFlexDirectionRow);
  } else {
    // If the child doesn't have a specified width, compute the width based
    // on the left/right
    // offsets if they're defined.
    if (ABI13_0_0YGNodeIsLeadingPosDefined(child, ABI13_0_0YGFlexDirectionRow) &&
        ABI13_0_0YGNodeIsTrailingPosDefined(child, ABI13_0_0YGFlexDirectionRow)) {
      childWidth = node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] -
                   (ABI13_0_0YGNodeLeadingBorder(node, ABI13_0_0YGFlexDirectionRow) +
                    ABI13_0_0YGNodeTrailingBorder(node, ABI13_0_0YGFlexDirectionRow)) -
                   (ABI13_0_0YGNodeLeadingPosition(child, ABI13_0_0YGFlexDirectionRow) +
                    ABI13_0_0YGNodeTrailingPosition(child, ABI13_0_0YGFlexDirectionRow));
      childWidth = ABI13_0_0YGNodeBoundAxis(child, ABI13_0_0YGFlexDirectionRow, childWidth);
    }
  }

  if (ABI13_0_0YGNodeIsStyleDimDefined(child, ABI13_0_0YGFlexDirectionColumn)) {
    childHeight = child->style.dimensions[ABI13_0_0YGDimensionHeight] +
                  ABI13_0_0YGNodeMarginForAxis(child, ABI13_0_0YGFlexDirectionColumn);
  } else {
    // If the child doesn't have a specified height, compute the height
    // based on the top/bottom
    // offsets if they're defined.
    if (ABI13_0_0YGNodeIsLeadingPosDefined(child, ABI13_0_0YGFlexDirectionColumn) &&
        ABI13_0_0YGNodeIsTrailingPosDefined(child, ABI13_0_0YGFlexDirectionColumn)) {
      childHeight = node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] -
                    (ABI13_0_0YGNodeLeadingBorder(node, ABI13_0_0YGFlexDirectionColumn) +
                     ABI13_0_0YGNodeTrailingBorder(node, ABI13_0_0YGFlexDirectionColumn)) -
                    (ABI13_0_0YGNodeLeadingPosition(child, ABI13_0_0YGFlexDirectionColumn) +
                     ABI13_0_0YGNodeTrailingPosition(child, ABI13_0_0YGFlexDirectionColumn));
      childHeight = ABI13_0_0YGNodeBoundAxis(child, ABI13_0_0YGFlexDirectionColumn, childHeight);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect ratio
  // calculation. One dimension being the anchor and the other being flexible.
  if (ABI13_0_0YGValueIsUndefined(childWidth) ^ ABI13_0_0YGValueIsUndefined(childHeight)) {
    if (!ABI13_0_0YGValueIsUndefined(child->style.aspectRatio)) {
      if (ABI13_0_0YGValueIsUndefined(childWidth)) {
        childWidth = fmaxf(childHeight * child->style.aspectRatio,
                           ABI13_0_0YGNodePaddingAndBorderForAxis(child, ABI13_0_0YGFlexDirectionColumn));
      } else if (ABI13_0_0YGValueIsUndefined(childHeight)) {
        childHeight = fmaxf(childWidth * child->style.aspectRatio,
                            ABI13_0_0YGNodePaddingAndBorderForAxis(child, ABI13_0_0YGFlexDirectionRow));
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (ABI13_0_0YGValueIsUndefined(childWidth) || ABI13_0_0YGValueIsUndefined(childHeight)) {
    childWidthMeasureMode =
        ABI13_0_0YGValueIsUndefined(childWidth) ? ABI13_0_0YGMeasureModeUndefined : ABI13_0_0YGMeasureModeExactly;
    childHeightMeasureMode =
        ABI13_0_0YGValueIsUndefined(childHeight) ? ABI13_0_0YGMeasureModeUndefined : ABI13_0_0YGMeasureModeExactly;

    // According to the spec, if the main size is not definite and the
    // child's inline axis is parallel to the main axis (i.e. it's
    // horizontal), the child should be sized using "UNDEFINED" in
    // the main size. Otherwise use "AT_MOST" in the cross axis.
    if (!isMainAxisRow && ABI13_0_0YGValueIsUndefined(childWidth) && widthMode != ABI13_0_0YGMeasureModeUndefined) {
      childWidth = width;
      childWidthMeasureMode = ABI13_0_0YGMeasureModeAtMost;
    }

    ABI13_0_0YGLayoutNodeInternal(child,
                         childWidth,
                         childHeight,
                         direction,
                         childWidthMeasureMode,
                         childHeightMeasureMode,
                         false,
                         "abs-measure");
    childWidth = child->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] +
                 ABI13_0_0YGNodeMarginForAxis(child, ABI13_0_0YGFlexDirectionRow);
    childHeight = child->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] +
                  ABI13_0_0YGNodeMarginForAxis(child, ABI13_0_0YGFlexDirectionColumn);
  }

  ABI13_0_0YGLayoutNodeInternal(child,
                       childWidth,
                       childHeight,
                       direction,
                       ABI13_0_0YGMeasureModeExactly,
                       ABI13_0_0YGMeasureModeExactly,
                       true,
                       "abs-layout");

  if (ABI13_0_0YGNodeIsTrailingPosDefined(child, mainAxis) && !ABI13_0_0YGNodeIsLeadingPosDefined(child, mainAxis)) {
    child->layout.position[leading[mainAxis]] = node->layout.measuredDimensions[dim[mainAxis]] -
                                                child->layout.measuredDimensions[dim[mainAxis]] -
                                                ABI13_0_0YGNodeTrailingBorder(node, mainAxis) -
                                                ABI13_0_0YGNodeTrailingPosition(child, mainAxis);
  }

  if (ABI13_0_0YGNodeIsTrailingPosDefined(child, crossAxis) &&
      !ABI13_0_0YGNodeIsLeadingPosDefined(child, crossAxis)) {
    child->layout.position[leading[crossAxis]] = node->layout.measuredDimensions[dim[crossAxis]] -
                                                 child->layout.measuredDimensions[dim[crossAxis]] -
                                                 ABI13_0_0YGNodeTrailingBorder(node, crossAxis) -
                                                 ABI13_0_0YGNodeTrailingPosition(child, crossAxis);
  }
}

static void ABI13_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(const ABI13_0_0YGNodeRef node,
                                                       const float availableWidth,
                                                       const float availableHeight,
                                                       const ABI13_0_0YGMeasureMode widthMeasureMode,
                                                       const ABI13_0_0YGMeasureMode heightMeasureMode) {
  ABI13_0_0YG_ASSERT(node->measure, "Expected node to have custom measure function");

  const float paddingAndBorderAxisRow = ABI13_0_0YGNodePaddingAndBorderForAxis(node, ABI13_0_0YGFlexDirectionRow);
  const float paddingAndBorderAxisColumn =
      ABI13_0_0YGNodePaddingAndBorderForAxis(node, ABI13_0_0YGFlexDirectionColumn);
  const float marginAxisRow = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionRow);
  const float marginAxisColumn = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionColumn);

  const float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

  if (widthMeasureMode == ABI13_0_0YGMeasureModeExactly && heightMeasureMode == ABI13_0_0YGMeasureModeExactly) {
    // Don't bother sizing the text if both dimensions are already defined.
    node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] =
        ABI13_0_0YGNodeBoundAxis(node, ABI13_0_0YGFlexDirectionRow, availableWidth - marginAxisRow);
    node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] =
        ABI13_0_0YGNodeBoundAxis(node, ABI13_0_0YGFlexDirectionColumn, availableHeight - marginAxisColumn);
  } else if (innerWidth <= 0 || innerHeight <= 0) {
    // Don't bother sizing the text if there's no horizontal or vertical
    // space.
    node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] =
        ABI13_0_0YGNodeBoundAxis(node, ABI13_0_0YGFlexDirectionRow, 0);
    node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] =
        ABI13_0_0YGNodeBoundAxis(node, ABI13_0_0YGFlexDirectionColumn, 0);
  } else {
    // Measure the text under the current constraints.
    const ABI13_0_0YGSize measuredSize =
        node->measure(node, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

    node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] =
        ABI13_0_0YGNodeBoundAxis(node,
                        ABI13_0_0YGFlexDirectionRow,
                        (widthMeasureMode == ABI13_0_0YGMeasureModeUndefined ||
                         widthMeasureMode == ABI13_0_0YGMeasureModeAtMost)
                            ? measuredSize.width + paddingAndBorderAxisRow
                            : availableWidth - marginAxisRow);
    node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] =
        ABI13_0_0YGNodeBoundAxis(node,
                        ABI13_0_0YGFlexDirectionColumn,
                        (heightMeasureMode == ABI13_0_0YGMeasureModeUndefined ||
                         heightMeasureMode == ABI13_0_0YGMeasureModeAtMost)
                            ? measuredSize.height + paddingAndBorderAxisColumn
                            : availableHeight - marginAxisColumn);
  }
}

// For nodes with no children, use the available values if they were provided,
// or the minimum size as indicated by the padding and border sizes.
static void ABI13_0_0YGNodeEmptyContainerSetMeasuredDimensions(const ABI13_0_0YGNodeRef node,
                                                      const float availableWidth,
                                                      const float availableHeight,
                                                      const ABI13_0_0YGMeasureMode widthMeasureMode,
                                                      const ABI13_0_0YGMeasureMode heightMeasureMode) {
  const float paddingAndBorderAxisRow = ABI13_0_0YGNodePaddingAndBorderForAxis(node, ABI13_0_0YGFlexDirectionRow);
  const float paddingAndBorderAxisColumn =
      ABI13_0_0YGNodePaddingAndBorderForAxis(node, ABI13_0_0YGFlexDirectionColumn);
  const float marginAxisRow = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionRow);
  const float marginAxisColumn = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionColumn);

  node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] =
      ABI13_0_0YGNodeBoundAxis(node,
                      ABI13_0_0YGFlexDirectionRow,
                      (widthMeasureMode == ABI13_0_0YGMeasureModeUndefined ||
                       widthMeasureMode == ABI13_0_0YGMeasureModeAtMost)
                          ? paddingAndBorderAxisRow
                          : availableWidth - marginAxisRow);
  node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] =
      ABI13_0_0YGNodeBoundAxis(node,
                      ABI13_0_0YGFlexDirectionColumn,
                      (heightMeasureMode == ABI13_0_0YGMeasureModeUndefined ||
                       heightMeasureMode == ABI13_0_0YGMeasureModeAtMost)
                          ? paddingAndBorderAxisColumn
                          : availableHeight - marginAxisColumn);
}

static bool ABI13_0_0YGNodeFixedSizeSetMeasuredDimensions(const ABI13_0_0YGNodeRef node,
                                                 const float availableWidth,
                                                 const float availableHeight,
                                                 const ABI13_0_0YGMeasureMode widthMeasureMode,
                                                 const ABI13_0_0YGMeasureMode heightMeasureMode) {
  if ((widthMeasureMode == ABI13_0_0YGMeasureModeAtMost && availableWidth <= 0) ||
      (heightMeasureMode == ABI13_0_0YGMeasureModeAtMost && availableHeight <= 0) ||
      (widthMeasureMode == ABI13_0_0YGMeasureModeExactly && heightMeasureMode == ABI13_0_0YGMeasureModeExactly)) {
    const float marginAxisColumn = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionColumn);
    const float marginAxisRow = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionRow);

    node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] =
        ABI13_0_0YGNodeBoundAxis(node,
                        ABI13_0_0YGFlexDirectionRow,
                        ABI13_0_0YGValueIsUndefined(availableWidth) || (widthMeasureMode == ABI13_0_0YGMeasureModeAtMost && availableWidth < 0)
                            ? 0
                            : availableWidth - marginAxisRow);

    node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] =
        ABI13_0_0YGNodeBoundAxis(node,
                        ABI13_0_0YGFlexDirectionColumn,
                        ABI13_0_0YGValueIsUndefined(availableHeight) || (heightMeasureMode == ABI13_0_0YGMeasureModeAtMost && availableHeight < 0)
                            ? 0
                            : availableHeight - marginAxisColumn);

    return true;
  }

  return false;
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C ABI13_0_0YG documentation: https://www.w3.org/TR/ABI13_0_0YG3-flexbox/.
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
//  * The 'wrap' property supports only 'nowrap' (which is the default) or
//  'wrap'. The
//    rarely-used 'wrap-reverse' is not supported.
//  * Rather than allowing arbitrary combinations of flexGrow, flexShrink and
//    flexBasis, this algorithm supports only the three most common
//    combinations:
//      flex: 0 is equiavlent to flex: 0 0 auto
//      flex: n (where n is a positive value) is equivalent to flex: n 1 auto
//          If POSITIVE_FLEX_IS_AUTO is 0, then it is equivalent to flex: n 0 0
//          This is faster because the content doesn't need to be measured, but
//          it's
//          less flexible because the basis is always 0 and can't be overriden
//          with
//          the width/height attributes.
//      flex: -1 (or any negative value) is equivalent to flex: 0 1 auto
//  * Margins cannot be specified as 'auto'. They must be specified in terms of
//  pixel
//    values, and the default value is 0.
//  * The 'baseline' value is not supported for alignItems and alignSelf
//  properties.
//  * Values of width, maxWidth, minWidth, height, maxHeight and minHeight must
//  be
//    specified as pixel values, not as percentages.
//  * There is no support for calculation of dimensions based on intrinsic
//  aspect ratios
//     (e.g. images).
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
//      or ABI13_0_0YGUndefined if the size is not available; interpretation depends on
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
//    from the spec (https://www.w3.org/TR/ABI13_0_0YG3-sizing/#terms):
//      - ABI13_0_0YGMeasureModeUndefined: max content
//      - ABI13_0_0YGMeasureModeExactly: fill available
//      - ABI13_0_0YGMeasureModeAtMost: fit content
//
//    When calling ABI13_0_0YGNodelayoutImpl and ABI13_0_0YGLayoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of ABI13_0_0YGMeasureModeUndefined
//    in that dimension.
//
static void ABI13_0_0YGNodelayoutImpl(const ABI13_0_0YGNodeRef node,
                             const float availableWidth,
                             const float availableHeight,
                             const ABI13_0_0YGDirection parentDirection,
                             const ABI13_0_0YGMeasureMode widthMeasureMode,
                             const ABI13_0_0YGMeasureMode heightMeasureMode,
                             const bool performLayout) {
  ABI13_0_0YG_ASSERT(ABI13_0_0YGValueIsUndefined(availableWidth) ? widthMeasureMode == ABI13_0_0YGMeasureModeUndefined : true,
            "availableWidth is indefinite so widthMeasureMode must be "
            "ABI13_0_0YGMeasureModeUndefined");
  ABI13_0_0YG_ASSERT(ABI13_0_0YGValueIsUndefined(availableHeight) ? heightMeasureMode == ABI13_0_0YGMeasureModeUndefined
                                                : true,
            "availableHeight is indefinite so heightMeasureMode must be "
            "ABI13_0_0YGMeasureModeUndefined");

  // Set the resolved resolution in the node's layout.
  const ABI13_0_0YGDirection direction = ABI13_0_0YGNodeResolveDirection(node, parentDirection);
  node->layout.direction = direction;

  if (node->measure) {
    ABI13_0_0YGNodeWithMeasureFuncSetMeasuredDimensions(
        node, availableWidth, availableHeight, widthMeasureMode, heightMeasureMode);
    return;
  }

  const uint32_t childCount = ABI13_0_0YGNodeListCount(node->children);
  if (childCount == 0) {
    ABI13_0_0YGNodeEmptyContainerSetMeasuredDimensions(
        node, availableWidth, availableHeight, widthMeasureMode, heightMeasureMode);
    return;
  }

  // If we're not being asked to perform a full layout we can skip the algorithm if we already know
  // the size
  if (!performLayout &&
      ABI13_0_0YGNodeFixedSizeSetMeasuredDimensions(
          node, availableWidth, availableHeight, widthMeasureMode, heightMeasureMode)) {
    return;
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const ABI13_0_0YGFlexDirection mainAxis = ABI13_0_0YGFlexDirectionResolve(node->style.flexDirection, direction);
  const ABI13_0_0YGFlexDirection crossAxis = ABI13_0_0YGFlexDirectionCross(mainAxis, direction);
  const bool isMainAxisRow = ABI13_0_0YGFlexDirectionIsRow(mainAxis);
  const ABI13_0_0YGJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap == ABI13_0_0YGWrapWrap;

  ABI13_0_0YGNodeRef firstAbsoluteChild = NULL;
  ABI13_0_0YGNodeRef currentAbsoluteChild = NULL;

  const float leadingPaddingAndBorderMain = ABI13_0_0YGNodeLeadingPaddingAndBorder(node, mainAxis);
  const float trailingPaddingAndBorderMain = ABI13_0_0YGNodeTrailingPaddingAndBorder(node, mainAxis);
  const float leadingPaddingAndBorderCross = ABI13_0_0YGNodeLeadingPaddingAndBorder(node, crossAxis);
  const float paddingAndBorderAxisMain = ABI13_0_0YGNodePaddingAndBorderForAxis(node, mainAxis);
  const float paddingAndBorderAxisCross = ABI13_0_0YGNodePaddingAndBorderForAxis(node, crossAxis);

  const ABI13_0_0YGMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  const ABI13_0_0YGMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  const float paddingAndBorderAxisRow = ABI13_0_0YGNodePaddingAndBorderForAxis(node, ABI13_0_0YGFlexDirectionRow);
  const float paddingAndBorderAxisColumn =
      ABI13_0_0YGNodePaddingAndBorderForAxis(node, ABI13_0_0YGFlexDirectionColumn);
  const float marginAxisRow = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionRow);
  const float marginAxisColumn = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionColumn);

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  const float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float availableInnerHeight =
      availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  const float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // If there is only one child with flexGrow + flexShrink it means we can set the
  // computedFlexBasis to 0 instead of measuring and shrinking / flexing the child to exactly
  // match the remaining space
  ABI13_0_0YGNodeRef singleFlexChild = NULL;
  if ((isMainAxisRow && widthMeasureMode == ABI13_0_0YGMeasureModeExactly) ||
      (!isMainAxisRow && heightMeasureMode == ABI13_0_0YGMeasureModeExactly)) {
    for (uint32_t i = 0; i < childCount; i++) {
      const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeGetChild(node, i);
      if (singleFlexChild) {
        if (ABI13_0_0YGNodeIsFlex(child)) {
          // There is already a flexible child, abort.
          singleFlexChild = NULL;
          break;
        }
      } else if (ABI13_0_0YGNodeStyleGetFlexGrow(child) > 0 && ABI13_0_0YGNodeStyleGetFlexShrink(child) > 0) {
        singleFlexChild = child;
      }
    }
  }

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeListGet(node->children, i);

    if (performLayout) {
      // Set the initial position (relative to the parent).
      const ABI13_0_0YGDirection childDirection = ABI13_0_0YGNodeResolveDirection(child, direction);
      ABI13_0_0YGNodeSetPosition(child, childDirection);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == ABI13_0_0YGPositionTypeAbsolute) {
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
        ABI13_0_0YGNodeComputeFlexBasisForChild(node,
                                       child,
                                       availableInnerWidth,
                                       widthMeasureMode,
                                       availableInnerHeight,
                                       heightMeasureMode,
                                       direction);
      }
    }
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
    ABI13_0_0YGNodeRef firstRelativeChild = NULL;
    ABI13_0_0YGNodeRef currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    for (uint32_t i = startOfLineIndex; i < childCount; i++, endOfLineIndex++) {
      const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeListGet(node->children, i);
      child->lineIndex = lineCount;

      if (child->style.positionType != ABI13_0_0YGPositionTypeAbsolute) {
        const float outerFlexBasis =
            child->layout.computedFlexBasis + ABI13_0_0YGNodeMarginForAxis(child, mainAxis);

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

        if (ABI13_0_0YGNodeIsFlex(child)) {
          totalFlexGrowFactors += ABI13_0_0YGNodeStyleGetFlexGrow(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the
          // child
          // dimension.
          totalFlexShrinkScaledFactors +=
              -ABI13_0_0YGNodeStyleGetFlexShrink(child) * child->layout.computedFlexBasis;
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
    const bool canSkipFlex = !performLayout && measureModeCrossDim == ABI13_0_0YGMeasureModeExactly;

    // In order to position the elements in the main axis, we have two
    // controls. The space between the beginning and the first element
    // and the space between each two elements.
    float leadingMainDim = 0;
    float betweenMainDim = 0;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated.
    // If the main dimension size isn't known, it is computed based on
    // the line length, so there's no more space left to distribute.
    float remainingFreeSpace = 0;
    if (!ABI13_0_0YGValueIsUndefined(availableInnerMainDim)) {
      remainingFreeSpace = availableInnerMainDim - sizeConsumedOnCurrentLine;
    } else if (sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized
      // based on its
      // content.
      // sizeConsumedOnCurrentLine is negative which means the node will
      // allocate 0 pixels for
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
      // spec (https://www.w3.org/TR/ABI13_0_0YG-flexbox-1/#resolve-flexible-lengths)
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
          flexShrinkScaledFactor = -ABI13_0_0YGNodeStyleGetFlexShrink(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize =
                childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = ABI13_0_0YGNodeBoundAxis(currentRelativeChild, mainAxis, baseMainSize);
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
          flexGrowFactor = ABI13_0_0YGNodeStyleGetFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize =
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = ABI13_0_0YGNodeBoundAxis(currentRelativeChild, mainAxis, baseMainSize);
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
          flexShrinkScaledFactor = -ABI13_0_0YGNodeStyleGetFlexShrink(currentRelativeChild) * childFlexBasis;
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

            updatedMainSize = ABI13_0_0YGNodeBoundAxis(currentRelativeChild, mainAxis, childSize);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = ABI13_0_0YGNodeStyleGetFlexGrow(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize =
                ABI13_0_0YGNodeBoundAxis(currentRelativeChild,
                                mainAxis,
                                childFlexBasis +
                                    remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        float childWidth;
        float childHeight;
        ABI13_0_0YGMeasureMode childWidthMeasureMode;
        ABI13_0_0YGMeasureMode childHeightMeasureMode;

        if (isMainAxisRow) {
          childWidth =
              updatedMainSize + ABI13_0_0YGNodeMarginForAxis(currentRelativeChild, ABI13_0_0YGFlexDirectionRow);
          childWidthMeasureMode = ABI13_0_0YGMeasureModeExactly;

          if (!ABI13_0_0YGValueIsUndefined(availableInnerCrossDim) &&
              !ABI13_0_0YGNodeIsStyleDimDefined(currentRelativeChild, ABI13_0_0YGFlexDirectionColumn) &&
              heightMeasureMode == ABI13_0_0YGMeasureModeExactly &&
              ABI13_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI13_0_0YGAlignStretch) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = ABI13_0_0YGMeasureModeExactly;
          } else if (!ABI13_0_0YGNodeIsStyleDimDefined(currentRelativeChild, ABI13_0_0YGFlexDirectionColumn)) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode =
                ABI13_0_0YGValueIsUndefined(childHeight) ? ABI13_0_0YGMeasureModeUndefined : ABI13_0_0YGMeasureModeAtMost;
          } else {
            childHeight = currentRelativeChild->style.dimensions[ABI13_0_0YGDimensionHeight] +
                          ABI13_0_0YGNodeMarginForAxis(currentRelativeChild, ABI13_0_0YGFlexDirectionColumn);
            childHeightMeasureMode = ABI13_0_0YGMeasureModeExactly;
          }
        } else {
          childHeight =
              updatedMainSize + ABI13_0_0YGNodeMarginForAxis(currentRelativeChild, ABI13_0_0YGFlexDirectionColumn);
          childHeightMeasureMode = ABI13_0_0YGMeasureModeExactly;

          if (!ABI13_0_0YGValueIsUndefined(availableInnerCrossDim) &&
              !ABI13_0_0YGNodeIsStyleDimDefined(currentRelativeChild, ABI13_0_0YGFlexDirectionRow) &&
              widthMeasureMode == ABI13_0_0YGMeasureModeExactly &&
              ABI13_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI13_0_0YGAlignStretch) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = ABI13_0_0YGMeasureModeExactly;
          } else if (!ABI13_0_0YGNodeIsStyleDimDefined(currentRelativeChild, ABI13_0_0YGFlexDirectionRow)) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode =
                ABI13_0_0YGValueIsUndefined(childWidth) ? ABI13_0_0YGMeasureModeUndefined : ABI13_0_0YGMeasureModeAtMost;
          } else {
            childWidth = currentRelativeChild->style.dimensions[ABI13_0_0YGDimensionWidth] +
                         ABI13_0_0YGNodeMarginForAxis(currentRelativeChild, ABI13_0_0YGFlexDirectionRow);
            childWidthMeasureMode = ABI13_0_0YGMeasureModeExactly;
          }
        }

        if (!ABI13_0_0YGValueIsUndefined(currentRelativeChild->style.aspectRatio)) {
          if (isMainAxisRow && childHeightMeasureMode != ABI13_0_0YGMeasureModeExactly) {
            childHeight =
                fmaxf(childWidth * currentRelativeChild->style.aspectRatio,
                      ABI13_0_0YGNodePaddingAndBorderForAxis(currentRelativeChild, ABI13_0_0YGFlexDirectionColumn));
            childHeightMeasureMode = ABI13_0_0YGMeasureModeExactly;
          } else if (!isMainAxisRow && childWidthMeasureMode != ABI13_0_0YGMeasureModeExactly) {
            childWidth =
                fmaxf(childHeight * currentRelativeChild->style.aspectRatio,
                      ABI13_0_0YGNodePaddingAndBorderForAxis(currentRelativeChild, ABI13_0_0YGFlexDirectionRow));
            childWidthMeasureMode = ABI13_0_0YGMeasureModeExactly;
          }
        }

        ABI13_0_0YGConstrainMaxSizeForMode(currentRelativeChild->style.maxDimensions[ABI13_0_0YGDimensionWidth],
                                  &childWidthMeasureMode,
                                  &childWidth);
        ABI13_0_0YGConstrainMaxSizeForMode(currentRelativeChild->style.maxDimensions[ABI13_0_0YGDimensionHeight],
                                  &childHeightMeasureMode,
                                  &childHeight);

        const bool requiresStretchLayout =
            !ABI13_0_0YGNodeIsStyleDimDefined(currentRelativeChild, crossAxis) &&
            ABI13_0_0YGNodeAlignItem(node, currentRelativeChild) == ABI13_0_0YGAlignStretch;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        ABI13_0_0YGLayoutNodeInternal(currentRelativeChild,
                             childWidth,
                             childHeight,
                             direction,
                             childWidthMeasureMode,
                             childHeightMeasureMode,
                             performLayout && !requiresStretchLayout,
                             "flex");

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

    if (measureModeMainDim == ABI13_0_0YGMeasureModeAtMost && remainingFreeSpace > 0) {
      if (!ABI13_0_0YGValueIsUndefined(node->style.minDimensions[dim[mainAxis]]) &&
          node->style.minDimensions[dim[mainAxis]] >= 0) {
        remainingFreeSpace = fmaxf(0,
                                   node->style.minDimensions[dim[mainAxis]] -
                                       (availableInnerMainDim - remainingFreeSpace));
      } else {
        remainingFreeSpace = 0;
      }
    }

    switch (justifyContent) {
      case ABI13_0_0YGJustifyCenter:
        leadingMainDim = remainingFreeSpace / 2;
        break;
      case ABI13_0_0YGJustifyFlexEnd:
        leadingMainDim = remainingFreeSpace;
        break;
      case ABI13_0_0YGJustifySpaceBetween:
        if (itemsOnLine > 1) {
          betweenMainDim = fmaxf(remainingFreeSpace, 0) / (itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
        break;
      case ABI13_0_0YGJustifySpaceAround:
        // Space on the edges is half of the space between elements
        betweenMainDim = remainingFreeSpace / itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
        break;
      case ABI13_0_0YGJustifyFlexStart:
      case ABI13_0_0YGJustifyCount:
        break;
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeListGet(node->children, i);

      if (child->style.positionType == ABI13_0_0YGPositionTypeAbsolute &&
          ABI13_0_0YGNodeIsLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] = ABI13_0_0YGNodeLeadingPosition(child, mainAxis) +
                                                  ABI13_0_0YGNodeLeadingBorder(node, mainAxis) +
                                                  ABI13_0_0YGNodeLeadingMargin(child, mainAxis);
        }
      } else {
        // Now that we placed the element, we need to update the variables.
        // We need to do that only for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.positionType == ABI13_0_0YGPositionTypeRelative) {
          if (performLayout) {
            child->layout.position[pos[mainAxis]] += mainDim;
          }

          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the
            // measuredDims because
            // they weren't computed. This means we can't call ABI13_0_0YGNodeDimWithMargin.
            mainDim += betweenMainDim + ABI13_0_0YGNodeMarginForAxis(child, mainAxis) +
                       child->layout.computedFlexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus
            // the spacing.
            mainDim += betweenMainDim + ABI13_0_0YGNodeDimWithMargin(child, mainAxis);

            // The cross dimension is the max of the elements dimension since
            // there
            // can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, ABI13_0_0YGNodeDimWithMargin(child, crossAxis));
          }
        } else if (performLayout) {
          child->layout.position[pos[mainAxis]] +=
              ABI13_0_0YGNodeLeadingBorder(node, mainAxis) + leadingMainDim;
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == ABI13_0_0YGMeasureModeUndefined ||
        measureModeCrossDim == ABI13_0_0YGMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = ABI13_0_0YGNodeBoundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) -
                           paddingAndBorderAxisCross;

      if (measureModeCrossDim == ABI13_0_0YGMeasureModeAtMost) {
        containerCrossAxis = fminf(containerCrossAxis, availableInnerCrossDim);
      }
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI13_0_0YGMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = ABI13_0_0YGNodeBoundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) -
               paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeListGet(node->children, i);

        if (child->style.positionType == ABI13_0_0YGPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          if (ABI13_0_0YGNodeIsLeadingPosDefined(child, crossAxis)) {
            child->layout.position[pos[crossAxis]] = ABI13_0_0YGNodeLeadingPosition(child, crossAxis) +
                                                     ABI13_0_0YGNodeLeadingBorder(node, crossAxis) +
                                                     ABI13_0_0YGNodeLeadingMargin(child, crossAxis);
          } else {
            child->layout.position[pos[crossAxis]] =
                ABI13_0_0YGNodeLeadingBorder(node, crossAxis) + ABI13_0_0YGNodeLeadingMargin(child, crossAxis);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const ABI13_0_0YGAlign alignItem = ABI13_0_0YGNodeAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == ABI13_0_0YGAlignStretch) {
            const bool isCrossSizeDefinite =
                (isMainAxisRow && ABI13_0_0YGNodeIsStyleDimDefined(child, ABI13_0_0YGFlexDirectionColumn)) ||
                (!isMainAxisRow && ABI13_0_0YGNodeIsStyleDimDefined(child, ABI13_0_0YGFlexDirectionRow));

            float childWidth;
            float childHeight;
            ABI13_0_0YGMeasureMode childWidthMeasureMode = ABI13_0_0YGMeasureModeExactly;
            ABI13_0_0YGMeasureMode childHeightMeasureMode = ABI13_0_0YGMeasureModeExactly;

            if (isMainAxisRow) {
              childHeight = crossDim;
              childWidth = child->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] +
                           ABI13_0_0YGNodeMarginForAxis(child, ABI13_0_0YGFlexDirectionRow);
            } else {
              childWidth = crossDim;
              childHeight = child->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] +
                            ABI13_0_0YGNodeMarginForAxis(child, ABI13_0_0YGFlexDirectionColumn);
            }

            ABI13_0_0YGConstrainMaxSizeForMode(child->style.maxDimensions[ABI13_0_0YGDimensionWidth],
                                      &childWidthMeasureMode,
                                      &childWidth);
            ABI13_0_0YGConstrainMaxSizeForMode(child->style.maxDimensions[ABI13_0_0YGDimensionHeight],
                                      &childHeightMeasureMode,
                                      &childHeight);

            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!isCrossSizeDefinite) {
              childWidthMeasureMode =
                  ABI13_0_0YGValueIsUndefined(childWidth) ? ABI13_0_0YGMeasureModeUndefined : ABI13_0_0YGMeasureModeExactly;
              childHeightMeasureMode =
                  ABI13_0_0YGValueIsUndefined(childHeight) ? ABI13_0_0YGMeasureModeUndefined : ABI13_0_0YGMeasureModeExactly;

              ABI13_0_0YGLayoutNodeInternal(child,
                                   childWidth,
                                   childHeight,
                                   direction,
                                   childWidthMeasureMode,
                                   childHeightMeasureMode,
                                   true,
                                   "stretch");
            }
          } else if (alignItem != ABI13_0_0YGAlignFlexStart) {
            const float remainingCrossDim =
                containerCrossAxis - ABI13_0_0YGNodeDimWithMargin(child, crossAxis);

            if (alignItem == ABI13_0_0YGAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else { // ABI13_0_0YGAlignFlexEnd
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
  if (lineCount > 1 && performLayout && !ABI13_0_0YGValueIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    switch (node->style.alignContent) {
      case ABI13_0_0YGAlignFlexEnd:
        currentLead += remainingAlignContentDim;
        break;
      case ABI13_0_0YGAlignCenter:
        currentLead += remainingAlignContentDim / 2;
        break;
      case ABI13_0_0YGAlignStretch:
        if (availableInnerCrossDim > totalLineCrossDim) {
          crossDimLead = (remainingAlignContentDim / lineCount);
        }
        break;
      case ABI13_0_0YGAlignAuto:
      case ABI13_0_0YGAlignFlexStart:
      case ABI13_0_0YGAlignCount:
        break;
    }

    uint32_t endIndex = 0;
    for (uint32_t i = 0; i < lineCount; i++) {
      uint32_t startIndex = endIndex;
      uint32_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeListGet(node->children, ii);

        if (child->style.positionType == ABI13_0_0YGPositionTypeRelative) {
          if (child->lineIndex != i) {
            break;
          }

          if (ABI13_0_0YGNodeIsLayoutDimDefined(child, crossAxis)) {
            lineHeight = fmaxf(lineHeight,
                               child->layout.measuredDimensions[dim[crossAxis]] +
                                   ABI13_0_0YGNodeMarginForAxis(child, crossAxis));
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeListGet(node->children, ii);

          if (child->style.positionType == ABI13_0_0YGPositionTypeRelative) {
            switch (ABI13_0_0YGNodeAlignItem(node, child)) {
              case ABI13_0_0YGAlignFlexStart: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + ABI13_0_0YGNodeLeadingMargin(child, crossAxis);
                break;
              }
              case ABI13_0_0YGAlignFlexEnd: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight - ABI13_0_0YGNodeTrailingMargin(child, crossAxis) -
                    child->layout.measuredDimensions[dim[crossAxis]];
                break;
              }
              case ABI13_0_0YGAlignCenter: {
                float childHeight = child->layout.measuredDimensions[dim[crossAxis]];
                child->layout.position[pos[crossAxis]] =
                    currentLead + (lineHeight - childHeight) / 2;
                break;
              }
              case ABI13_0_0YGAlignStretch: {
                child->layout.position[pos[crossAxis]] =
                    currentLead + ABI13_0_0YGNodeLeadingMargin(child, crossAxis);
                // TODO(prenaux): Correctly set the height of items with indefinite
                //                (auto) crossAxis dimension.
                break;
              }
              case ABI13_0_0YGAlignAuto:
              case ABI13_0_0YGAlignCount:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth] =
      ABI13_0_0YGNodeBoundAxis(node, ABI13_0_0YGFlexDirectionRow, availableWidth - marginAxisRow);
  node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight] =
      ABI13_0_0YGNodeBoundAxis(node, ABI13_0_0YGFlexDirectionColumn, availableHeight - marginAxisColumn);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI13_0_0YGMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] =
        ABI13_0_0YGNodeBoundAxis(node, mainAxis, maxLineMainDim);
  } else if (measureModeMainDim == ABI13_0_0YGMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[mainAxis]] =
        fmaxf(fminf(availableInnerMainDim + paddingAndBorderAxisMain,
                    ABI13_0_0YGNodeBoundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim)),
              paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == ABI13_0_0YGMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        ABI13_0_0YGNodeBoundAxis(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross);
  } else if (measureModeCrossDim == ABI13_0_0YGMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[crossAxis]] =
        fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    ABI13_0_0YGNodeBoundAxisWithinMinAndMax(node,
                                                   crossAxis,
                                                   totalLineCrossDim + paddingAndBorderAxisCross)),
              paddingAndBorderAxisCross);
  }

  if (performLayout) {
    // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
    for (currentAbsoluteChild = firstAbsoluteChild; currentAbsoluteChild != NULL;
         currentAbsoluteChild = currentAbsoluteChild->nextChild) {
      ABI13_0_0YGNodeAbsoluteLayoutChild(
          node, currentAbsoluteChild, availableInnerWidth, widthMeasureMode, direction);
    }

    // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
    const bool needsMainTrailingPos =
        mainAxis == ABI13_0_0YGFlexDirectionRowReverse || mainAxis == ABI13_0_0YGFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        crossAxis == ABI13_0_0YGFlexDirectionRowReverse || crossAxis == ABI13_0_0YGFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const ABI13_0_0YGNodeRef child = ABI13_0_0YGNodeListGet(node->children, i);

        if (needsMainTrailingPos) {
          ABI13_0_0YGNodeSetChildTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          ABI13_0_0YGNodeSetChildTrailingPosition(node, child, crossAxis);
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

static const char *ABI13_0_0YGSpacer(const unsigned long level) {
  const size_t spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char *ABI13_0_0YGMeasureModeName(const ABI13_0_0YGMeasureMode mode, const bool performLayout) {
  const char *kMeasureModeNames[ABI13_0_0YGMeasureModeCount] = {"UNDEFINED", "ABI13_0_0EXACTLY", "AT_MOST"};
  const char *kLayoutModeNames[ABI13_0_0YGMeasureModeCount] = {"LAY_UNDEFINED",
                                                      "LAY_EXACTLY",
                                                      "LAY_AT_"
                                                      "MOST"};

  if (mode >= ABI13_0_0YGMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static inline bool ABI13_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(ABI13_0_0YGMeasureMode sizeMode,
                                                                     float size,
                                                                     float lastComputedSize) {
  return sizeMode == ABI13_0_0YGMeasureModeExactly && ABI13_0_0YGFloatsEqual(size, lastComputedSize);
}

static inline bool ABI13_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(ABI13_0_0YGMeasureMode sizeMode,
                                                                 float size,
                                                                 ABI13_0_0YGMeasureMode lastSizeMode,
                                                                 float lastComputedSize) {
  return sizeMode == ABI13_0_0YGMeasureModeAtMost && lastSizeMode == ABI13_0_0YGMeasureModeUndefined &&
         size >= lastComputedSize;
}

static inline bool ABI13_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(ABI13_0_0YGMeasureMode sizeMode,
                                                                      float size,
                                                                      ABI13_0_0YGMeasureMode lastSizeMode,
                                                                      float lastSize,
                                                                      float lastComputedSize) {
  return lastSizeMode == ABI13_0_0YGMeasureModeAtMost && sizeMode == ABI13_0_0YGMeasureModeAtMost &&
         lastSize > size && lastComputedSize <= size;
}

bool ABI13_0_0YGNodeCanUseCachedMeasurement(const ABI13_0_0YGMeasureMode widthMode,
                                   const float width,
                                   const ABI13_0_0YGMeasureMode heightMode,
                                   const float height,
                                   const ABI13_0_0YGMeasureMode lastWidthMode,
                                   const float lastWidth,
                                   const ABI13_0_0YGMeasureMode lastHeightMode,
                                   const float lastHeight,
                                   const float lastComputedWidth,
                                   const float lastComputedHeight,
                                   const float marginRow,
                                   const float marginColumn) {
  if (lastComputedHeight < 0 || lastComputedWidth < 0) {
    return false;
  }

  const bool hasSameWidthSpec = lastWidthMode == widthMode && ABI13_0_0YGFloatsEqual(lastWidth, width);
  const bool hasSameHeightSpec = lastHeightMode == heightMode && ABI13_0_0YGFloatsEqual(lastHeight, height);

  const bool widthIsCompatible =
      hasSameWidthSpec || ABI13_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(widthMode,
                                                                            width - marginRow,
                                                                            lastComputedWidth) ||
      ABI13_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(widthMode,
                                                    width - marginRow,
                                                    lastWidthMode,
                                                    lastComputedWidth) ||
      ABI13_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          widthMode, width - marginRow, lastWidthMode, lastWidth, lastComputedWidth);

  const bool heightIsCompatible =
      hasSameHeightSpec || ABI13_0_0YGMeasureModeSizeIsExactAndMatchesOldMeasuredSize(heightMode,
                                                                             height - marginColumn,
                                                                             lastComputedHeight) ||
      ABI13_0_0YGMeasureModeOldSizeIsUnspecifiedAndStillFits(heightMode,
                                                    height - marginColumn,
                                                    lastHeightMode,
                                                    lastComputedHeight) ||
      ABI13_0_0YGMeasureModeNewMeasureSizeIsStricterAndStillValid(
          heightMode, height - marginColumn, lastHeightMode, lastHeight, lastComputedHeight);

  return widthIsCompatible && heightIsCompatible;
}

//
// This is a wrapper around the ABI13_0_0YGNodelayoutImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as ABI13_0_0YGNodelayoutImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool ABI13_0_0YGLayoutNodeInternal(const ABI13_0_0YGNodeRef node,
                          const float availableWidth,
                          const float availableHeight,
                          const ABI13_0_0YGDirection parentDirection,
                          const ABI13_0_0YGMeasureMode widthMeasureMode,
                          const ABI13_0_0YGMeasureMode heightMeasureMode,
                          const bool performLayout,
                          const char *reason) {
  ABI13_0_0YGLayout *layout = &node->layout;

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.widthMeasureMode = (ABI13_0_0YGMeasureMode) -1;
    layout->cachedLayout.heightMeasureMode = (ABI13_0_0YGMeasureMode) -1;
    layout->cachedLayout.computedWidth = -1;
    layout->cachedLayout.computedHeight = -1;
  }

  ABI13_0_0YGCachedMeasurement *cachedResults = NULL;

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
    const float marginAxisRow = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionRow);
    const float marginAxisColumn = ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionColumn);

    // First, try to use the layout cache.
    if (ABI13_0_0YGNodeCanUseCachedMeasurement(widthMeasureMode,
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
        if (ABI13_0_0YGNodeCanUseCachedMeasurement(widthMeasureMode,
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
    if (ABI13_0_0YGFloatsEqual(layout->cachedLayout.availableWidth, availableWidth) &&
        ABI13_0_0YGFloatsEqual(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (ABI13_0_0YGFloatsEqual(layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          ABI13_0_0YGFloatsEqual(layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != NULL) {
    layout->measuredDimensions[ABI13_0_0YGDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI13_0_0YGDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", ABI13_0_0YGSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
             ABI13_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI13_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             cachedResults->computedWidth,
             cachedResults->computedHeight,
             reason);
    }
  } else {
    if (gPrintChanges) {
      printf("%s%d.{%s", ABI13_0_0YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n",
             ABI13_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI13_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             reason);
    }

    ABI13_0_0YGNodelayoutImpl(node,
                     availableWidth,
                     availableHeight,
                     parentDirection,
                     widthMeasureMode,
                     heightMeasureMode,
                     performLayout);

    if (gPrintChanges) {
      printf("%s%d.}%s", ABI13_0_0YGSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
             ABI13_0_0YGMeasureModeName(widthMeasureMode, performLayout),
             ABI13_0_0YGMeasureModeName(heightMeasureMode, performLayout),
             layout->measuredDimensions[ABI13_0_0YGDimensionWidth],
             layout->measuredDimensions[ABI13_0_0YGDimensionHeight],
             reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == NULL) {
      if (layout->nextCachedMeasurementsIndex == ABI13_0_0YG_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI13_0_0YGCachedMeasurement *newCacheEntry;
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
      newCacheEntry->computedWidth = layout->measuredDimensions[ABI13_0_0YGDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[ABI13_0_0YGDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[ABI13_0_0YGDimensionWidth] = node->layout.measuredDimensions[ABI13_0_0YGDimensionWidth];
    node->layout.dimensions[ABI13_0_0YGDimensionHeight] = node->layout.measuredDimensions[ABI13_0_0YGDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

static void roundToPixelGrid(const ABI13_0_0YGNodeRef node) {
  const float fractialLeft =
      node->layout.position[ABI13_0_0YGEdgeLeft] - floorf(node->layout.position[ABI13_0_0YGEdgeLeft]);
  const float fractialTop =
      node->layout.position[ABI13_0_0YGEdgeTop] - floorf(node->layout.position[ABI13_0_0YGEdgeTop]);
  node->layout.dimensions[ABI13_0_0YGDimensionWidth] =
      roundf(fractialLeft + node->layout.dimensions[ABI13_0_0YGDimensionWidth]) - roundf(fractialLeft);
  node->layout.dimensions[ABI13_0_0YGDimensionHeight] =
      roundf(fractialTop + node->layout.dimensions[ABI13_0_0YGDimensionHeight]) - roundf(fractialTop);

  node->layout.position[ABI13_0_0YGEdgeLeft] = roundf(node->layout.position[ABI13_0_0YGEdgeLeft]);
  node->layout.position[ABI13_0_0YGEdgeTop] = roundf(node->layout.position[ABI13_0_0YGEdgeTop]);

  const uint32_t childCount = ABI13_0_0YGNodeListCount(node->children);
  for (uint32_t i = 0; i < childCount; i++) {
    roundToPixelGrid(ABI13_0_0YGNodeGetChild(node, i));
  }
}

void ABI13_0_0YGNodeCalculateLayout(const ABI13_0_0YGNodeRef node,
                           const float availableWidth,
                           const float availableHeight,
                           const ABI13_0_0YGDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  float width = availableWidth;
  float height = availableHeight;
  ABI13_0_0YGMeasureMode widthMeasureMode = ABI13_0_0YGMeasureModeUndefined;
  ABI13_0_0YGMeasureMode heightMeasureMode = ABI13_0_0YGMeasureModeUndefined;

  if (!ABI13_0_0YGValueIsUndefined(width)) {
    widthMeasureMode = ABI13_0_0YGMeasureModeExactly;
  } else if (ABI13_0_0YGNodeIsStyleDimDefined(node, ABI13_0_0YGFlexDirectionRow)) {
    width = node->style.dimensions[dim[ABI13_0_0YGFlexDirectionRow]] +
            ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionRow);
    widthMeasureMode = ABI13_0_0YGMeasureModeExactly;
  } else if (node->style.maxDimensions[ABI13_0_0YGDimensionWidth] >= 0.0) {
    width = node->style.maxDimensions[ABI13_0_0YGDimensionWidth];
    widthMeasureMode = ABI13_0_0YGMeasureModeAtMost;
  }

  if (!ABI13_0_0YGValueIsUndefined(height)) {
    heightMeasureMode = ABI13_0_0YGMeasureModeExactly;
  } else if (ABI13_0_0YGNodeIsStyleDimDefined(node, ABI13_0_0YGFlexDirectionColumn)) {
    height = node->style.dimensions[dim[ABI13_0_0YGFlexDirectionColumn]] +
             ABI13_0_0YGNodeMarginForAxis(node, ABI13_0_0YGFlexDirectionColumn);
    heightMeasureMode = ABI13_0_0YGMeasureModeExactly;
  } else if (node->style.maxDimensions[ABI13_0_0YGDimensionHeight] >= 0.0) {
    height = node->style.maxDimensions[ABI13_0_0YGDimensionHeight];
    heightMeasureMode = ABI13_0_0YGMeasureModeAtMost;
  }

  if (ABI13_0_0YGLayoutNodeInternal(node,
                           width,
                           height,
                           parentDirection,
                           widthMeasureMode,
                           heightMeasureMode,
                           true,
                           "initia"
                           "l")) {
    ABI13_0_0YGNodeSetPosition(node, node->layout.direction);

    if (ABI13_0_0YGIsExperimentalFeatureEnabled(ABI13_0_0YGExperimentalFeatureRounding)) {
      roundToPixelGrid(node);
    }

    if (gPrintTree) {
      ABI13_0_0YGNodePrint(node, ABI13_0_0YGPrintOptionsLayout | ABI13_0_0YGPrintOptionsChildren | ABI13_0_0YGPrintOptionsStyle);
    }
  }
}

void ABI13_0_0YGSetLogger(ABI13_0_0YGLogger logger) {
  gLogger = logger;
}

void ABI13_0_0YGLog(ABI13_0_0YGLogLevel level, const char *format, ...) {
  va_list args;
  va_start(args, format);
  gLogger(level, format, args);
  va_end(args);
}

static bool experimentalFeatures[ABI13_0_0YGExperimentalFeatureCount + 1];

void ABI13_0_0YGSetExperimentalFeatureEnabled(ABI13_0_0YGExperimentalFeature feature, bool enabled) {
  experimentalFeatures[feature] = enabled;
}

inline bool ABI13_0_0YGIsExperimentalFeatureEnabled(ABI13_0_0YGExperimentalFeature feature) {
  return experimentalFeatures[feature];
}

void ABI13_0_0YGSetMemoryFuncs(ABI13_0_0YGMalloc ygmalloc, ABI13_0_0YGCalloc yccalloc, ABI13_0_0YGRealloc ygrealloc, ABI13_0_0YGFree ygfree) {
  ABI13_0_0YG_ASSERT(gNodeInstanceCount == 0, "Cannot set memory functions: all node must be freed first");
  ABI13_0_0YG_ASSERT((ygmalloc == NULL && yccalloc == NULL && ygrealloc == NULL && ygfree == NULL) ||
                (ygmalloc != NULL && yccalloc != NULL && ygrealloc != NULL && ygfree != NULL),
            "Cannot set memory functions: functions must be all NULL or Non-NULL");

  if (ygmalloc == NULL || yccalloc == NULL || ygrealloc == NULL || ygfree == NULL) {
    gABI13_0_0YGMalloc = &malloc;
    gABI13_0_0YGCalloc = &calloc;
    gABI13_0_0YGRealloc = &realloc;
    gABI13_0_0YGFree = &free;
  } else {
    gABI13_0_0YGMalloc = ygmalloc;
    gABI13_0_0YGCalloc = yccalloc;
    gABI13_0_0YGRealloc = ygrealloc;
    gABI13_0_0YGFree = ygfree;
  }
}
