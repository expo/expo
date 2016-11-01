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

#define ABI11_0_0CSSUndefined NAN

#include "ABI11_0_0CSSMacros.h"

ABI11_0_0CSS_EXTERN_C_BEGIN

typedef enum ABI11_0_0CSSDirection {
  ABI11_0_0CSSDirectionInherit,
  ABI11_0_0CSSDirectionLTR,
  ABI11_0_0CSSDirectionRTL,
} ABI11_0_0CSSDirection;

typedef enum ABI11_0_0CSSFlexDirection {
  ABI11_0_0CSSFlexDirectionColumn,
  ABI11_0_0CSSFlexDirectionColumnReverse,
  ABI11_0_0CSSFlexDirectionRow,
  ABI11_0_0CSSFlexDirectionRowReverse,
} ABI11_0_0CSSFlexDirection;

typedef enum ABI11_0_0CSSJustify {
  ABI11_0_0CSSJustifyFlexStart,
  ABI11_0_0CSSJustifyCenter,
  ABI11_0_0CSSJustifyFlexEnd,
  ABI11_0_0CSSJustifySpaceBetween,
  ABI11_0_0CSSJustifySpaceAround,
} ABI11_0_0CSSJustify;

typedef enum ABI11_0_0CSSOverflow {
  ABI11_0_0CSSOverflowVisible,
  ABI11_0_0CSSOverflowHidden,
  ABI11_0_0CSSOverflowScroll,
} ABI11_0_0CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum ABI11_0_0CSSAlign {
  ABI11_0_0CSSAlignAuto,
  ABI11_0_0CSSAlignFlexStart,
  ABI11_0_0CSSAlignCenter,
  ABI11_0_0CSSAlignFlexEnd,
  ABI11_0_0CSSAlignStretch,
} ABI11_0_0CSSAlign;

typedef enum ABI11_0_0CSSPositionType {
  ABI11_0_0CSSPositionTypeRelative,
  ABI11_0_0CSSPositionTypeAbsolute,
} ABI11_0_0CSSPositionType;

typedef enum ABI11_0_0CSSWrapType {
  ABI11_0_0CSSWrapTypeNoWrap,
  ABI11_0_0CSSWrapTypeWrap,
} ABI11_0_0CSSWrapType;

typedef enum ABI11_0_0CSSMeasureMode {
  ABI11_0_0CSSMeasureModeUndefined,
  ABI11_0_0CSSMeasureModeExactly,
  ABI11_0_0CSSMeasureModeAtMost,
  ABI11_0_0CSSMeasureModeCount,
} ABI11_0_0CSSMeasureMode;

typedef enum ABI11_0_0CSSDimension {
  ABI11_0_0CSSDimensionWidth,
  ABI11_0_0CSSDimensionHeight,
} ABI11_0_0CSSDimension;

typedef enum ABI11_0_0CSSEdge {
  ABI11_0_0CSSEdgeLeft,
  ABI11_0_0CSSEdgeTop,
  ABI11_0_0CSSEdgeRight,
  ABI11_0_0CSSEdgeBottom,
  ABI11_0_0CSSEdgeStart,
  ABI11_0_0CSSEdgeEnd,
  ABI11_0_0CSSEdgeHorizontal,
  ABI11_0_0CSSEdgeVertical,
  ABI11_0_0CSSEdgeAll,
  ABI11_0_0CSSEdgeCount,
} ABI11_0_0CSSEdge;

typedef enum ABI11_0_0CSSPrintOptions {
  ABI11_0_0CSSPrintOptionsLayout = 1,
  ABI11_0_0CSSPrintOptionsStyle = 2,
  ABI11_0_0CSSPrintOptionsChildren = 4,
} ABI11_0_0CSSPrintOptions;

typedef struct ABI11_0_0CSSSize {
  float width;
  float height;
} ABI11_0_0CSSSize;

typedef struct ABI11_0_0CSSNode *ABI11_0_0CSSNodeRef;
typedef ABI11_0_0CSSSize (*ABI11_0_0CSSMeasureFunc)(void *context,
                                  float width,
                                  ABI11_0_0CSSMeasureMode widthMode,
                                  float height,
                                  ABI11_0_0CSSMeasureMode heightMode);
typedef void (*ABI11_0_0CSSPrintFunc)(void *context);

#ifdef ABI11_0_0CSS_ASSERT_FAIL_ENABLED
typedef void (*ABI11_0_0CSSAssertFailFunc)(const char *message);
#endif

