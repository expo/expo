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

#define ABI15_0_0YGUndefined NAN

#include "ABI15_0_0YGEnums.h"
#include "ABI15_0_0YGMacros.h"

ABI15_0_0YG_EXTERN_C_BEGIN

typedef struct ABI15_0_0YGSize {
  float width;
  float height;
} ABI15_0_0YGSize;

typedef struct ABI15_0_0YGValue {
  float value;
  ABI15_0_0YGUnit unit;
} ABI15_0_0YGValue;

static const ABI15_0_0YGValue ABI15_0_0YGValueUndefined = {ABI15_0_0YGUndefined, ABI15_0_0YGUnitUndefined};

typedef struct ABI15_0_0YGNode *ABI15_0_0YGNodeRef;
typedef ABI15_0_0YGSize (*ABI15_0_0YGMeasureFunc)(ABI15_0_0YGNodeRef node,
                                float width,
                                ABI15_0_0YGMeasureMode widthMode,
                                float height,
                                ABI15_0_0YGMeasureMode heightMode);
typedef float (*ABI15_0_0YGBaselineFunc)(ABI15_0_0YGNodeRef node, const float width, const float height);
typedef void (*ABI15_0_0YGPrintFunc)(ABI15_0_0YGNodeRef node);
typedef int (*ABI15_0_0YGLogger)(ABI15_0_0YGLogLevel level, const char *format, va_list args);

typedef void *(*ABI15_0_0YGMalloc)(size_t size);
typedef void *(*ABI15_0_0YGCalloc)(size_t count, size_t size);
typedef void *(*ABI15_0_0YGRealloc)(void *ptr, size_t size);
typedef void (*ABI15_0_0YGFree)(void *ptr);

// ABI15_0_0YGNode
WIN_EXPORT ABI15_0_0YGNodeRef ABI15_0_0YGNodeNew(void);
WIN_EXPORT void ABI15_0_0YGNodeFree(const ABI15_0_0YGNodeRef node);
WIN_EXPORT void ABI15_0_0YGNodeFreeRecursive(const ABI15_0_0YGNodeRef node);
WIN_EXPORT void ABI15_0_0YGNodeReset(const ABI15_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI15_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI15_0_0YGNodeInsertChild(const ABI15_0_0YGNodeRef node,
                                  const ABI15_0_0YGNodeRef child,
                                  const uint32_t index);
WIN_EXPORT void ABI15_0_0YGNodeRemoveChild(const ABI15_0_0YGNodeRef node, const ABI15_0_0YGNodeRef child);
WIN_EXPORT ABI15_0_0YGNodeRef ABI15_0_0YGNodeGetChild(const ABI15_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT ABI15_0_0YGNodeRef ABI15_0_0YGNodeGetParent(const ABI15_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI15_0_0YGNodeGetChildCount(const ABI15_0_0YGNodeRef node);

WIN_EXPORT void ABI15_0_0YGNodeCalculateLayout(const ABI15_0_0YGNodeRef node,
                                      const float availableWidth,
                                      const float availableHeight,
                                      const ABI15_0_0YGDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI15_0_0YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI15_0_0YG they must perform this dirty
// marking manually.
WIN_EXPORT void ABI15_0_0YGNodeMarkDirty(const ABI15_0_0YGNodeRef node);
WIN_EXPORT bool ABI15_0_0YGNodeIsDirty(const ABI15_0_0YGNodeRef node);

WIN_EXPORT void ABI15_0_0YGNodePrint(const ABI15_0_0YGNodeRef node, const ABI15_0_0YGPrintOptions options);

WIN_EXPORT bool ABI15_0_0YGFloatIsUndefined(const float value);

WIN_EXPORT bool ABI15_0_0YGNodeCanUseCachedMeasurement(const ABI15_0_0YGMeasureMode widthMode,
                                              const float width,
                                              const ABI15_0_0YGMeasureMode heightMode,
                                              const float height,
                                              const ABI15_0_0YGMeasureMode lastWidthMode,
                                              const float lastWidth,
                                              const ABI15_0_0YGMeasureMode lastHeightMode,
                                              const float lastHeight,
                                              const float lastComputedWidth,
                                              const float lastComputedHeight,
                                              const float marginRow,
                                              const float marginColumn);

WIN_EXPORT void ABI15_0_0YGNodeCopyStyle(const ABI15_0_0YGNodeRef dstNode, const ABI15_0_0YGNodeRef srcNode);

#define ABI15_0_0YG_NODE_PROPERTY(type, name, paramName)                          \
  WIN_EXPORT void ABI15_0_0YGNodeSet##name(const ABI15_0_0YGNodeRef node, type paramName); \
  WIN_EXPORT type ABI15_0_0YGNodeGet##name(const ABI15_0_0YGNodeRef node);

#define ABI15_0_0YG_NODE_STYLE_PROPERTY(type, name, paramName)                               \
  WIN_EXPORT void ABI15_0_0YGNodeStyleSet##name(const ABI15_0_0YGNodeRef node, const type paramName); \
  WIN_EXPORT type ABI15_0_0YGNodeStyleGet##name(const ABI15_0_0YGNodeRef node);

#define ABI15_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)                                    \
  WIN_EXPORT void ABI15_0_0YGNodeStyleSet##name(const ABI15_0_0YGNodeRef node, const float paramName);          \
  WIN_EXPORT void ABI15_0_0YGNodeStyleSet##name##Percent(const ABI15_0_0YGNodeRef node, const float paramName); \
  WIN_EXPORT type ABI15_0_0YGNodeStyleGet##name(const ABI15_0_0YGNodeRef node);

#define ABI15_0_0YG_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void ABI15_0_0YGNodeStyleSet##name(const ABI15_0_0YGNodeRef node,  \
                                       const ABI15_0_0YGEdge edge,     \
                                       const type paramName); \
  WIN_EXPORT type ABI15_0_0YGNodeStyleGet##name(const ABI15_0_0YGNodeRef node, const ABI15_0_0YGEdge edge);

#define ABI15_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(type, name, paramName)         \
  WIN_EXPORT void ABI15_0_0YGNodeStyleSet##name(const ABI15_0_0YGNodeRef node,            \
                                       const ABI15_0_0YGEdge edge,               \
                                       const float paramName);          \
  WIN_EXPORT void ABI15_0_0YGNodeStyleSet##name##Percent(const ABI15_0_0YGNodeRef node,   \
                                                const ABI15_0_0YGEdge edge,      \
                                                const float paramName); \
  WIN_EXPORT type ABI15_0_0YGNodeStyleGet##name(const ABI15_0_0YGNodeRef node, const ABI15_0_0YGEdge edge);

#define ABI15_0_0YG_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type ABI15_0_0YGNodeLayoutGet##name(const ABI15_0_0YGNodeRef node);

#define ABI15_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(type, name) \
  WIN_EXPORT type ABI15_0_0YGNodeLayoutGet##name(const ABI15_0_0YGNodeRef node, const ABI15_0_0YGEdge edge);

ABI15_0_0YG_NODE_PROPERTY(void *, Context, context);
ABI15_0_0YG_NODE_PROPERTY(ABI15_0_0YGMeasureFunc, MeasureFunc, measureFunc);
ABI15_0_0YG_NODE_PROPERTY(ABI15_0_0YGBaselineFunc, BaselineFunc, baselineFunc)
ABI15_0_0YG_NODE_PROPERTY(ABI15_0_0YGPrintFunc, PrintFunc, printFunc);
ABI15_0_0YG_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);

ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGDirection, Direction, direction);
ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGFlexDirection, FlexDirection, flexDirection);
ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGJustify, JustifyContent, justifyContent);
ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGAlign, AlignContent, alignContent);
ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGAlign, AlignItems, alignItems);
ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGAlign, AlignSelf, alignSelf);
ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGPositionType, PositionType, positionType);
ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGWrap, FlexWrap, flexWrap);
ABI15_0_0YG_NODE_STYLE_PROPERTY(ABI15_0_0YGOverflow, Overflow, overflow);

