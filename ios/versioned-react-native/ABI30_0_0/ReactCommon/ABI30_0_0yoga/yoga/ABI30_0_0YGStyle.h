/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ABI30_0_0Yoga-internal.h"
#include "ABI30_0_0Yoga.h"

struct ABI30_0_0YGStyle {
  ABI30_0_0YGDirection direction;
  ABI30_0_0YGFlexDirection flexDirection;
  ABI30_0_0YGJustify justifyContent;
  ABI30_0_0YGAlign alignContent;
  ABI30_0_0YGAlign alignItems;
  ABI30_0_0YGAlign alignSelf;
  ABI30_0_0YGPositionType positionType;
  ABI30_0_0YGWrap flexWrap;
  ABI30_0_0YGOverflow overflow;
  ABI30_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI30_0_0YGValue flexBasis;
  std::array<ABI30_0_0YGValue, ABI30_0_0YGEdgeCount> margin;
  std::array<ABI30_0_0YGValue, ABI30_0_0YGEdgeCount> position;
  std::array<ABI30_0_0YGValue, ABI30_0_0YGEdgeCount> padding;
  std::array<ABI30_0_0YGValue, ABI30_0_0YGEdgeCount> border;
  std::array<ABI30_0_0YGValue, 2> dimensions;
  std::array<ABI30_0_0YGValue, 2> minDimensions;
  std::array<ABI30_0_0YGValue, 2> maxDimensions;
  float aspectRatio;

  ABI30_0_0YGStyle();
  // Yoga specific properties, not compatible with flexbox specification
  bool operator==(const ABI30_0_0YGStyle& style);

  bool operator!=(ABI30_0_0YGStyle style);
  ~ABI30_0_0YGStyle();
};
