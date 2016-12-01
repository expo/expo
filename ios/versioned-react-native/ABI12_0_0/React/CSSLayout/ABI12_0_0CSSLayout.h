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

#define ABI12_0_0CSSUndefined NAN

#include "ABI12_0_0CSSMacros.h"

ABI12_0_0CSS_EXTERN_C_BEGIN

typedef enum ABI12_0_0CSSDirection {
  ABI12_0_0CSSDirectionInherit,
  ABI12_0_0CSSDirectionLTR,
  ABI12_0_0CSSDirectionRTL,
} ABI12_0_0CSSDirection;

typedef enum ABI12_0_0CSSFlexDirection {
  ABI12_0_0CSSFlexDirectionColumn,
  ABI12_0_0CSSFlexDirectionColumnReverse,
  ABI12_0_0CSSFlexDirectionRow,
  ABI12_0_0CSSFlexDirectionRowReverse,
} ABI12_0_0CSSFlexDirection;

typedef enum ABI12_0_0CSSJustify {
  ABI12_0_0CSSJustifyFlexStart,
  ABI12_0_0CSSJustifyCenter,
  ABI12_0_0CSSJustifyFlexEnd,
  ABI12_0_0CSSJustifySpaceBetween,
  ABI12_0_0CSSJustifySpaceAround,
} ABI12_0_0CSSJustify;

typedef enum ABI12_0_0CSSOverflow {
  ABI12_0_0CSSOverflowVisible,
  ABI12_0_0CSSOverflowHidden,
  ABI12_0_0CSSOverflowScroll,
} ABI12_0_0CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum ABI12_0_0CSSAlign {
  ABI12_0_0CSSAlignAuto,
  ABI12_0_0CSSAlignFlexStart,
  ABI12_0_0CSSAlignCenter,
  ABI12_0_0CSSAlignFlexEnd,
  ABI12_0_0CSSAlignStretch,
} ABI12_0_0CSSAlign;

typedef enum ABI12_0_0CSSPositionType {
  ABI12_0_0CSSPositionTypeRelative,
  ABI12_0_0CSSPositionTypeAbsolute,
} ABI12_0_0CSSPositionType;

typedef enum ABI12_0_0CSSWrapType {
  ABI12_0_0CSSWrapTypeNoWrap,
  ABI12_0_0CSSWrapTypeWrap,
} ABI12_0_0CSSWrapType;

typedef enum ABI12_0_0CSSMeasureMode {
  ABI12_0_0CSSMeasureModeUndefined,
  ABI12_0_0CSSMeasureModeExactly,
  ABI12_0_0CSSMeasureModeAtMost,
  ABI12_0_0CSSMeasureModeCount,
} ABI12_0_0CSSMeasureMode;

typedef enum ABI12_0_0CSSDimension {
  ABI12_0_0CSSDimensionWidth,
  ABI12_0_0CSSDimensionHeight,
} ABI12_0_0CSSDimension;

typedef enum ABI12_0_0CSSEdge {
  ABI12_0_0CSSEdgeLeft,
  ABI12_0_0CSSEdgeTop,
  ABI12_0_0CSSEdgeRight,
  ABI12_0_0CSSEdgeBottom,
  ABI12_0_0CSSEdgeStart,
  ABI12_0_0CSSEdgeEnd,
  ABI12_0_0CSSEdgeHorizontal,
  ABI12_0_0CSSEdgeVertical,
  ABI12_0_0CSSEdgeAll,
  ABI12_0_0CSSEdgeCount,
} ABI12_0_0CSSEdge;

typedef enum ABI12_0_0CSSPrintOptions {
  ABI12_0_0CSSPrintOptionsLayout = 1,
  ABI12_0_0CSSPrintOptionsStyle = 2,
  ABI12_0_0CSSPrintOptionsChildren = 4,
} ABI12_0_0CSSPrintOptions;

typedef struct ABI12_0_0CSSSize {
  float width;
  float height;
} ABI12_0_0CSSSize;

typedef struct ABI12_0_0CSSNode *ABI12_0_0CSSNodeRef;
typedef ABI12_0_0CSSSize (*ABI12_0_0CSSMeasureFunc)(void *context,
                                  float width,
                                  ABI12_0_0CSSMeasureMode widthMode,
                                  float height,
                                  ABI12_0_0CSSMeasureMode heightMode);
typedef void (*ABI12_0_0CSSPrintFunc)(void *context);
typedef int (*ABI12_0_0CSSLogger)(const char *format, ...);

#ifdef ABI12_0_0CSS_ASSERT_FAIL_ENABLED
typedef void (*ABI12_0_0CSSAssertFailFunc)(const char *message);
#endif

// ABI12_0_0CSSNode
WIN_EXPORT ABI12_0_0CSSNodeRef ABI12_0_0CSSNodeNew(void);
WIN_EXPORT void ABI12_0_0CSSNodeInit(const ABI12_0_0CSSNodeRef node);
WIN_EXPORT void ABI12_0_0CSSNodeFree(const ABI12_0_0CSSNodeRef node);
WIN_EXPORT void ABI12_0_0CSSNodeFreeRecursive(const ABI12_0_0CSSNodeRef node);
WIN_EXPORT void ABI12_0_0CSSNodeReset(const ABI12_0_0CSSNodeRef node);
WIN_EXPORT int32_t ABI12_0_0CSSNodeGetInstanceCount(void);

