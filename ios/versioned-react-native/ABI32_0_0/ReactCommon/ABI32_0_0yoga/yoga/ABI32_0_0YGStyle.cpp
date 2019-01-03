/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "ABI32_0_0YGStyle.h"

const ABI32_0_0YGValue kABI32_0_0YGValueUndefined = {0, ABI32_0_0YGUnitUndefined};

const ABI32_0_0YGValue kABI32_0_0YGValueAuto = {0, ABI32_0_0YGUnitAuto};

const std::array<ABI32_0_0YGValue, ABI32_0_0YGEdgeCount> kABI32_0_0YGDefaultEdgeValuesUnit = {
    {kABI32_0_0YGValueUndefined,
     kABI32_0_0YGValueUndefined,
     kABI32_0_0YGValueUndefined,
     kABI32_0_0YGValueUndefined,
     kABI32_0_0YGValueUndefined,
     kABI32_0_0YGValueUndefined,
     kABI32_0_0YGValueUndefined,
     kABI32_0_0YGValueUndefined,
     kABI32_0_0YGValueUndefined}};

const std::array<ABI32_0_0YGValue, 2> kABI32_0_0YGDefaultDimensionValuesAutoUnit = {
    {kABI32_0_0YGValueAuto, kABI32_0_0YGValueAuto}};

const std::array<ABI32_0_0YGValue, 2> kABI32_0_0YGDefaultDimensionValuesUnit = {
    {kABI32_0_0YGValueUndefined, kABI32_0_0YGValueUndefined}};

ABI32_0_0YGStyle::ABI32_0_0YGStyle()
    : direction(ABI32_0_0YGDirectionInherit),
      flexDirection(ABI32_0_0YGFlexDirectionColumn),
      justifyContent(ABI32_0_0YGJustifyFlexStart),
      alignContent(ABI32_0_0YGAlignFlexStart),
      alignItems(ABI32_0_0YGAlignStretch),
      alignSelf(ABI32_0_0YGAlignAuto),
      positionType(ABI32_0_0YGPositionTypeRelative),
      flexWrap(ABI32_0_0YGWrapNoWrap),
      overflow(ABI32_0_0YGOverflowVisible),
      display(ABI32_0_0YGDisplayFlex),
      flex(ABI32_0_0YGFloatOptional()),
      flexGrow(ABI32_0_0YGFloatOptional()),
      flexShrink(ABI32_0_0YGFloatOptional()),
      flexBasis(kABI32_0_0YGValueAuto),
      margin(kABI32_0_0YGDefaultEdgeValuesUnit),
      position(kABI32_0_0YGDefaultEdgeValuesUnit),
      padding(kABI32_0_0YGDefaultEdgeValuesUnit),
      border(kABI32_0_0YGDefaultEdgeValuesUnit),
      dimensions(kABI32_0_0YGDefaultDimensionValuesAutoUnit),
      minDimensions(kABI32_0_0YGDefaultDimensionValuesUnit),
      maxDimensions(kABI32_0_0YGDefaultDimensionValuesUnit),
      aspectRatio(ABI32_0_0YGFloatOptional()) {}

// Yoga specific properties, not compatible with flexbox specification
bool ABI32_0_0YGStyle::operator==(const ABI32_0_0YGStyle& style) {
  bool areNonFloatValuesEqual = direction == style.direction &&
      flexDirection == style.flexDirection &&
      justifyContent == style.justifyContent &&
      alignContent == style.alignContent && alignItems == style.alignItems &&
      alignSelf == style.alignSelf && positionType == style.positionType &&
      flexWrap == style.flexWrap && overflow == style.overflow &&
      display == style.display && ABI32_0_0YGValueEqual(flexBasis, style.flexBasis) &&
      ABI32_0_0YGValueArrayEqual(margin, style.margin) &&
      ABI32_0_0YGValueArrayEqual(position, style.position) &&
      ABI32_0_0YGValueArrayEqual(padding, style.padding) &&
      ABI32_0_0YGValueArrayEqual(border, style.border) &&
      ABI32_0_0YGValueArrayEqual(dimensions, style.dimensions) &&
      ABI32_0_0YGValueArrayEqual(minDimensions, style.minDimensions) &&
      ABI32_0_0YGValueArrayEqual(maxDimensions, style.maxDimensions);

  areNonFloatValuesEqual =
      areNonFloatValuesEqual && flex.isUndefined() == style.flex.isUndefined();
  if (areNonFloatValuesEqual && !flex.isUndefined() &&
      !style.flex.isUndefined()) {
    areNonFloatValuesEqual =
        areNonFloatValuesEqual && flex.getValue() == style.flex.getValue();
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      flexGrow.isUndefined() == style.flexGrow.isUndefined();
  if (areNonFloatValuesEqual && !flexGrow.isUndefined()) {
    areNonFloatValuesEqual = areNonFloatValuesEqual &&
        flexGrow.getValue() == style.flexGrow.getValue();
  }

  areNonFloatValuesEqual = areNonFloatValuesEqual &&
      flexShrink.isUndefined() == style.flexShrink.isUndefined();
  if (areNonFloatValuesEqual && !style.flexShrink.isUndefined()) {
    areNonFloatValuesEqual = areNonFloatValuesEqual &&
        flexShrink.getValue() == style.flexShrink.getValue();
  }

  if (!(aspectRatio.isUndefined() && style.aspectRatio.isUndefined())) {
    areNonFloatValuesEqual = areNonFloatValuesEqual &&
        aspectRatio.getValue() == style.aspectRatio.getValue();
  }

  return areNonFloatValuesEqual;
}
