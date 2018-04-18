/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI27_0_0YGStyle.h"

const ABI27_0_0YGValue kABI27_0_0YGValueUndefined = {ABI27_0_0YGUndefined, ABI27_0_0YGUnitUndefined};

const ABI27_0_0YGValue kABI27_0_0YGValueAuto = {ABI27_0_0YGUndefined, ABI27_0_0YGUnitAuto};

const std::array<ABI27_0_0YGValue, ABI27_0_0YGEdgeCount> kABI27_0_0YGDefaultEdgeValuesUnit = {
    {kABI27_0_0YGValueUndefined,
     kABI27_0_0YGValueUndefined,
     kABI27_0_0YGValueUndefined,
     kABI27_0_0YGValueUndefined,
     kABI27_0_0YGValueUndefined,
     kABI27_0_0YGValueUndefined,
     kABI27_0_0YGValueUndefined,
     kABI27_0_0YGValueUndefined,
     kABI27_0_0YGValueUndefined}};

const std::array<ABI27_0_0YGValue, 2> kABI27_0_0YGDefaultDimensionValuesAutoUnit = {
    {kABI27_0_0YGValueAuto, kABI27_0_0YGValueAuto}};

const std::array<ABI27_0_0YGValue, 2> kABI27_0_0YGDefaultDimensionValuesUnit = {
    {kABI27_0_0YGValueUndefined, kABI27_0_0YGValueUndefined}};

ABI27_0_0YGStyle::ABI27_0_0YGStyle()
    : direction(ABI27_0_0YGDirectionInherit),
      flexDirection(ABI27_0_0YGFlexDirectionColumn),
      justifyContent(ABI27_0_0YGJustifyFlexStart),
      alignContent(ABI27_0_0YGAlignFlexStart),
      alignItems(ABI27_0_0YGAlignStretch),
      alignSelf(ABI27_0_0YGAlignAuto),
      positionType(ABI27_0_0YGPositionTypeRelative),
      flexWrap(ABI27_0_0YGWrapNoWrap),
      overflow(ABI27_0_0YGOverflowVisible),
      display(ABI27_0_0YGDisplayFlex),
      flex(ABI27_0_0YGUndefined),
      flexGrow(ABI27_0_0YGUndefined),
      flexShrink(ABI27_0_0YGUndefined),
      flexBasis(kABI27_0_0YGValueAuto),
      margin(kABI27_0_0YGDefaultEdgeValuesUnit),
      position(kABI27_0_0YGDefaultEdgeValuesUnit),
      padding(kABI27_0_0YGDefaultEdgeValuesUnit),
      border(kABI27_0_0YGDefaultEdgeValuesUnit),
      dimensions(kABI27_0_0YGDefaultDimensionValuesAutoUnit),
      minDimensions(kABI27_0_0YGDefaultDimensionValuesUnit),
      maxDimensions(kABI27_0_0YGDefaultDimensionValuesUnit),
      aspectRatio(ABI27_0_0YGUndefined) {}

// Yoga specific properties, not compatible with flexbox specification
bool ABI27_0_0YGStyle::operator==(const ABI27_0_0YGStyle& style) {
  bool areNonFloatValuesEqual = direction == style.direction &&
      flexDirection == style.flexDirection &&
      justifyContent == style.justifyContent &&
      alignContent == style.alignContent && alignItems == style.alignItems &&
      alignSelf == style.alignSelf && positionType == style.positionType &&
      flexWrap == style.flexWrap && overflow == style.overflow &&
      display == style.display && ABI27_0_0YGValueEqual(flexBasis, style.flexBasis) &&
      ABI27_0_0YGValueArrayEqual(margin, style.margin) &&
      ABI27_0_0YGValueArrayEqual(position, style.position) &&
      ABI27_0_0YGValueArrayEqual(padding, style.padding) &&
      ABI27_0_0YGValueArrayEqual(border, style.border) &&
      ABI27_0_0YGValueArrayEqual(dimensions, style.dimensions) &&
      ABI27_0_0YGValueArrayEqual(minDimensions, style.minDimensions) &&
      ABI27_0_0YGValueArrayEqual(maxDimensions, style.maxDimensions);

  if (!(ABI27_0_0YGFloatIsUndefined(flex) && ABI27_0_0YGFloatIsUndefined(style.flex))) {
    areNonFloatValuesEqual = areNonFloatValuesEqual && flex == style.flex;
  }

  if (!(ABI27_0_0YGFloatIsUndefined(flexGrow) && ABI27_0_0YGFloatIsUndefined(style.flexGrow))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexGrow == style.flexGrow;
  }

  if (!(ABI27_0_0YGFloatIsUndefined(flexShrink) &&
        ABI27_0_0YGFloatIsUndefined(style.flexShrink))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexShrink == style.flexShrink;
  }

  if (!(ABI27_0_0YGFloatIsUndefined(aspectRatio) &&
        ABI27_0_0YGFloatIsUndefined(style.aspectRatio))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && aspectRatio == style.aspectRatio;
  }

  return areNonFloatValuesEqual;
}

bool ABI27_0_0YGStyle::operator!=(ABI27_0_0YGStyle style) {
  return !(*this == style);
}

ABI27_0_0YGStyle::~ABI27_0_0YGStyle() {}
