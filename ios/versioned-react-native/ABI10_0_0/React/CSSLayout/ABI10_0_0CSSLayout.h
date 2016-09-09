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

#define ABI10_0_0CSSUndefined NAN

#include <CSSLayout/ABI10_0_0CSSMacros.h>

ABI10_0_0CSS_EXTERN_C_BEGIN

typedef enum ABI10_0_0CSSDirection {
  ABI10_0_0CSSDirectionInherit,
  ABI10_0_0CSSDirectionLTR,
  ABI10_0_0CSSDirectionRTL,
} ABI10_0_0CSSDirection;

typedef enum ABI10_0_0CSSFlexDirection {
  ABI10_0_0CSSFlexDirectionColumn,
  ABI10_0_0CSSFlexDirectionColumnReverse,
  ABI10_0_0CSSFlexDirectionRow,
  ABI10_0_0CSSFlexDirectionRowReverse,
} ABI10_0_0CSSFlexDirection;

typedef enum ABI10_0_0CSSJustify {
  ABI10_0_0CSSJustifyFlexStart,
  ABI10_0_0CSSJustifyCenter,
  ABI10_0_0CSSJustifyFlexEnd,
  ABI10_0_0CSSJustifySpaceBetween,
  ABI10_0_0CSSJustifySpaceAround,
} ABI10_0_0CSSJustify;

typedef enum ABI10_0_0CSSOverflow {
  ABI10_0_0CSSOverflowVisible,
  ABI10_0_0CSSOverflowHidden,
} ABI10_0_0CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum ABI10_0_0CSSAlign {
  ABI10_0_0CSSAlignAuto,
  ABI10_0_0CSSAlignFlexStart,
  ABI10_0_0CSSAlignCenter,
  ABI10_0_0CSSAlignFlexEnd,
  ABI10_0_0CSSAlignStretch,
} ABI10_0_0CSSAlign;

typedef enum ABI10_0_0CSSPositionType {
  ABI10_0_0CSSPositionTypeRelative,
  ABI10_0_0CSSPositionTypeAbsolute,
} ABI10_0_0CSSPositionType;

typedef enum ABI10_0_0CSSWrapType {
  ABI10_0_0CSSWrapTypeNoWrap,
  ABI10_0_0CSSWrapTypeWrap,
} ABI10_0_0CSSWrapType;

typedef enum ABI10_0_0CSSMeasureMode {
  ABI10_0_0CSSMeasureModeUndefined,
  ABI10_0_0CSSMeasureModeExactly,
  ABI10_0_0CSSMeasureModeAtMost,
  ABI10_0_0CSSMeasureModeCount,
} ABI10_0_0CSSMeasureMode;

typedef enum ABI10_0_0CSSDimension {
  ABI10_0_0CSSDimensionWidth,
  ABI10_0_0CSSDimensionHeight,
} ABI10_0_0CSSDimension;

typedef enum ABI10_0_0CSSEdge {
  ABI10_0_0CSSEdgeLeft,
  ABI10_0_0CSSEdgeTop,
  ABI10_0_0CSSEdgeRight,
  ABI10_0_0CSSEdgeBottom,
  ABI10_0_0CSSEdgeStart,
  ABI10_0_0CSSEdgeEnd,
  ABI10_0_0CSSEdgeHorizontal,
  ABI10_0_0CSSEdgeVertical,
  ABI10_0_0CSSEdgeAll,
  ABI10_0_0CSSEdgeCount,
} ABI10_0_0CSSEdge;

typedef enum ABI10_0_0CSSPrintOptions {
  ABI10_0_0CSSPrintOptionsLayout = 1,
  ABI10_0_0CSSPrintOptionsStyle = 2,
  ABI10_0_0CSSPrintOptionsChildren = 4,
} ABI10_0_0CSSPrintOptions;

typedef struct ABI10_0_0CSSSize {
  float width;
  float height;
} ABI10_0_0CSSSize;

typedef struct ABI10_0_0CSSNode *ABI10_0_0CSSNodeRef;
typedef ABI10_0_0CSSSize (*ABI10_0_0CSSMeasureFunc)(void *context,
                                  float width,
                                  ABI10_0_0CSSMeasureMode widthMode,
                                  float height,
                                  ABI10_0_0CSSMeasureMode heightMode);
typedef void (*ABI10_0_0CSSPrintFunc)(void *context);

