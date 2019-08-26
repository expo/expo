/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once
#include "ABI32_0_0YGFloatOptional.h"
#include "ABI32_0_0Yoga-internal.h"
#include "ABI32_0_0Yoga.h"

struct ABI32_0_0YGStyle {
  ABI32_0_0YGDirection direction;
  ABI32_0_0YGFlexDirection flexDirection;
  ABI32_0_0YGJustify justifyContent;
  ABI32_0_0YGAlign alignContent;
  ABI32_0_0YGAlign alignItems;
  ABI32_0_0YGAlign alignSelf;
  ABI32_0_0YGPositionType positionType;
  ABI32_0_0YGWrap flexWrap;
  ABI32_0_0YGOverflow overflow;
  ABI32_0_0YGDisplay display;
  ABI32_0_0YGFloatOptional flex;
  ABI32_0_0YGFloatOptional flexGrow;
  ABI32_0_0YGFloatOptional flexShrink;
  ABI32_0_0YGValue flexBasis;
  std::array<ABI32_0_0YGValue, ABI32_0_0YGEdgeCount> margin;
  std::array<ABI32_0_0YGValue, ABI32_0_0YGEdgeCount> position;
  std::array<ABI32_0_0YGValue, ABI32_0_0YGEdgeCount> padding;
  std::array<ABI32_0_0YGValue, ABI32_0_0YGEdgeCount> border;
  std::array<ABI32_0_0YGValue, 2> dimensions;
  std::array<ABI32_0_0YGValue, 2> minDimensions;
  std::array<ABI32_0_0YGValue, 2> maxDimensions;
  // Yoga specific properties, not compatible with flexbox specification
  ABI32_0_0YGFloatOptional aspectRatio;

  ABI32_0_0YGStyle();
  bool operator==(const ABI32_0_0YGStyle& style);

  bool operator!=(ABI32_0_0YGStyle style) {
    return !(*this == style);
  }
  ~ABI32_0_0YGStyle() = default;
};
