/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI28_0_0YGStyle.h"

const ABI28_0_0YGValue kABI28_0_0YGValueUndefined = {ABI28_0_0YGUndefined, ABI28_0_0YGUnitUndefined};

const ABI28_0_0YGValue kABI28_0_0YGValueAuto = {ABI28_0_0YGUndefined, ABI28_0_0YGUnitAuto};

const std::array<ABI28_0_0YGValue, ABI28_0_0YGEdgeCount> kABI28_0_0YGDefaultEdgeValuesUnit = {
    {kABI28_0_0YGValueUndefined,
     kABI28_0_0YGValueUndefined,
     kABI28_0_0YGValueUndefined,
     kABI28_0_0YGValueUndefined,
     kABI28_0_0YGValueUndefined,
     kABI28_0_0YGValueUndefined,
     kABI28_0_0YGValueUndefined,
     kABI28_0_0YGValueUndefined,
     kABI28_0_0YGValueUndefined}};

const std::array<ABI28_0_0YGValue, 2> kABI28_0_0YGDefaultDimensionValuesAutoUnit = {
    {kABI28_0_0YGValueAuto, kABI28_0_0YGValueAuto}};

const std::array<ABI28_0_0YGValue, 2> kABI28_0_0YGDefaultDimensionValuesUnit = {
    {kABI28_0_0YGValueUndefined, kABI28_0_0YGValueUndefined}};

ABI28_0_0YGStyle::ABI28_0_0YGStyle()
    : direction(ABI28_0_0YGDirectionInherit),
      flexDirection(ABI28_0_0YGFlexDirectionColumn),
      justifyContent(ABI28_0_0YGJustifyFlexStart),
      alignContent(ABI28_0_0YGAlignFlexStart),
      alignItems(ABI28_0_0YGAlignStretch),
      alignSelf(ABI28_0_0YGAlignAuto),
      positionType(ABI28_0_0YGPositionTypeRelative),
      flexWrap(ABI28_0_0YGWrapNoWrap),
      overflow(ABI28_0_0YGOverflowVisible),
      display(ABI28_0_0YGDisplayFlex),
      flex(ABI28_0_0YGUndefined),
      flexGrow(ABI28_0_0YGUndefined),
      flexShrink(ABI28_0_0YGUndefined),
      flexBasis(kABI28_0_0YGValueAuto),
      margin(kABI28_0_0YGDefaultEdgeValuesUnit),
      position(kABI28_0_0YGDefaultEdgeValuesUnit),
      padding(kABI28_0_0YGDefaultEdgeValuesUnit),
      border(kABI28_0_0YGDefaultEdgeValuesUnit),
      dimensions(kABI28_0_0YGDefaultDimensionValuesAutoUnit),
      minDimensions(kABI28_0_0YGDefaultDimensionValuesUnit),
      maxDimensions(kABI28_0_0YGDefaultDimensionValuesUnit),
      aspectRatio(ABI28_0_0YGUndefined) {}

// Yoga specific properties, not compatible with flexbox specification
bool ABI28_0_0YGStyle::operator==(const ABI28_0_0YGStyle& style) {
  bool areNonFloatValuesEqual = direction == style.direction &&
      flexDirection == style.flexDirection &&
      justifyContent == style.justifyContent &&
      alignContent == style.alignContent && alignItems == style.alignItems &&
      alignSelf == style.alignSelf && positionType == style.positionType &&
      flexWrap == style.flexWrap && overflow == style.overflow &&
      display == style.display && ABI28_0_0YGValueEqual(flexBasis, style.flexBasis) &&
      ABI28_0_0YGValueArrayEqual(margin, style.margin) &&
      ABI28_0_0YGValueArrayEqual(position, style.position) &&
      ABI28_0_0YGValueArrayEqual(padding, style.padding) &&
      ABI28_0_0YGValueArrayEqual(border, style.border) &&
      ABI28_0_0YGValueArrayEqual(dimensions, style.dimensions) &&
      ABI28_0_0YGValueArrayEqual(minDimensions, style.minDimensions) &&
      ABI28_0_0YGValueArrayEqual(maxDimensions, style.maxDimensions);

  if (!(ABI28_0_0YGFloatIsUndefined(flex) && ABI28_0_0YGFloatIsUndefined(style.flex))) {
    areNonFloatValuesEqual = areNonFloatValuesEqual && flex == style.flex;
  }

  if (!(ABI28_0_0YGFloatIsUndefined(flexGrow) && ABI28_0_0YGFloatIsUndefined(style.flexGrow))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexGrow == style.flexGrow;
  }

  if (!(ABI28_0_0YGFloatIsUndefined(flexShrink) &&
        ABI28_0_0YGFloatIsUndefined(style.flexShrink))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexShrink == style.flexShrink;
  }

  if (!(ABI28_0_0YGFloatIsUndefined(aspectRatio) &&
        ABI28_0_0YGFloatIsUndefined(style.aspectRatio))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && aspectRatio == style.aspectRatio;
  }

  return areNonFloatValuesEqual;
}

bool ABI28_0_0YGStyle::operator!=(ABI28_0_0YGStyle style) {
  return !(*this == style);
}

ABI28_0_0YGStyle::~ABI28_0_0YGStyle() {}
