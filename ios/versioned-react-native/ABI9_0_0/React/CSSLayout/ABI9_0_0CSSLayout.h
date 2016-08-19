/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __ABI9_0_0CSS_LAYOUT_H
#define __ABI9_0_0CSS_LAYOUT_H

#include <math.h>
#ifndef __cplusplus
#include <stdbool.h>
#endif

// Not defined in MSVC++
#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *)__nan)
#endif

#define ABI9_0_0CSSUndefined NAN

#include <CSSLayout/ABI9_0_0CSSMacros.h>

ABI9_0_0CSS_EXTERN_C_BEGIN

typedef enum ABI9_0_0CSSDirection {
  ABI9_0_0CSSDirectionInherit,
  ABI9_0_0CSSDirectionLTR,
  ABI9_0_0CSSDirectionRTL,
} ABI9_0_0CSSDirection;

typedef enum ABI9_0_0CSSFlexDirection {
  ABI9_0_0CSSFlexDirectionColumn,
  ABI9_0_0CSSFlexDirectionColumnReverse,
  ABI9_0_0CSSFlexDirectionRow,
  ABI9_0_0CSSFlexDirectionRowReverse,
} ABI9_0_0CSSFlexDirection;

typedef enum ABI9_0_0CSSJustify {
  ABI9_0_0CSSJustifyFlexStart,
  ABI9_0_0CSSJustifyCenter,
  ABI9_0_0CSSJustifyFlexEnd,
  ABI9_0_0CSSJustifySpaceBetween,
  ABI9_0_0CSSJustifySpaceAround,
} ABI9_0_0CSSJustify;

typedef enum ABI9_0_0CSSOverflow {
  ABI9_0_0CSSOverflowVisible,
  ABI9_0_0CSSOverflowHidden,
} ABI9_0_0CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum ABI9_0_0CSSAlign {
  ABI9_0_0CSSAlignAuto,
  ABI9_0_0CSSAlignFlexStart,
  ABI9_0_0CSSAlignCenter,
  ABI9_0_0CSSAlignFlexEnd,
  ABI9_0_0CSSAlignStretch,
} ABI9_0_0CSSAlign;

typedef enum ABI9_0_0CSSPositionType {
  ABI9_0_0CSSPositionTypeRelative,
  ABI9_0_0CSSPositionTypeAbsolute,
} ABI9_0_0CSSPositionType;

typedef enum ABI9_0_0CSSWrapType {
  ABI9_0_0CSSWrapTypeNoWrap,
  ABI9_0_0CSSWrapTypeWrap,
} ABI9_0_0CSSWrapType;

// Note: left and top are shared between position[2] and position[4], so
// they have to be before right and bottom.
typedef enum ABI9_0_0CSSPosition {
  ABI9_0_0CSSPositionLeft,
  ABI9_0_0CSSPositionTop,
  ABI9_0_0CSSPositionRight,
  ABI9_0_0CSSPositionBottom,
  ABI9_0_0CSSPositionStart,
  ABI9_0_0CSSPositionEnd,
  ABI9_0_0CSSPositionCount,
} ABI9_0_0CSSPosition;

typedef enum ABI9_0_0CSSMeasureMode {
  ABI9_0_0CSSMeasureModeUndefined,
  ABI9_0_0CSSMeasureModeExactly,
  ABI9_0_0CSSMeasureModeAtMost,
  ABI9_0_0CSSMeasureModeCount,
} ABI9_0_0CSSMeasureMode;

typedef enum ABI9_0_0CSSDimension {
  ABI9_0_0CSSDimensionWidth,
  ABI9_0_0CSSDimensionHeight,
} ABI9_0_0CSSDimension;

typedef enum ABI9_0_0CSSPrintOptions {
  ABI9_0_0CSSPrintOptionsLayout = 1,
  ABI9_0_0CSSPrintOptionsStyle = 2,
  ABI9_0_0CSSPrintOptionsChildren = 4,
} ABI9_0_0CSSPrintOptions;

typedef struct ABI9_0_0CSSSize {
  float width;
  float height;
} ABI9_0_0CSSSize;

typedef struct ABI9_0_0CSSNode * ABI9_0_0CSSNodeRef;
typedef ABI9_0_0CSSSize (*ABI9_0_0CSSMeasureFunc)(void *context, float width, ABI9_0_0CSSMeasureMode widthMode, float height, ABI9_0_0CSSMeasureMode heightMode);
typedef bool (*ABI9_0_0CSSIsDirtyFunc)(void *context);
typedef void (*ABI9_0_0CSSPrintFunc)(void *context);

