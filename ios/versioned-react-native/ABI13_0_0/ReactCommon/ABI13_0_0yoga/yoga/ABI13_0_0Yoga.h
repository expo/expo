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

#define ABI13_0_0YGUndefined NAN

#include "ABI13_0_0YGEnums.h"
#include "ABI13_0_0YGMacros.h"

ABI13_0_0YG_EXTERN_C_BEGIN

typedef struct ABI13_0_0YGSize {
  float width;
  float height;
} ABI13_0_0YGSize;

typedef struct ABI13_0_0YGNode *ABI13_0_0YGNodeRef;
typedef ABI13_0_0YGSize (*ABI13_0_0YGMeasureFunc)(ABI13_0_0YGNodeRef node,
                                float width,
                                ABI13_0_0YGMeasureMode widthMode,
                                float height,
                                ABI13_0_0YGMeasureMode heightMode);
typedef void (*ABI13_0_0YGPrintFunc)(ABI13_0_0YGNodeRef node);
typedef int (*ABI13_0_0YGLogger)(ABI13_0_0YGLogLevel level, const char *format, va_list args);

typedef void *(*ABI13_0_0YGMalloc)(size_t size);
typedef void *(*ABI13_0_0YGCalloc)(size_t count, size_t size);
typedef void *(*ABI13_0_0YGRealloc)(void *ptr, size_t size);
typedef void (*ABI13_0_0YGFree)(void *ptr);

// ABI13_0_0YGNode
WIN_EXPORT ABI13_0_0YGNodeRef ABI13_0_0YGNodeNew(void);
WIN_EXPORT void ABI13_0_0YGNodeFree(const ABI13_0_0YGNodeRef node);
WIN_EXPORT void ABI13_0_0YGNodeFreeRecursive(const ABI13_0_0YGNodeRef node);
WIN_EXPORT void ABI13_0_0YGNodeReset(const ABI13_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI13_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI13_0_0YGNodeInsertChild(const ABI13_0_0YGNodeRef node,
                                  const ABI13_0_0YGNodeRef child,
                                  const uint32_t index);
WIN_EXPORT void ABI13_0_0YGNodeRemoveChild(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGNodeRef child);
WIN_EXPORT ABI13_0_0YGNodeRef ABI13_0_0YGNodeGetChild(const ABI13_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT uint32_t ABI13_0_0YGNodeChildCount(const ABI13_0_0YGNodeRef node);

WIN_EXPORT void ABI13_0_0YGNodeCalculateLayout(const ABI13_0_0YGNodeRef node,
                                      const float availableWidth,
                                      const float availableHeight,
                                      const ABI13_0_0YGDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI13_0_0YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI13_0_0YG they must perform this dirty
// marking manually.
WIN_EXPORT void ABI13_0_0YGNodeMarkDirty(const ABI13_0_0YGNodeRef node);
WIN_EXPORT bool ABI13_0_0YGNodeIsDirty(const ABI13_0_0YGNodeRef node);

WIN_EXPORT void ABI13_0_0YGNodePrint(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGPrintOptions options);

WIN_EXPORT bool ABI13_0_0YGValueIsUndefined(const float value);

WIN_EXPORT bool ABI13_0_0YGNodeCanUseCachedMeasurement(const ABI13_0_0YGMeasureMode widthMode,
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
                                              const float marginColumn);

WIN_EXPORT void ABI13_0_0YGNodeCopyStyle(const ABI13_0_0YGNodeRef dstNode, const ABI13_0_0YGNodeRef srcNode);

#define ABI13_0_0YG_NODE_PROPERTY(type, name, paramName)                          \
  WIN_EXPORT void ABI13_0_0YGNodeSet##name(const ABI13_0_0YGNodeRef node, type paramName); \
  WIN_EXPORT type ABI13_0_0YGNodeGet##name(const ABI13_0_0YGNodeRef node);

#define ABI13_0_0YG_NODE_STYLE_PROPERTY(type, name, paramName)                               \
  WIN_EXPORT void ABI13_0_0YGNodeStyleSet##name(const ABI13_0_0YGNodeRef node, const type paramName); \
  WIN_EXPORT type ABI13_0_0YGNodeStyleGet##name(const ABI13_0_0YGNodeRef node);

#define ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void ABI13_0_0YGNodeStyleSet##name(const ABI13_0_0YGNodeRef node,  \
                                       const ABI13_0_0YGEdge edge,     \
                                       const type paramName); \
  WIN_EXPORT type ABI13_0_0YGNodeStyleGet##name(const ABI13_0_0YGNodeRef node, const ABI13_0_0YGEdge edge);

#define ABI13_0_0YG_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type ABI13_0_0YGNodeLayoutGet##name(const ABI13_0_0YGNodeRef node);

ABI13_0_0YG_NODE_PROPERTY(void *, Context, context);
ABI13_0_0YG_NODE_PROPERTY(ABI13_0_0YGMeasureFunc, MeasureFunc, measureFunc);
ABI13_0_0YG_NODE_PROPERTY(ABI13_0_0YGPrintFunc, PrintFunc, printFunc);
ABI13_0_0YG_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);

ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGDirection, Direction, direction);
ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGFlexDirection, FlexDirection, flexDirection);
ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGJustify, JustifyContent, justifyContent);
ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGAlign, AlignContent, alignContent);
ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGAlign, AlignItems, alignItems);
ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGAlign, AlignSelf, alignSelf);
ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGPositionType, PositionType, positionType);
ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGWrap, FlexWrap, flexWrap);
ABI13_0_0YG_NODE_STYLE_PROPERTY(ABI13_0_0YGOverflow, Overflow, overflow);

WIN_EXPORT void ABI13_0_0YGNodeStyleSetFlex(const ABI13_0_0YGNodeRef node, const float flex);
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, FlexBasis, flexBasis);

ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Position, position);
ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Margin, margin);
ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Padding, padding);
ABI13_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI13_0_0YG_NODE_STYLE_PROPERTY(float, Width, width);
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, Height, height);
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

// Yoga specific properties, not compatible with flexbox specification
// Aspect ratio control the size of the undefined dimension of a node.
// - On a node with a set width/height aspect ratio control the size of the unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node in the cross axis if
// unset
// - On a node with a measure function aspect ratio works as though the measure function measures
// the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node in the cross axis if
// unset
// - Aspect ratio takes min/max dimensions into account
ABI13_0_0YG_NODE_STYLE_PROPERTY(float, AspectRatio, aspectRatio);

ABI13_0_0YG_NODE_LAYOUT_PROPERTY(float, Left);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY(float, Top);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY(float, Right);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY(float, Width);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY(float, Height);
ABI13_0_0YG_NODE_LAYOUT_PROPERTY(ABI13_0_0YGDirection, Direction);

WIN_EXPORT void ABI13_0_0YGSetLogger(ABI13_0_0YGLogger logger);
WIN_EXPORT void ABI13_0_0YGLog(ABI13_0_0YGLogLevel level, const char *message, ...);

WIN_EXPORT void ABI13_0_0YGSetExperimentalFeatureEnabled(ABI13_0_0YGExperimentalFeature feature, bool enabled);
WIN_EXPORT bool ABI13_0_0YGIsExperimentalFeatureEnabled(ABI13_0_0YGExperimentalFeature feature);

WIN_EXPORT void
ABI13_0_0YGSetMemoryFuncs(ABI13_0_0YGMalloc ygmalloc, ABI13_0_0YGCalloc yccalloc, ABI13_0_0YGRealloc ygrealloc, ABI13_0_0YGFree ygfree);

ABI13_0_0YG_EXTERN_C_END
