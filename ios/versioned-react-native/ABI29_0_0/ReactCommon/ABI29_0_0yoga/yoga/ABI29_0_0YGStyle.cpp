/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI29_0_0YGStyle.h"

const ABI29_0_0YGValue kABI29_0_0YGValueUndefined = {ABI29_0_0YGUndefined, ABI29_0_0YGUnitUndefined};

const ABI29_0_0YGValue kABI29_0_0YGValueAuto = {ABI29_0_0YGUndefined, ABI29_0_0YGUnitAuto};

const std::array<ABI29_0_0YGValue, ABI29_0_0YGEdgeCount> kABI29_0_0YGDefaultEdgeValuesUnit = {
    {kABI29_0_0YGValueUndefined,
     kABI29_0_0YGValueUndefined,
     kABI29_0_0YGValueUndefined,
     kABI29_0_0YGValueUndefined,
     kABI29_0_0YGValueUndefined,
     kABI29_0_0YGValueUndefined,
     kABI29_0_0YGValueUndefined,
     kABI29_0_0YGValueUndefined,
     kABI29_0_0YGValueUndefined}};

const std::array<ABI29_0_0YGValue, 2> kABI29_0_0YGDefaultDimensionValuesAutoUnit = {
    {kABI29_0_0YGValueAuto, kABI29_0_0YGValueAuto}};

const std::array<ABI29_0_0YGValue, 2> kABI29_0_0YGDefaultDimensionValuesUnit = {
    {kABI29_0_0YGValueUndefined, kABI29_0_0YGValueUndefined}};

ABI29_0_0YGStyle::ABI29_0_0YGStyle()
    : direction(ABI29_0_0YGDirectionInherit),
      flexDirection(ABI29_0_0YGFlexDirectionColumn),
      justifyContent(ABI29_0_0YGJustifyFlexStart),
      alignContent(ABI29_0_0YGAlignFlexStart),
      alignItems(ABI29_0_0YGAlignStretch),
      alignSelf(ABI29_0_0YGAlignAuto),
      positionType(ABI29_0_0YGPositionTypeRelative),
      flexWrap(ABI29_0_0YGWrapNoWrap),
      overflow(ABI29_0_0YGOverflowVisible),
      display(ABI29_0_0YGDisplayFlex),
      flex(ABI29_0_0YGUndefined),
      flexGrow(ABI29_0_0YGUndefined),
      flexShrink(ABI29_0_0YGUndefined),
      flexBasis(kABI29_0_0YGValueAuto),
      margin(kABI29_0_0YGDefaultEdgeValuesUnit),
      position(kABI29_0_0YGDefaultEdgeValuesUnit),
      padding(kABI29_0_0YGDefaultEdgeValuesUnit),
      border(kABI29_0_0YGDefaultEdgeValuesUnit),
      dimensions(kABI29_0_0YGDefaultDimensionValuesAutoUnit),
      minDimensions(kABI29_0_0YGDefaultDimensionValuesUnit),
      maxDimensions(kABI29_0_0YGDefaultDimensionValuesUnit),
      aspectRatio(ABI29_0_0YGUndefined) {}

// Yoga specific properties, not compatible with flexbox specification
bool ABI29_0_0YGStyle::operator==(const ABI29_0_0YGStyle& style) {
  bool areNonFloatValuesEqual = direction == style.direction &&
      flexDirection == style.flexDirection &&
      justifyContent == style.justifyContent &&
      alignContent == style.alignContent && alignItems == style.alignItems &&
      alignSelf == style.alignSelf && positionType == style.positionType &&
      flexWrap == style.flexWrap && overflow == style.overflow &&
      display == style.display && ABI29_0_0YGValueEqual(flexBasis, style.flexBasis) &&
      ABI29_0_0YGValueArrayEqual(margin, style.margin) &&
      ABI29_0_0YGValueArrayEqual(position, style.position) &&
      ABI29_0_0YGValueArrayEqual(padding, style.padding) &&
      ABI29_0_0YGValueArrayEqual(border, style.border) &&
      ABI29_0_0YGValueArrayEqual(dimensions, style.dimensions) &&
      ABI29_0_0YGValueArrayEqual(minDimensions, style.minDimensions) &&
      ABI29_0_0YGValueArrayEqual(maxDimensions, style.maxDimensions);

  if (!(ABI29_0_0YGFloatIsUndefined(flex) && ABI29_0_0YGFloatIsUndefined(style.flex))) {
    areNonFloatValuesEqual = areNonFloatValuesEqual && flex == style.flex;
  }

  if (!(ABI29_0_0YGFloatIsUndefined(flexGrow) && ABI29_0_0YGFloatIsUndefined(style.flexGrow))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexGrow == style.flexGrow;
  }

  if (!(ABI29_0_0YGFloatIsUndefined(flexShrink) &&
        ABI29_0_0YGFloatIsUndefined(style.flexShrink))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flexShrink == style.flexShrink;
  }

  if (!(ABI29_0_0YGFloatIsUndefined(aspectRatio) &&
        ABI29_0_0YGFloatIsUndefined(style.aspectRatio))) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && aspectRatio == style.aspectRatio;
  }

  return areNonFloatValuesEqual;
}

bool ABI29_0_0YGStyle::operator!=(ABI29_0_0YGStyle style) {
  return !(*this == style);
}

ABI29_0_0YGStyle::~ABI29_0_0YGStyle() {}