// ABI9_0_0CSSNode
ABI9_0_0CSSNodeRef ABI9_0_0CSSNodeNew();
void ABI9_0_0CSSNodeInit(ABI9_0_0CSSNodeRef node);
void ABI9_0_0CSSNodeFree(ABI9_0_0CSSNodeRef node);

void ABI9_0_0CSSNodeInsertChild(ABI9_0_0CSSNodeRef node, ABI9_0_0CSSNodeRef child, unsigned int index);
void ABI9_0_0CSSNodeRemoveChild(ABI9_0_0CSSNodeRef node, ABI9_0_0CSSNodeRef child);
ABI9_0_0CSSNodeRef ABI9_0_0CSSNodeGetChild(ABI9_0_0CSSNodeRef node, unsigned int index);
unsigned int ABI9_0_0CSSNodeChildCount(ABI9_0_0CSSNodeRef node);

void ABI9_0_0CSSNodeCalculateLayout(
  ABI9_0_0CSSNodeRef node,
  float availableWidth,
  float availableHeight,
  ABI9_0_0CSSDirection parentDirection);

void ABI9_0_0CSSNodePrint(ABI9_0_0CSSNodeRef node, ABI9_0_0CSSPrintOptions options);

bool isUndefined(float value);

#define ABI9_0_0CSS_NODE_PROPERTY(type, name, paramName) \
void ABI9_0_0CSSNodeSet##name(ABI9_0_0CSSNodeRef node, type paramName); \
type ABI9_0_0CSSNodeGet##name(ABI9_0_0CSSNodeRef node);

#define ABI9_0_0CSS_NODE_STYLE_PROPERTY(type, name, paramName) \
void ABI9_0_0CSSNodeStyleSet##name(ABI9_0_0CSSNodeRef node, type paramName); \
type ABI9_0_0CSSNodeStyleGet##name(ABI9_0_0CSSNodeRef node);

#define ABI9_0_0CSS_NODE_LAYOUT_PROPERTY(type, name) \
type ABI9_0_0CSSNodeLayoutGet##name(ABI9_0_0CSSNodeRef node);

ABI9_0_0CSS_NODE_PROPERTY(void*, Context, context);
ABI9_0_0CSS_NODE_PROPERTY(ABI9_0_0CSSMeasureFunc, MeasureFunc, measureFunc);
ABI9_0_0CSS_NODE_PROPERTY(ABI9_0_0CSSIsDirtyFunc, IsDirtyFunc, isDirtyFunc);
ABI9_0_0CSS_NODE_PROPERTY(ABI9_0_0CSSPrintFunc, PrintFunc, printFunc);
ABI9_0_0CSS_NODE_PROPERTY(bool, IsTextnode, isTextNode);
ABI9_0_0CSS_NODE_PROPERTY(bool, ShouldUpdate, shouldUpdate);

ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSDirection, Direction, direction);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSFlexDirection, FlexDirection, flexDirection);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSJustify, JustifyContent, justifyContent);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSAlign, AlignContent, alignContent);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSAlign, AlignItems, alignItems);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSAlign, AlignSelf, alignSelf);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSPositionType, PositionType, positionType);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSWrapType, FlexWrap, flexWrap);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(ABI9_0_0CSSOverflow, Overflow, overflow);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, Flex, flex);

ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PositionLeft, positionLeft);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PositionTop, positionTop);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PositionRight, positionRight);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PositionBottom, positionBottom);

ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MarginLeft, marginLeft);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MarginTop, marginTop);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MarginRight, marginRight);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MarginBottom, marginBottom);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MarginStart, marginStart);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MarginEnd, marginEnd);

ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingLeft, paddingLeft);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingTop, paddingTop);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingRight, paddingRight);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingBottom, paddingBottom);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingStart, paddingStart);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, PaddingEnd, paddingEnd);

ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, BorderLeft, borderLeft);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, BorderTop, borderTop);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, BorderRight, borderRight);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, BorderBottom, borderBottom);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, BorderStart, borderStart);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, BorderEnd, borderEnd);

ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, Width, width);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, Height, height);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
ABI9_0_0CSS_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

ABI9_0_0CSS_NODE_LAYOUT_PROPERTY(float, Left);
ABI9_0_0CSS_NODE_LAYOUT_PROPERTY(float, Top);
ABI9_0_0CSS_NODE_LAYOUT_PROPERTY(float, Right);
ABI9_0_0CSS_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI9_0_0CSS_NODE_LAYOUT_PROPERTY(float, Width);
ABI9_0_0CSS_NODE_LAYOUT_PROPERTY(float, Height);

ABI9_0_0CSS_EXTERN_C_END

#endif
