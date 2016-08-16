/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __CSS_LAYOUT_H
#define __CSS_LAYOUT_H

#include <math.h>
#ifndef __cplusplus
#include <stdbool.h>
#endif

// Not defined in MSVC++
#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *)__nan)
#endif

#define ABI8_0_0CSSUndefined NAN

#include <CSSLayout/ABI8_0_0CSSMacros.h>

ABI8_0_0CSS_EXTERN_C_BEGIN

typedef enum ABI8_0_0CSSDirection {
  ABI8_0_0CSSDirectionInherit,
  ABI8_0_0CSSDirectionLTR,
  ABI8_0_0CSSDirectionRTL,
} ABI8_0_0CSSDirection;

typedef enum ABI8_0_0CSSFlexDirection {
  ABI8_0_0CSSFlexDirectionColumn,
  ABI8_0_0CSSFlexDirectionColumnReverse,
  ABI8_0_0CSSFlexDirectionRow,
  ABI8_0_0CSSFlexDirectionRowReverse,
} ABI8_0_0CSSFlexDirection;

typedef enum ABI8_0_0CSSJustify {
  ABI8_0_0CSSJustifyFlexStart,
  ABI8_0_0CSSJustifyCenter,
  ABI8_0_0CSSJustifyFlexEnd,
  ABI8_0_0CSSJustifySpaceBetween,
  ABI8_0_0CSSJustifySpaceAround,
} ABI8_0_0CSSJustify;

typedef enum ABI8_0_0CSSOverflow {
  ABI8_0_0CSSOverflowVisible,
  ABI8_0_0CSSOverflowHidden,
} ABI8_0_0CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum ABI8_0_0CSSAlign {
  ABI8_0_0CSSAlignAuto,
  ABI8_0_0CSSAlignFlexStart,
  ABI8_0_0CSSAlignCenter,
  ABI8_0_0CSSAlignFlexEnd,
  ABI8_0_0CSSAlignStretch,
} ABI8_0_0CSSAlign;

typedef enum ABI8_0_0CSSPositionType {
  ABI8_0_0CSSPositionTypeRelative,
  ABI8_0_0CSSPositionTypeAbsolute,
} ABI8_0_0CSSPositionType;

typedef enum ABI8_0_0CSSWrapType {
  ABI8_0_0CSSWrapTypeNoWrap,
  ABI8_0_0CSSWrapTypeWrap,
} ABI8_0_0CSSWrapType;

// Note: left and top are shared between position[2] and position[4], so
// they have to be before right and bottom.
typedef enum ABI8_0_0CSSPosition {
  ABI8_0_0CSSPositionLeft,
  ABI8_0_0CSSPositionTop,
  ABI8_0_0CSSPositionRight,
  ABI8_0_0CSSPositionBottom,
  ABI8_0_0CSSPositionStart,
  ABI8_0_0CSSPositionEnd,
  ABI8_0_0CSSPositionCount,
} ABI8_0_0CSSPosition;

typedef enum ABI8_0_0CSSMeasureMode {
  ABI8_0_0CSSMeasureModeUndefined,
  ABI8_0_0CSSMeasureModeExactly,
  ABI8_0_0CSSMeasureModeAtMost,
  ABI8_0_0CSSMeasureModeCount,
} ABI8_0_0CSSMeasureMode;

typedef enum ABI8_0_0CSSDimension {
  ABI8_0_0CSSDimensionWidth,
  ABI8_0_0CSSDimensionHeight,
} ABI8_0_0CSSDimension;

typedef enum ABI8_0_0CSSPrintOptions {
  ABI8_0_0CSSPrintOptionsLayout = 1,
  ABI8_0_0CSSPrintOptionsStyle = 2,
  ABI8_0_0CSSPrintOptionsChildren = 4,
} ABI8_0_0CSSPrintOptions;

typedef struct ABI8_0_0CSSSize {
  float width;
  float height;
} ABI8_0_0CSSSize;

typedef struct ABI8_0_0CSSNode * ABI8_0_0CSSNodeRef;
typedef ABI8_0_0CSSSize (*ABI8_0_0CSSMeasureFunc)(void *context, float width, ABI8_0_0CSSMeasureMode widthMode, float height, ABI8_0_0CSSMeasureMode heightMode);
typedef bool (*ABI8_0_0CSSIsDirtyFunc)(void *context);
typedef void (*ABI8_0_0CSSPrintFunc)(void *context);

