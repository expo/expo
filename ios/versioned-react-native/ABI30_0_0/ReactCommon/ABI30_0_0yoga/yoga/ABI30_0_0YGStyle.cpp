/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI30_0_0YGStyle.h"

const ABI30_0_0YGValue kABI30_0_0YGValueUndefined = {ABI30_0_0YGUndefined, ABI30_0_0YGUnitUndefined};

const ABI30_0_0YGValue kABI30_0_0YGValueAuto = {ABI30_0_0YGUndefined, ABI30_0_0YGUnitAuto};

const std::array<ABI30_0_0YGValue, ABI30_0_0YGEdgeCount> kABI30_0_0YGDefaultEdgeValuesUnit = {
    {kABI30_0_0YGValueUndefined,
     kABI30_0_0YGValueUndefined,
     kABI30_0_0YGValueUndefined,
     kABI30_0_0YGValueUndefined,
     kABI30_0_0YGValueUndefined,
     kABI30_0_0YGValueUndefined,
     kABI30_0_0YGValueUndefined,
     kABI30_0_0YGValueUndefined,
     kABI30_0_0YGValueUndefined}};

const std::array<ABI30_0_0YGValue, 2> kABI30_0_0YGDefaultDimensionValuesAutoUnit = {
    {kABI30_0_0YGValueAuto, kABI30_0_0YGValueAuto}};

const std::array<ABI30_0_0YGValue, 2> kABI30_0_0YGDefaultDimensionValuesUnit = {
    {kABI30_0_0YGValueUndefined, kABI30_0_0YGValueUndefined}};

ABI30_0_0YGStyle::ABI30_0_0YGStyle()
    : direction(ABI30_0_0YGDirectionInherit),
      flexDirection(ABI30_0_0YGFlexDirectionColumn),
      justifyContent(ABI30_0_0YGJustifyFlexStart),
      alignContent(ABI30_0_0YGAlignFlexStart),
      alignItems(ABI30_0_0YGAlignStretch),
      alignSelf(ABI30_0_0YGAlignAuto),
      positionType(ABI30_0_0YGPositionTypeRelative),
      flexWrap(ABI30_0_0YGWrapNoWrap),
      overflow(ABI30_0_0YGOverflowVisible),
      display(ABI30_0_0YGDisplayFlex),
      flex(ABI30_0_0YGUndefined),
      flexGrow(ABI30_0_0YGUndefined),
      flexShrink(ABI30_0_0YGUndefined),
      flexBasis(kABI30_0_0YGValueAuto),
      margin(kABI30_0_0YGDefaultEdgeValuesUnit),
      position(kABI30_0_0YGDefaultEdgeValuesUnit),
      padding(kABI30_0_0YGDefaultEdgeValuesUnit),
      border(kABI30_0_0YGDefaultEdgeValuesUnit),
      dimensions(kABI30_0_0YGDefaultDimensionValuesAutoUnit),
      minDimensions(kABI30_0_0YGDefaultDimensionValuesUnit),
      maxDimensions(kABI30_0_0YGDefaultDimensionValuesUnit),
      aspectRatio(ABI30_0_0YGUndefined) {}

// Yoga specific properties, not compatible with flexbox specification
bool ABI30_0_0YGStyle::operator==(const ABI30_0_0YGStyle& style) {
  bool areNonFloatValuesEqual = direction == style.direction &&
      flexDirection == style.flexDirection &&
      justifyContent == style.justifyContent &&
      alignContent == style.alignContent && alignItems == style.alignItems &&
      alignSelf == style.alignSelf && positionType == style.positionType &&
      flexWrap == style.flexWrap && overflow == style.overflow &&
      display == style.display && ABI30_0_0YGValueEqual(flexBasis, style.flexBasis) &&
      ABI30_0_0YGValueArrayEqual(margin, style.margin) &&
      ABI30_0_0YGValueArrayEqual(position, style.position) &&
      ABI30_0_0YGValueArrayEqual(padding, style.padding) &&
      ABI30_0_0YGValueArrayEqual(border, style.border) &&
      ABI30_0_0YGValueArrayEqual(dimensions, style.dimensions) &&
      ABI30_0_0YGValueArrayEqual(minDimensions, style.minDimensions) &&
      ABI30_0_0YGValueArrayEqual(maxDimensions, style.maxDimensions);

  if (!(ABI30_0_0YGFloatIsUndefined(flex) && ABI30_0_0YGFloatIsUndefined(style.flex))) {
    areNonFloatValuesEqual = areNonFloatValuesEqual && flex == style.flex;
  }

  if (!(ABI30_0_0YGFloatIsUndefined(flexGrow) && ABI30_0_0YGFloatIsUndefined(style.flexGrow))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexGrow == style.flexGrow;
  }

  if (!(ABI30_0_0YGFloatIsUndefined(flexShrink) &&
        ABI30_0_0YGFloatIsUndefined(style.flexShrink))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexShrink == style.flexShrink;
  }

  if (!(ABI30_0_0YGFloatIsUndefined(aspectRatio) &&
        ABI30_0_0YGFloatIsUndefined(style.aspectRatio))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && aspectRatio == style.aspectRatio;
  }

  return areNonFloatValuesEqual;
}

bool ABI30_0_0YGStyle::operator!=(ABI30_0_0YGStyle style) {
  return !(*this == style);
}

ABI30_0_0YGStyle::~ABI30_0_0YGStyle() {}
