/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ABI29_0_0YGNode.h"
#include "ABI29_0_0Yoga-internal.h"

// This struct is an helper model to hold the data for step 4 of flexbox
// algo, which is collecting the flex items in a line.
//
// - itemsOnLine: Number of items which can fit in a line considering the
// available Inner dimension, the flex items computed flexbasis and their
// margin. It may be different than the difference between start and end
// indicates because we skip over absolute-positioned items.
//
// - sizeConsumedOnCurrentLine: It is accumulation of the dimensions and margin
// of all the children on the current line. This will be used in order to either
// set the dimensions of the node if none already exist or to compute the
// remaining space left for the flexible children.
//
// - totalFlexGrowFactors: total flex grow factors of flex items which are to be
// layed in the current line
//
// - totalFlexShrinkFactors: total flex shrink factors of flex items which are
// to be layed in the current line
//
// - endOfLineIndex: Its the end index of the last flex item which was examined
// and it may or may not be part of the current line(as it may be absolutely
// positioned or inculding it may have caused to overshoot availableInnerDim)
//
// - relativeChildren: Maintain a vector of the child nodes that can shrink
// and/or grow.

struct ABI29_0_0YGCollectFlexItemsRowValues {
  uint32_t itemsOnLine;
  float sizeConsumedOnCurrentLine;
  float totalFlexGrowFactors;
  float totalFlexShrinkScaledFactors;
  float endOfLineIndex;
  std::vector<ABI29_0_0YGNodeRef> relativeChildren;
  float remainingFreeSpace;
  // The size of the mainDim for the row after considering size, padding, margin
  // and border of flex items. This is used to calculate maxLineDim after going
  // through all the rows to decide on the main axis size of parent.
  float mainDim;
  // The size of the crossDim for the row after considering size, padding,
  // margin and border of flex items. Used for calculating containers crossSize.
  float crossDim;
};

bool ABI29_0_0YGValueEqual(const ABI29_0_0YGValue a, const ABI29_0_0YGValue b);

// This custom float equality function returns true if either absolute
// difference between two floats is less than 0.0001f or both are undefined.
bool ABI29_0_0YGFloatsEqual(const float a, const float b);

// We need custom max function, since we want that, if one argument is
// ABI29_0_0YGUndefined then the max funtion should return the other argument as the max
// value. We wouldn't have needed a custom max function if ABI29_0_0YGUndefined was NAN
// as fmax has the same behaviour, but with NAN we cannot use `-ffast-math`
// compiler flag.
float ABI29_0_0YGFloatMax(const float a, const float b);

// We need custom min function, since we want that, if one argument is
// ABI29_0_0YGUndefined then the min funtion should return the other argument as the min
// value. We wouldn't have needed a custom min function if ABI29_0_0YGUndefined was NAN
// as fmin has the same behaviour, but with NAN we cannot use `-ffast-math`
// compiler flag.
float ABI29_0_0YGFloatMin(const float a, const float b);

// This custom float comparision function compares the array of float with
// ABI29_0_0YGFloatsEqual, as the default float comparision operator will not work(Look
// at the comments of ABI29_0_0YGFloatsEqual function).
template <std::size_t size>
bool ABI29_0_0YGFloatArrayEqual(
    const std::array<float, size>& val1,
    const std::array<float, size>& val2) {
  bool areEqual = true;
  for (std::size_t i = 0; i < size && areEqual; ++i) {
    areEqual = ABI29_0_0YGFloatsEqual(val1[i], val2[i]);
  }
  return areEqual;
}

ABI29_0_0YGFlexDirection ABI29_0_0YGFlexDirectionCross(
    const ABI29_0_0YGFlexDirection flexDirection,
    const ABI29_0_0YGDirection direction);

inline bool ABI29_0_0YGFlexDirectionIsRow(const ABI29_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI29_0_0YGFlexDirectionRow ||
      flexDirection == ABI29_0_0YGFlexDirectionRowReverse;
}

inline float ABI29_0_0YGResolveValue(const ABI29_0_0YGValue value, const float parentSize) {
  switch (value.unit) {
    case ABI29_0_0YGUnitUndefined:
    case ABI29_0_0YGUnitAuto:
      return ABI29_0_0YGUndefined;
    case ABI29_0_0YGUnitPoint:
      return value.value;
    case ABI29_0_0YGUnitPercent:
      return value.value * parentSize * 0.01;
  }
  return ABI29_0_0YGUndefined;
}

inline bool ABI29_0_0YGFlexDirectionIsColumn(const ABI29_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI29_0_0YGFlexDirectionColumn ||
      flexDirection == ABI29_0_0YGFlexDirectionColumnReverse;
}

inline ABI29_0_0YGFlexDirection ABI29_0_0YGResolveFlexDirection(
    const ABI29_0_0YGFlexDirection flexDirection,
    const ABI29_0_0YGDirection direction) {
  if (direction == ABI29_0_0YGDirectionRTL) {
    if (flexDirection == ABI29_0_0YGFlexDirectionRow) {
      return ABI29_0_0YGFlexDirectionRowReverse;
    } else if (flexDirection == ABI29_0_0YGFlexDirectionRowReverse) {
      return ABI29_0_0YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static inline float ABI29_0_0YGResolveValueMargin(
    const ABI29_0_0YGValue value,
    const float parentSize) {
  return value.unit == ABI29_0_0YGUnitAuto ? 0 : ABI29_0_0YGResolveValue(value, parentSize);
}
