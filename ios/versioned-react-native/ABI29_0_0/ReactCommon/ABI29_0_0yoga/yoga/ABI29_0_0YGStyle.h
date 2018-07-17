/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ABI29_0_0Yoga-internal.h"
#include "ABI29_0_0Yoga.h"

struct ABI29_0_0YGStyle {
  ABI29_0_0YGDirection direction;
  ABI29_0_0YGFlexDirection flexDirection;
  ABI29_0_0YGJustify justifyContent;
  ABI29_0_0YGAlign alignContent;
  ABI29_0_0YGAlign alignItems;
  ABI29_0_0YGAlign alignSelf;
  ABI29_0_0YGPositionType positionType;
  ABI29_0_0YGWrap flexWrap;
  ABI29_0_0YGOverflow overflow;
  ABI29_0_0YGDisplay display;
  float flex;
  float flexGrow;
  float flexShrink;
  ABI29_0_0YGValue flexBasis;
  std::array<ABI29_0_0YGValue, ABI29_0_0YGEdgeCount> margin;
  std::array<ABI29_0_0YGValue, ABI29_0_0YGEdgeCount> position;
  std::array<ABI29_0_0YGValue, ABI29_0_0YGEdgeCount> padding;
  std::array<ABI29_0_0YGValue, ABI29_0_0YGEdgeCount> border;
  std::array<ABI29_0_0YGValue, 2> dimensions;
  std::array<ABI29_0_0YGValue, 2> minDimensions;
  std::array<ABI29_0_0YGValue, 2> maxDimensions;
  float aspectRatio;

  ABI29_0_0YGStyle();
  // Yoga specific properties, not compatible with flexbox specification
  bool operator==(const ABI29_0_0YGStyle& style);

  bool operator!=(ABI29_0_0YGStyle style);
  ~ABI29_0_0YGStyle();
};