// ABI8_0_0CSSNode
ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeNew();
void ABI8_0_0CSSNodeInit(ABI8_0_0CSSNodeRef node);
void ABI8_0_0CSSNodeFree(ABI8_0_0CSSNodeRef node);

void ABI8_0_0CSSNodeInsertChild(ABI8_0_0CSSNodeRef node, ABI8_0_0CSSNodeRef child, unsigned int index);
void ABI8_0_0CSSNodeRemoveChild(ABI8_0_0CSSNodeRef node, ABI8_0_0CSSNodeRef child);
ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeGetChild(ABI8_0_0CSSNodeRef node, unsigned int index);
unsigned int ABI8_0_0CSSNodeChildCount(ABI8_0_0CSSNodeRef node);

void ABI8_0_0CSSNodeCalculateLayout(
  ABI8_0_0CSSNodeRef node,
  float availableWidth,
  float availableHeight,
  ABI8_0_0CSSDirection parentDirection);

void ABI8_0_0CSSNodePrint(ABI8_0_0CSSNodeRef node, ABI8_0_0CSSPrintOptions options);

bool isUndefined(float value);

#define ABI8_0_0CSS_NODE_PROPERTY(type, name, paramName) \
void ABI8_0_0CSSNodeSet##name(ABI8_0_0CSSNodeRef node, type paramName); \
type ABI8_0_0CSSNodeGet##name(ABI8_0_0CSSNodeRef node);

#define ABI8_0_0CSS_NODE_STYLE_PROPERTY(type, name, paramName) \
void ABI8_0_0CSSNodeStyleSet##name(ABI8_0_0CSSNodeRef node, type paramName); \
type ABI8_0_0CSSNodeStyleGet##name(ABI8_0_0CSSNodeRef node);

#define ABI8_0_0CSS_NODE_LAYOUT_PROPERTY(type, name) \
type ABI8_0_0CSSNodeLayoutGet##name(ABI8_0_0CSSNodeRef node);

ABI8_0_0CSS_NODE_PROPERTY(void*, Context, context);
ABI8_0_0CSS_NODE_PROPERTY(ABI8_0_0CSSMeasureFunc, MeasureFunc, measureFunc);
ABI8_0_0CSS_NODE_PROPERTY(ABI8_0_0CSSIsDirtyFunc, IsDirtyFunc, isDirtyFunc);
ABI8_0_0CSS_NODE_PROPERTY(ABI8_0_0CSSPrintFunc, PrintFunc, printFunc);
ABI8_0_0CSS_NODE_PROPERTY(bool, IsTextnode, isTextNode);
ABI8_0_0CSS_NODE_PROPERTY(bool, ShouldUpdate, shouldUpdate);

ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSDirection, Direction, direction);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSFlexDirection, FlexDirection, flexDirection);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSJustify, JustifyContent, justifyContent);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSAlign, AlignContent, alignContent);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSAlign, AlignItems, alignItems);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSAlign, AlignSelf, alignSelf);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSPositionType, PositionType, positionType);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSWrapType, FlexWrap, flexWrap);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(ABI8_0_0CSSOverflow, Overflow, overflow);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, Flex, flex);

ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PositionLeft, positionLeft);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PositionTop, positionTop);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PositionRight, positionRight);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PositionBottom, positionBottom);

ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MarginLeft, marginLeft);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MarginTop, marginTop);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MarginRight, marginRight);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MarginBottom, marginBottom);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MarginStart, marginStart);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MarginEnd, marginEnd);

ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingLeft, paddingLeft);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingTop, paddingTop);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingRight, paddingRight);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingBottom, paddingBottom);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingStart, paddingStart);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingEnd, paddingEnd);

ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, BorderLeft, borderLeft);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, BorderTop, borderTop);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, BorderRight, borderRight);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, BorderBottom, borderBottom);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, BorderStart, borderStart);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, BorderEnd, borderEnd);

ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, Width, width);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, Height, height);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
ABI8_0_0CSS_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

ABI8_0_0CSS_NODE_LAYOUT_PROPERTY(float, Left);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY(float, Top);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY(float, Right);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY(float, Width);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY(float, Height);

ABI8_0_0CSS_EXTERN_C_END

#endif
