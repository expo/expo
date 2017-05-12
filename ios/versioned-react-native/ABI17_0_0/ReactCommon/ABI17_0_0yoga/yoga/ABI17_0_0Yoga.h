/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <assert.h>
#include <math.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

// Not defined in MSVC++
#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *) __nan)
#endif

#define ABI17_0_0YGUndefined NAN

#include "ABI17_0_0YGEnums.h"
#include "ABI17_0_0YGMacros.h"

ABI17_0_0YG_EXTERN_C_BEGIN

typedef struct ABI17_0_0YGSize {
  float width;
  float height;
} ABI17_0_0YGSize;

typedef struct ABI17_0_0YGValue {
  float value;
  ABI17_0_0YGUnit unit;
} ABI17_0_0YGValue;

static const ABI17_0_0YGValue ABI17_0_0YGValueUndefined = {ABI17_0_0YGUndefined, ABI17_0_0YGUnitUndefined};
static const ABI17_0_0YGValue ABI17_0_0YGValueAuto = {ABI17_0_0YGUndefined, ABI17_0_0YGUnitAuto};

typedef struct ABI17_0_0YGConfig *ABI17_0_0YGConfigRef;
typedef struct ABI17_0_0YGNode *ABI17_0_0YGNodeRef;
typedef ABI17_0_0YGSize (*ABI17_0_0YGMeasureFunc)(ABI17_0_0YGNodeRef node,
                                float width,
                                ABI17_0_0YGMeasureMode widthMode,
                                float height,
                                ABI17_0_0YGMeasureMode heightMode);
typedef float (*ABI17_0_0YGBaselineFunc)(ABI17_0_0YGNodeRef node, const float width, const float height);
typedef void (*ABI17_0_0YGPrintFunc)(ABI17_0_0YGNodeRef node);
typedef int (*ABI17_0_0YGLogger)(ABI17_0_0YGLogLevel level, const char *format, va_list args);

typedef void *(*ABI17_0_0YGMalloc)(size_t size);
typedef void *(*ABI17_0_0YGCalloc)(size_t count, size_t size);
typedef void *(*ABI17_0_0YGRealloc)(void *ptr, size_t size);
typedef void (*ABI17_0_0YGFree)(void *ptr);

// ABI17_0_0YGNode
WIN_EXPORT ABI17_0_0YGNodeRef ABI17_0_0YGNodeNew(void);
WIN_EXPORT ABI17_0_0YGNodeRef ABI17_0_0YGNodeNewWithConfig(const ABI17_0_0YGConfigRef config);
WIN_EXPORT void ABI17_0_0YGNodeFree(const ABI17_0_0YGNodeRef node);
WIN_EXPORT void ABI17_0_0YGNodeFreeRecursive(const ABI17_0_0YGNodeRef node);
WIN_EXPORT void ABI17_0_0YGNodeReset(const ABI17_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI17_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI17_0_0YGNodeInsertChild(const ABI17_0_0YGNodeRef node,
                                  const ABI17_0_0YGNodeRef child,
                                  const uint32_t index);
WIN_EXPORT void ABI17_0_0YGNodeRemoveChild(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGNodeRef child);
WIN_EXPORT ABI17_0_0YGNodeRef ABI17_0_0YGNodeGetChild(const ABI17_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT ABI17_0_0YGNodeRef ABI17_0_0YGNodeGetParent(const ABI17_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI17_0_0YGNodeGetChildCount(const ABI17_0_0YGNodeRef node);

WIN_EXPORT void ABI17_0_0YGNodeCalculateLayout(const ABI17_0_0YGNodeRef node,
                                      const float availableWidth,
                                      const float availableHeight,
                                      const ABI17_0_0YGDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI17_0_0YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI17_0_0YG they must perform this dirty
// marking manually.
WIN_EXPORT void ABI17_0_0YGNodeMarkDirty(const ABI17_0_0YGNodeRef node);
WIN_EXPORT bool ABI17_0_0YGNodeIsDirty(const ABI17_0_0YGNodeRef node);

WIN_EXPORT void ABI17_0_0YGNodePrint(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGPrintOptions options);

WIN_EXPORT bool ABI17_0_0YGFloatIsUndefined(const float value);

WIN_EXPORT bool ABI17_0_0YGNodeCanUseCachedMeasurement(const ABI17_0_0YGMeasureMode widthMode,
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
                                              const float marginColumn);

WIN_EXPORT void ABI17_0_0YGNodeCopyStyle(const ABI17_0_0YGNodeRef dstNode, const ABI17_0_0YGNodeRef srcNode);

#define ABI17_0_0YG_NODE_PROPERTY(type, name, paramName)                          \
  WIN_EXPORT void ABI17_0_0YGNodeSet##name(const ABI17_0_0YGNodeRef node, type paramName); \
  WIN_EXPORT type ABI17_0_0YGNodeGet##name(const ABI17_0_0YGNodeRef node);

#define ABI17_0_0YG_NODE_STYLE_PROPERTY(type, name, paramName)                               \
  WIN_EXPORT void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node, const type paramName); \
  WIN_EXPORT type ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node);

#define ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)                                    \
  WIN_EXPORT void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node, const float paramName);          \
  WIN_EXPORT void ABI17_0_0YGNodeStyleSet##name##Percent(const ABI17_0_0YGNodeRef node, const float paramName); \
  WIN_EXPORT type ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node);