// ABI11_0_0CSSNode
WIN_EXPORT ABI11_0_0CSSNodeRef ABI11_0_0CSSNodeNew();
WIN_EXPORT void ABI11_0_0CSSNodeInit(const ABI11_0_0CSSNodeRef node);
WIN_EXPORT void ABI11_0_0CSSNodeFree(const ABI11_0_0CSSNodeRef node);
WIN_EXPORT void ABI11_0_0CSSNodeFreeRecursive(const ABI11_0_0CSSNodeRef node);
WIN_EXPORT int32_t ABI11_0_0CSSNodeGetInstanceCount();

WIN_EXPORT void ABI11_0_0CSSNodeInsertChild(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSNodeRef child, const uint32_t index);
WIN_EXPORT void ABI11_0_0CSSNodeRemoveChild(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSNodeRef child);
WIN_EXPORT ABI11_0_0CSSNodeRef ABI11_0_0CSSNodeGetChild(const ABI11_0_0CSSNodeRef node, const uint32_t index);
WIN_EXPORT uint32_t ABI11_0_0CSSNodeChildCount(const ABI11_0_0CSSNodeRef node);

WIN_EXPORT void ABI11_0_0CSSNodeCalculateLayout(const ABI11_0_0CSSNodeRef node,
                            const float availableWidth,
                            const float availableHeight,
                            const ABI11_0_0CSSDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI11_0_0CSSLayout knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI11_0_0CSSLayout they must perform this dirty
// marking manually.
WIN_EXPORT void ABI11_0_0CSSNodeMarkDirty(const ABI11_0_0CSSNodeRef node);
WIN_EXPORT bool ABI11_0_0CSSNodeIsDirty(const ABI11_0_0CSSNodeRef node);

WIN_EXPORT void ABI11_0_0CSSNodePrint(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSPrintOptions options);

WIN_EXPORT bool ABI11_0_0CSSValueIsUndefined(const float value);

#define ABI11_0_0CSS_NODE_PROPERTY(type, name, paramName)                \
  WIN_EXPORT void ABI11_0_0CSSNodeSet##name(const ABI11_0_0CSSNodeRef node, type paramName); \
  WIN_EXPORT type ABI11_0_0CSSNodeGet##name(const ABI11_0_0CSSNodeRef node);

#define ABI11_0_0CSS_NODE_STYLE_PROPERTY(type, name, paramName)                     \
  WIN_EXPORT void ABI11_0_0CSSNodeStyleSet##name(const ABI11_0_0CSSNodeRef node, const type paramName); \
  WIN_EXPORT type ABI11_0_0CSSNodeStyleGet##name(const ABI11_0_0CSSNodeRef node);

#define ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)                                    \
  WIN_EXPORT void ABI11_0_0CSSNodeStyleSet##name(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSEdge edge, const type paramName); \
  WIN_EXPORT type ABI11_0_0CSSNodeStyleGet##name(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSEdge edge);

#define ABI11_0_0CSS_NODE_LAYOUT_PROPERTY(type, name) WIN_EXPORT type ABI11_0_0CSSNodeLayoutGet##name(const ABI11_0_0CSSNodeRef node);

ABI11_0_0CSS_NODE_PROPERTY(void *, Context, context);
ABI11_0_0CSS_NODE_PROPERTY(ABI11_0_0CSSMeasureFunc, MeasureFunc, measureFunc);
ABI11_0_0CSS_NODE_PROPERTY(ABI11_0_0CSSPrintFunc, PrintFunc, printFunc);
ABI11_0_0CSS_NODE_PROPERTY(bool, IsTextnode, isTextNode);
ABI11_0_0CSS_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);

ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSDirection, Direction, direction);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSFlexDirection, FlexDirection, flexDirection);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSJustify, JustifyContent, justifyContent);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSAlign, AlignContent, alignContent);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSAlign, AlignItems, alignItems);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSAlign, AlignSelf, alignSelf);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSPositionType, PositionType, positionType);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSWrapType, FlexWrap, flexWrap);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(ABI11_0_0CSSOverflow, Overflow, overflow);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, Flex, flex);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, FlexBasis, flexBasis);

ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Position, position);
ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Margin, margin);
ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Padding, padding);
ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, Width, width);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, Height, height);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
ABI11_0_0CSS_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

ABI11_0_0CSS_NODE_LAYOUT_PROPERTY(float, Left);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY(float, Top);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY(float, Right);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY(float, Width);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY(float, Height);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY(ABI11_0_0CSSDirection, Direction);

#ifdef ABI11_0_0CSS_ASSERT_FAIL_ENABLED
// Assert
WIN_EXPORT void ABI11_0_0CSSAssertSetFailFunc(ABI11_0_0CSSAssertFailFunc func);
WIN_EXPORT void ABI11_0_0CSSAssertFail(const char *message);
#endif

ABI11_0_0CSS_EXTERN_C_END