WIN_EXPORT void ABI12_0_0CSSNodeInsertChild(const ABI12_0_0CSSNodeRef node,
                                   const ABI12_0_0CSSNodeRef child,
                                   const uint32_t index);
WIN_EXPORT void ABI12_0_0CSSNodeRemoveChild(const ABI12_0_0CSSNodeRef node, const ABI12_0_0CSSNodeRef child);
WIN_EXPORT ABI12_0_0CSSNodeRef ABI12_0_0CSSNodeGetChild(const ABI12_0_0CSSNodeRef node, const uint32_t index);
WIN_EXPORT uint32_t ABI12_0_0CSSNodeChildCount(const ABI12_0_0CSSNodeRef node);

WIN_EXPORT void ABI12_0_0CSSNodeCalculateLayout(const ABI12_0_0CSSNodeRef node,
                                       const float availableWidth,
                                       const float availableHeight,
                                       const ABI12_0_0CSSDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI12_0_0CSSLayout knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI12_0_0CSSLayout they must perform this dirty
// marking manually.
WIN_EXPORT void ABI12_0_0CSSNodeMarkDirty(const ABI12_0_0CSSNodeRef node);
WIN_EXPORT bool ABI12_0_0CSSNodeIsDirty(const ABI12_0_0CSSNodeRef node);

WIN_EXPORT void ABI12_0_0CSSNodePrint(const ABI12_0_0CSSNodeRef node, const ABI12_0_0CSSPrintOptions options);

WIN_EXPORT bool ABI12_0_0CSSValueIsUndefined(const float value);

#define ABI12_0_0CSS_NODE_PROPERTY(type, name, paramName)                           \
  WIN_EXPORT void ABI12_0_0CSSNodeSet##name(const ABI12_0_0CSSNodeRef node, type paramName); \
  WIN_EXPORT type ABI12_0_0CSSNodeGet##name(const ABI12_0_0CSSNodeRef node);

#define ABI12_0_0CSS_NODE_STYLE_PROPERTY(type, name, paramName)                                \
  WIN_EXPORT void ABI12_0_0CSSNodeStyleSet##name(const ABI12_0_0CSSNodeRef node, const type paramName); \
  WIN_EXPORT type ABI12_0_0CSSNodeStyleGet##name(const ABI12_0_0CSSNodeRef node);

#define ABI12_0_0CSS_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void ABI12_0_0CSSNodeStyleSet##name(const ABI12_0_0CSSNodeRef node, \
                                        const ABI12_0_0CSSEdge edge,    \
                                        const type paramName); \
  WIN_EXPORT type ABI12_0_0CSSNodeStyleGet##name(const ABI12_0_0CSSNodeRef node, const ABI12_0_0CSSEdge edge);

#define ABI12_0_0CSS_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type ABI12_0_0CSSNodeLayoutGet##name(const ABI12_0_0CSSNodeRef node);

ABI12_0_0CSS_NODE_PROPERTY(void *, Context, context);
ABI12_0_0CSS_NODE_PROPERTY(ABI12_0_0CSSMeasureFunc, MeasureFunc, measureFunc);
ABI12_0_0CSS_NODE_PROPERTY(ABI12_0_0CSSPrintFunc, PrintFunc, printFunc);
ABI12_0_0CSS_NODE_PROPERTY(bool, IsTextnode, isTextNode);
ABI12_0_0CSS_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);

ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSDirection, Direction, direction);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSFlexDirection, FlexDirection, flexDirection);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSJustify, JustifyContent, justifyContent);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSAlign, AlignContent, alignContent);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSAlign, AlignItems, alignItems);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSAlign, AlignSelf, alignSelf);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSPositionType, PositionType, positionType);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSWrapType, FlexWrap, flexWrap);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(ABI12_0_0CSSOverflow, Overflow, overflow);

WIN_EXPORT void ABI12_0_0CSSNodeStyleSetFlex(const ABI12_0_0CSSNodeRef node, const float flex);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, FlexBasis, flexBasis);

ABI12_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Position, position);
ABI12_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Margin, margin);
ABI12_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Padding, padding);
ABI12_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, Width, width);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, Height, height);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
ABI12_0_0CSS_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

ABI12_0_0CSS_NODE_LAYOUT_PROPERTY(float, Left);
ABI12_0_0CSS_NODE_LAYOUT_PROPERTY(float, Top);
ABI12_0_0CSS_NODE_LAYOUT_PROPERTY(float, Right);
ABI12_0_0CSS_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI12_0_0CSS_NODE_LAYOUT_PROPERTY(float, Width);
ABI12_0_0CSS_NODE_LAYOUT_PROPERTY(float, Height);
ABI12_0_0CSS_NODE_LAYOUT_PROPERTY(ABI12_0_0CSSDirection, Direction);

WIN_EXPORT void ABI12_0_0CSSLayoutSetLogger(ABI12_0_0CSSLogger logger);

#ifdef ABI12_0_0CSS_ASSERT_FAIL_ENABLED
// Assert
WIN_EXPORT void ABI12_0_0CSSAssertSetFailFunc(ABI12_0_0CSSAssertFailFunc func);
WIN_EXPORT void ABI12_0_0CSSAssertFail(const char *message);
#endif

ABI12_0_0CSS_EXTERN_C_END