#define ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(type, name, paramName) \
  ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)            \
  WIN_EXPORT void ABI17_0_0YGNodeStyleSet##name##Auto(const ABI17_0_0YGNodeRef node);

#define ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node,  \
                                       const ABI17_0_0YGEdge edge,     \
                                       const type paramName); \
  WIN_EXPORT type ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge);

#define ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(type, name, paramName)         \
  WIN_EXPORT void ABI17_0_0YGNodeStyleSet##name(const ABI17_0_0YGNodeRef node,            \
                                       const ABI17_0_0YGEdge edge,               \
                                       const float paramName);          \
  WIN_EXPORT void ABI17_0_0YGNodeStyleSet##name##Percent(const ABI17_0_0YGNodeRef node,   \
                                                const ABI17_0_0YGEdge edge,      \
                                                const float paramName); \
  WIN_EXPORT WIN_STRUCT(type) ABI17_0_0YGNodeStyleGet##name(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge);

#define ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(type, name) \
  WIN_EXPORT void ABI17_0_0YGNodeStyleSet##name##Auto(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge);

#define ABI17_0_0YG_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type ABI17_0_0YGNodeLayoutGet##name(const ABI17_0_0YGNodeRef node);

#define ABI17_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(type, name) \
  WIN_EXPORT type ABI17_0_0YGNodeLayoutGet##name(const ABI17_0_0YGNodeRef node, const ABI17_0_0YGEdge edge);

ABI17_0_0YG_NODE_PROPERTY(void *, Context, context);
ABI17_0_0YG_NODE_PROPERTY(ABI17_0_0YGMeasureFunc, MeasureFunc, measureFunc);
ABI17_0_0YG_NODE_PROPERTY(ABI17_0_0YGBaselineFunc, BaselineFunc, baselineFunc)
ABI17_0_0YG_NODE_PROPERTY(ABI17_0_0YGPrintFunc, PrintFunc, printFunc);
ABI17_0_0YG_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);

ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGDirection, Direction, direction);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGFlexDirection, FlexDirection, flexDirection);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGJustify, JustifyContent, justifyContent);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGAlign, AlignContent, alignContent);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGAlign, AlignItems, alignItems);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGAlign, AlignSelf, alignSelf);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGPositionType, PositionType, positionType);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGWrap, FlexWrap, flexWrap);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGOverflow, Overflow, overflow);
ABI17_0_0YG_NODE_STYLE_PROPERTY(ABI17_0_0YGDisplay, Display, display);

