/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ABI27_0_0Yoga-internal.h"
#include "ABI27_0_0Yoga.h"

struct ABI27_0_0YGStyle {
  ABI27_0_0YGDirection direction;
  ABI27_0_0YGFlexDirection flexDirection;
  ABI27_0_0YGJustify justifyContent;
  ABI27_0_0YGAlign alignContent;
  ABI27_0_0YGAlign alignItems;
  ABI27_0_0YGAlign alignSelf;
  ABI27_0_0YGPositionType positionType;
  ABI27_0_0YGWrap flexWrap;
  ABI27_0_0YGOverflow overflow;
  ABI27_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI27_0_0YGValue flexBasis;
  std::array<ABI27_0_0YGValue, ABI27_0_0YGEdgeCount> margin;
  std::array<ABI27_0_0YGValue, ABI27_0_0YGEdgeCount> position;
  std::array<ABI27_0_0YGValue, ABI27_0_0YGEdgeCount> padding;
  std::array<ABI27_0_0YGValue, ABI27_0_0YGEdgeCount> border;
  std::array<ABI27_0_0YGValue, 2> dimensions;
  std::array<ABI27_0_0YGValue, 2> minDimensions;
  std::array<ABI27_0_0YGValue, 2> maxDimensions;
  float aspectRatio;

  ABI27_0_0YGStyle();
  // Yoga specific properties, not compatible with flexbox specification
  bool operator==(const ABI27_0_0YGStyle& style);

  bool operator!=(ABI27_0_0YGStyle style);
  ~ABI27_0_0YGStyle();
};
