/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once
#include "ABI31_0_0YGFloatOptional.h"
#include "ABI31_0_0Yoga-internal.h"
#include "ABI31_0_0Yoga.h"

struct ABI31_0_0YGStyle {
  ABI31_0_0YGDirection direction;
  ABI31_0_0YGFlexDirection flexDirection;
  ABI31_0_0YGJustify justifyContent;
  ABI31_0_0YGAlign alignContent;
  ABI31_0_0YGAlign alignItems;
  ABI31_0_0YGAlign alignSelf;
  ABI31_0_0YGPositionType positionType;
  ABI31_0_0YGWrap flexWrap;
  ABI31_0_0YGOverflow overflow;
  ABI31_0_0YGDisplay display;
  ABI31_0_0YGFloatOptional flex;
  ABI31_0_0YGFloatOptional flexGrow;
  ABI31_0_0YGFloatOptional flexShrink;
  ABI31_0_0YGValue flexBasis;
  std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> margin;
  std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> position;
  std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> padding;
  std::array<ABI31_0_0YGValue, ABI31_0_0YGEdgeCount> border;
  std::array<ABI31_0_0YGValue, 2> dimensions;
  std::array<ABI31_0_0YGValue, 2> minDimensions;
  std::array<ABI31_0_0YGValue, 2> maxDimensions;
  // Yoga specific properties, not compatible with flexbox specification
  ABI31_0_0YGFloatOptional aspectRatio;

  ABI31_0_0YGStyle();
  bool operator==(const ABI31_0_0YGStyle& style);

  bool operator!=(ABI31_0_0YGStyle style) {
    return !(*this == style);
  }
  ~ABI31_0_0YGStyle() = default;
};
