/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "ABI31_0_0YGStyle.h"

const ABI31_0_0YGValue kABI31_0_0YGValueUndefined = {0, ABI31_0_0YGUnitUndefined};

const ABI31_0_0YGValue kABI31_0_0YGValueAuto = {0, ABI31_0_0YGUnitAuto};

const std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> kABI31_0_0YGDefaultEdgeValuesUnit = {
    {kABI31_0_0YGValueUndefined,
     kABI31_0_0YGValueUndefined,
     kABI31_0_0YGValueUndefined,
     kABI31_0_0YGValueUndefined,
     kABI31_0_0YGValueUndefined,
     kABI31_0_0YGValueUndefined,
     kABI31_0_0YGValueUndefined,
     kABI31_0_0YGValueUndefined,
     kABI31_0_0YGValueUndefined}};

const std::array<ABI31_0_0YGValue, 2> kABI31_0_0YGDefaultDimensionValuesAutoUnit = {
    {kABI31_0_0YGValueAuto, kABI31_0_0YGValueAuto}};

const std::array<ABI31_0_0YGValue, 2> kABI31_0_0YGDefaultDimensionValuesUnit = {
    {kABI31_0_0YGValueUndefined, kABI31_0_0YGValueUndefined}};

ABI31_0_0YGStyle::ABI31_0_0YGStyle()
    : direction(ABI31_0_0YGDirectionInherit),
      flexDirection(ABI31_0_0YGFlexDirectionColumn),
      justifyContent(ABI31_0_0YGJustifyFlexStart),
      alignContent(ABI31_0_0YGAlignFlexStart),
      alignItems(ABI31_0_0YGAlignStretch),
      alignSelf(ABI31_0_0YGAlignAuto),
      positionType(ABI31_0_0YGPositionTypeRelative),
      flexWrap(ABI31_0_0YGWrapNoWrap),
      overflow(ABI31_0_0YGOverflowVisible),
      display(ABI31_0_0YGDisplayFlex),
      flex(ABI31_0_0YGFloatOptional()),
      flexGrow(ABI31_0_0YGFloatOptional()),
      flexShrink(ABI31_0_0YGFloatOptional()),
      flexBasis(kABI31_0_0YGValueAuto),
      margin(kABI31_0_0YGDefaultEdgeValuesUnit),
      position(kABI31_0_0YGDefaultEdgeValuesUnit),
      padding(kABI31_0_0YGDefaultEdgeValuesUnit),
      border(kABI31_0_0YGDefaultEdgeValuesUnit),
      dimensions(kABI31_0_0YGDefaultDimensionValuesAutoUnit),
      minDimensions(kABI31_0_0YGDefaultDimensionValuesUnit),
      maxDimensions(kABI31_0_0YGDefaultDimensionValuesUnit),
      aspectRatio(ABI31_0_0YGFloatOptional()) {}

// Yoga specific properties, not compatible with flexbox specification
bool ABI31_0_0YGStyle::operator==(const ABI31_0_0YGStyle& style) {
  bool areNonFloatValuesEqual = direction == style.direction &&
      flexDirection == style.flexDirection &&
      justifyContent == style.justifyContent &&
      alignContent == style.alignContent && alignItems == style.alignItems &&
      alignSelf == style.alignSelf && positionType == style.positionType &&
      flexWrap == style.flexWrap && overflow == style.overflow &&
      display == style.display && ABI31_0_0YGValueEqual(flexBasis, style.flexBasis) &&
      ABI31_0_0YGValueArrayEqual(margin, style.margin) &&
      ABI31_0_0YGValueArrayEqual(position, style.position) &&
      ABI31_0_0YGValueArrayEqual(padding, style.padding) &&
      ABI31_0_0YGValueArrayEqual(border, style.border) &&
      ABI31_0_0YGValueArrayEqual(dimensions, style.dimensions) &&
      ABI31_0_0YGValueArrayEqual(minDimensions, style.minDimensions) &&
      ABI31_0_0YGValueArrayEqual(maxDimensions, style.maxDimensions);

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
