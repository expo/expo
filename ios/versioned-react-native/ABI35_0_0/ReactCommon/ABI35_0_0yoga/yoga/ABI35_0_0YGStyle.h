/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <algorithm>
#include <array>
#include <initializer_list>
#include "ABI35_0_0CompactValue.h"
#include "ABI35_0_0YGEnums.h"
#include "ABI35_0_0YGFloatOptional.h"
#include "ABI35_0_0Yoga-internal.h"
#include "ABI35_0_0Yoga.h"

#if !defined(ENUM_BITFIELDS_NOT_SUPPORTED)
#define BITFIELD_ENUM_SIZED(num) : num
#else
#define BITFIELD_ENUM_SIZED(num)
#endif

struct ABI35_0_0YGStyle {
private:
  using CompactValue = facebook::ABI35_0_0yoga::detail::CompactValue;

public:
  using Dimensions = facebook::ABI35_0_0yoga::detail::Values<2>;
  using Edges =
      facebook::ABI35_0_0yoga::detail::Values<facebook::ABI35_0_0yoga::enums::count<ABI35_0_0YGEdge>()>;

  /* Some platforms don't support enum bitfields,
     so please use BITFIELD_ENUM_SIZED(BITS_COUNT) */
  ABI35_0_0YGDirection direction BITFIELD_ENUM_SIZED(2);
  ABI35_0_0YGFlexDirection flexDirection BITFIELD_ENUM_SIZED(2);
  ABI35_0_0YGJustify justifyContent BITFIELD_ENUM_SIZED(3);
  ABI35_0_0YGAlign alignContent BITFIELD_ENUM_SIZED(3);
  ABI35_0_0YGAlign alignItems BITFIELD_ENUM_SIZED(3);
  ABI35_0_0YGAlign alignSelf BITFIELD_ENUM_SIZED(3);
  ABI35_0_0YGPositionType positionType BITFIELD_ENUM_SIZED(1);
  ABI35_0_0YGWrap flexWrap BITFIELD_ENUM_SIZED(2);
  ABI35_0_0YGOverflow overflow BITFIELD_ENUM_SIZED(2);
  ABI35_0_0YGDisplay display BITFIELD_ENUM_SIZED(1);
  ABI35_0_0YGFloatOptional flex = {};
  ABI35_0_0YGFloatOptional flexGrow = {};
  ABI35_0_0YGFloatOptional flexShrink = {};
  CompactValue flexBasis = CompactValue::ofAuto();
  Edges margin = {};
  Edges position = {};
  Edges padding = {};
  Edges border = {};
  Dimensions dimensions{CompactValue::ofAuto()};
  Dimensions minDimensions = {};
  Dimensions maxDimensions = {};
  // Yoga specific properties, not compatible with flexbox specification
  ABI35_0_0YGFloatOptional aspectRatio = {};

  ABI35_0_0YGStyle()
      : direction(ABI35_0_0YGDirectionInherit),
        flexDirection(ABI35_0_0YGFlexDirectionColumn),
        justifyContent(ABI35_0_0YGJustifyFlexStart),
        alignContent(ABI35_0_0YGAlignFlexStart),
        alignItems(ABI35_0_0YGAlignStretch),
        alignSelf(ABI35_0_0YGAlignAuto),
        positionType(ABI35_0_0YGPositionTypeRelative),
        flexWrap(ABI35_0_0YGWrapNoWrap),
        overflow(ABI35_0_0YGOverflowVisible),
        display(ABI35_0_0YGDisplayFlex) {}
  ~ABI35_0_0YGStyle() = default;
};

bool operator==(const ABI35_0_0YGStyle& lhs, const ABI35_0_0YGStyle& rhs);
inline bool operator!=(const ABI35_0_0YGStyle& lhs, const ABI35_0_0YGStyle& rhs) {
  return !(lhs == rhs);
}