// ABI10_0_0CSSNode
ABI10_0_0CSSNodeRef ABI10_0_0CSSNodeNew();
void ABI10_0_0CSSNodeInit(ABI10_0_0CSSNodeRef node);
void ABI10_0_0CSSNodeFree(ABI10_0_0CSSNodeRef node);

void ABI10_0_0CSSNodeInsertChild(ABI10_0_0CSSNodeRef node, ABI10_0_0CSSNodeRef child, uint32_t index);
void ABI10_0_0CSSNodeRemoveChild(ABI10_0_0CSSNodeRef node, ABI10_0_0CSSNodeRef child);
ABI10_0_0CSSNodeRef ABI10_0_0CSSNodeGetChild(ABI10_0_0CSSNodeRef node, uint32_t index);
uint32_t ABI10_0_0CSSNodeChildCount(ABI10_0_0CSSNodeRef node);

void ABI10_0_0CSSNodeCalculateLayout(ABI10_0_0CSSNodeRef node,
                            float availableWidth,
                            float availableHeight,
                            ABI10_0_0CSSDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI10_0_0CSSLayout knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI10_0_0CSSLayout they must perform this dirty
// marking manually.
void ABI10_0_0CSSNodeMarkDirty(ABI10_0_0CSSNodeRef node);
bool ABI10_0_0CSSNodeIsDirty(ABI10_0_0CSSNodeRef node);

void ABI10_0_0CSSNodePrint(ABI10_0_0CSSNodeRef node, ABI10_0_0CSSPrintOptions options);

bool ABI10_0_0CSSValueIsUndefined(float value);

#define ABI10_0_0CSS_NODE_PROPERTY(type, name, paramName)          \
  void ABI10_0_0CSSNodeSet##name(ABI10_0_0CSSNodeRef node, type paramName); \
  type ABI10_0_0CSSNodeGet##name(ABI10_0_0CSSNodeRef node);

#define ABI10_0_0CSS_NODE_STYLE_PROPERTY(type, name, paramName)         \
  void ABI10_0_0CSSNodeStyleSet##name(ABI10_0_0CSSNodeRef node, type paramName); \
  type ABI10_0_0CSSNodeStyleGet##name(ABI10_0_0CSSNodeRef node);

#define ABI10_0_0CSS_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)                  \
  void ABI10_0_0CSSNodeStyleSet##name(ABI10_0_0CSSNodeRef node, ABI10_0_0CSSEdge edge, type paramName); \
  type ABI10_0_0CSSNodeStyleGet##name(ABI10_0_0CSSNodeRef node, ABI10_0_0CSSEdge edge);

#define ABI10_0_0CSS_NODE_LAYOUT_PROPERTY(type, name) type ABI10_0_0CSSNodeLayoutGet##name(ABI10_0_0CSSNodeRef node);

ABI10_0_0CSS_NODE_PROPERTY(void *, Context, context);
ABI10_0_0CSS_NODE_PROPERTY(ABI10_0_0CSSMeasureFunc, MeasureFunc, measureFunc);
ABI10_0_0CSS_NODE_PROPERTY(ABI10_0_0CSSPrintFunc, PrintFunc, printFunc);
ABI10_0_0CSS_NODE_PROPERTY(bool, IsTextnode, isTextNode);
ABI10_0_0CSS_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);

ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSDirection, Direction, direction);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSFlexDirection, FlexDirection, flexDirection);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSJustify, JustifyContent, justifyContent);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSAlign, AlignContent, alignContent);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSAlign, AlignItems, alignItems);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSAlign, AlignSelf, alignSelf);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSPositionType, PositionType, positionType);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSWrapType, FlexWrap, flexWrap);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(ABI10_0_0CSSOverflow, Overflow, overflow);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, Flex, flex);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, FlexBasis, flexBasis);

ABI10_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Position, position);
ABI10_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Margin, margin);
ABI10_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Padding, padding);
ABI10_0_0CSS_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, Width, width);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, Height, height);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
ABI10_0_0CSS_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

ABI10_0_0CSS_NODE_LAYOUT_PROPERTY(float, Left);
ABI10_0_0CSS_NODE_LAYOUT_PROPERTY(float, Top);
ABI10_0_0CSS_NODE_LAYOUT_PROPERTY(float, Right);
ABI10_0_0CSS_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI10_0_0CSS_NODE_LAYOUT_PROPERTY(float, Width);
ABI10_0_0CSS_NODE_LAYOUT_PROPERTY(float, Height);
ABI10_0_0CSS_NODE_LAYOUT_PROPERTY(ABI10_0_0CSSDirection, Direction);

ABI10_0_0CSS_EXTERN_C_END