WIN_EXPORT void ABI15_0_0YGNodeStyleSetFlex(const ABI15_0_0YGNodeRef node, const float flex);
ABI15_0_0YG_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI15_0_0YG_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI15_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI15_0_0YGValue, FlexBasis, flexBasis);

ABI15_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI15_0_0YGValue, Position, position);
ABI15_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI15_0_0YGValue, Margin, margin);
ABI15_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI15_0_0YGValue, Padding, padding);
ABI15_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI15_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI15_0_0YGValue, Width, width);
ABI15_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI15_0_0YGValue, Height, height);
ABI15_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI15_0_0YGValue, MinWidth, minWidth);
ABI15_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI15_0_0YGValue, MinHeight, minHeight);
ABI15_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI15_0_0YGValue, MaxWidth, maxWidth);
ABI15_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI15_0_0YGValue, MaxHeight, maxHeight);

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
ABI15_0_0YG_NODE_STYLE_PROPERTY(float, AspectRatio, aspectRatio);

ABI15_0_0YG_NODE_LAYOUT_PROPERTY(float, Left);
ABI15_0_0YG_NODE_LAYOUT_PROPERTY(float, Top);
ABI15_0_0YG_NODE_LAYOUT_PROPERTY(float, Right);
ABI15_0_0YG_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI15_0_0YG_NODE_LAYOUT_PROPERTY(float, Width);
ABI15_0_0YG_NODE_LAYOUT_PROPERTY(float, Height);
ABI15_0_0YG_NODE_LAYOUT_PROPERTY(ABI15_0_0YGDirection, Direction);

// Get the computed values for these nodes after performing layout. If they were set using
// pixel values then the returned value will be the same as ABI15_0_0YGNodeStyleGetXXX. However if
// they were set using a percentage value then the returned value is the computed value used
// during layout.
ABI15_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Margin);
ABI15_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Border);
ABI15_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Padding);

WIN_EXPORT void ABI15_0_0YGSetLogger(ABI15_0_0YGLogger logger);
WIN_EXPORT void ABI15_0_0YGLog(ABI15_0_0YGLogLevel level, const char *message, ...);

WIN_EXPORT void ABI15_0_0YGSetExperimentalFeatureEnabled(ABI15_0_0YGExperimentalFeature feature, bool enabled);
WIN_EXPORT bool ABI15_0_0YGIsExperimentalFeatureEnabled(ABI15_0_0YGExperimentalFeature feature);

WIN_EXPORT void
ABI15_0_0YGSetMemoryFuncs(ABI15_0_0YGMalloc ygmalloc, ABI15_0_0YGCalloc yccalloc, ABI15_0_0YGRealloc ygrealloc, ABI15_0_0YGFree ygfree);

ABI15_0_0YG_EXTERN_C_END
