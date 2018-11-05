/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ABI28_0_0Yoga-internal.h"
#include "ABI28_0_0Yoga.h"

struct ABI28_0_0YGStyle {
  ABI28_0_0YGDirection direction;
  ABI28_0_0YGFlexDirection flexDirection;
  ABI28_0_0YGJustify justifyContent;
  ABI28_0_0YGAlign alignContent;
  ABI28_0_0YGAlign alignItems;
  ABI28_0_0YGAlign alignSelf;
  ABI28_0_0YGPositionType positionType;
  ABI28_0_0YGWrap flexWrap;
  ABI28_0_0YGOverflow overflow;
  ABI28_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI28_0_0YGValue flexBasis;
  std::array<ABI28_0_0YGValue, ABI28_0_0YGEdgeCount> margin;
  std::array<ABI28_0_0YGValue, ABI28_0_0YGEdgeCount> position;
  std::array<ABI28_0_0YGValue, ABI28_0_0YGEdgeCount> padding;
  std::array<ABI28_0_0YGValue, ABI28_0_0YGEdgeCount> border;
  std::array<ABI28_0_0YGValue, 2> dimensions;
  std::array<ABI28_0_0YGValue, 2> minDimensions;
  std::array<ABI28_0_0YGValue, 2> maxDimensions;
  float aspectRatio;

  ABI28_0_0YGStyle();
  // Yoga specific properties, not compatible with flexbox specification
  bool operator==(const ABI28_0_0YGStyle& style);

  bool operator!=(ABI28_0_0YGStyle style);
  ~ABI28_0_0YGStyle();
};