ABI17_0_0YG_NODE_STYLE_PROPERTY(float, Flex, flex);
ABI17_0_0YG_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI17_0_0YG_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI17_0_0YGValue, FlexBasis, flexBasis);

ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI17_0_0YGValue, Position, position);
ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI17_0_0YGValue, Margin, margin);
ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(ABI17_0_0YGValue, Margin);
ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI17_0_0YGValue, Padding, padding);
ABI17_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI17_0_0YGValue, Width, width);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI17_0_0YGValue, Height, height);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI17_0_0YGValue, MinWidth, minWidth);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI17_0_0YGValue, MinHeight, minHeight);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI17_0_0YGValue, MaxWidth, maxWidth);
ABI17_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI17_0_0YGValue, MaxHeight, maxHeight);

// Yoga specific properties, not compatible with flexbox specification
// Aspect ratio control the size of the undefined dimension of a node.
// Aspect ratio is encoded as a floating point value width/height. e.g. A value of 2 leads to a node
// with a width twice the size of its height while a value of 0.5 gives the opposite effect.
//
// - On a node with a set width/height aspect ratio control the size of the unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node in the cross axis if
// unset
// - On a node with a measure function aspect ratio works as though the measure function measures
// the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node in the cross axis if
// unset
// - Aspect ratio takes min/max dimensions into account
ABI17_0_0YG_NODE_STYLE_PROPERTY(float, AspectRatio, aspectRatio);

ABI17_0_0YG_NODE_LAYOUT_PROPERTY(float, Left);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY(float, Top);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY(float, Right);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY(float, Width);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY(float, Height);
ABI17_0_0YG_NODE_LAYOUT_PROPERTY(ABI17_0_0YGDirection, Direction);

// Get the computed values for these nodes after performing layout. If they were set using
// point values then the returned value will be the same as ABI17_0_0YGNodeStyleGetXXX. However if
// they were set using a percentage value then the returned value is the computed value used
// during layout.
ABI17_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Margin);
ABI17_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Border);
ABI17_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Padding);

WIN_EXPORT void ABI17_0_0YGSetLogger(ABI17_0_0YGLogger logger);
WIN_EXPORT void ABI17_0_0YGLog(ABI17_0_0YGLogLevel level, const char *message, ...);

// Set this to number of pixels in 1 point to round calculation results
// If you want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI17_0_0YGConfigSetPointScaleFactor(const ABI17_0_0YGConfigRef config, const float pixelsInPoint);

// ABI17_0_0YGConfig
WIN_EXPORT ABI17_0_0YGConfigRef ABI17_0_0YGConfigNew(void);
WIN_EXPORT void ABI17_0_0YGConfigFree(const ABI17_0_0YGConfigRef config);

WIN_EXPORT void ABI17_0_0YGConfigSetExperimentalFeatureEnabled(const ABI17_0_0YGConfigRef config,
                                                      const ABI17_0_0YGExperimentalFeature feature,
                                                      const bool enabled);
WIN_EXPORT bool ABI17_0_0YGConfigIsExperimentalFeatureEnabled(const ABI17_0_0YGConfigRef config,
                                                     const ABI17_0_0YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects.
// Usage of non web defaults should be considered as legacy.
WIN_EXPORT void ABI17_0_0YGConfigSetUseWebDefaults(const ABI17_0_0YGConfigRef config, const bool enabled);

WIN_EXPORT bool ABI17_0_0YGConfigGetUseWebDefaults(const ABI17_0_0YGConfigRef config);

WIN_EXPORT void
ABI17_0_0YGSetMemoryFuncs(ABI17_0_0YGMalloc ygmalloc, ABI17_0_0YGCalloc yccalloc, ABI17_0_0YGRealloc ygrealloc, ABI17_0_0YGFree ygfree);

ABI17_0_0YG_EXTERN_C_END
