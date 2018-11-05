/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include "ABI26_0_0YGNode.h"
#include "ABI26_0_0Yoga-internal.h"

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

struct ABI26_0_0YGCollectFlexItemsRowValues {
  uint32_t itemsOnLine;
  float sizeConsumedOnCurrentLine;
  float totalFlexGrowFactors;
  float totalFlexShrinkScaledFactors;
  float endOfLineIndex;
  std::vector<ABI26_0_0YGNodeRef> relativeChildren;
  float remainingFreeSpace;
  // The size of the mainDim for the row after considering size, padding, margin
  // and border of flex items. This is used to calculate maxLineDim after going
  // through all the rows to decide on the main axis size of parent.
  float mainDim;
  // The size of the crossDim for the row after considering size, padding,
  // margin and border of flex items. Used for calculating containers crossSize.
  float crossDim;
};

bool ABI26_0_0YGValueEqual(const ABI26_0_0YGValue a, const ABI26_0_0YGValue b);

ABI26_0_0YGFlexDirection ABI26_0_0YGFlexDirectionCross(
    const ABI26_0_0YGFlexDirection flexDirection,
    const ABI26_0_0YGDirection direction);

inline bool ABI26_0_0YGFlexDirectionIsRow(const ABI26_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI26_0_0YGFlexDirectionRow ||
      flexDirection == ABI26_0_0YGFlexDirectionRowReverse;
}

inline float ABI26_0_0YGResolveValue(const ABI26_0_0YGValue value, const float parentSize) {
  switch (value.unit) {
    case ABI26_0_0YGUnitUndefined:
    case ABI26_0_0YGUnitAuto:
      return ABI26_0_0YGUndefined;
    case ABI26_0_0YGUnitPoint:
      return value.value;
    case ABI26_0_0YGUnitPercent:
      return value.value * parentSize / 100.0f;
  }
  return ABI26_0_0YGUndefined;
}

inline bool ABI26_0_0YGFlexDirectionIsColumn(const ABI26_0_0YGFlexDirection flexDirection) {
  return flexDirection == ABI26_0_0YGFlexDirectionColumn ||
      flexDirection == ABI26_0_0YGFlexDirectionColumnReverse;
}

inline ABI26_0_0YGFlexDirection ABI26_0_0YGResolveFlexDirection(
    const ABI26_0_0YGFlexDirection flexDirection,
    const ABI26_0_0YGDirection direction) {
  if (direction == ABI26_0_0YGDirectionRTL) {
    if (flexDirection == ABI26_0_0YGFlexDirectionRow) {
      return ABI26_0_0YGFlexDirectionRowReverse;
    } else if (flexDirection == ABI26_0_0YGFlexDirectionRowReverse) {
      return ABI26_0_0YGFlexDirectionRow;
    }
  }

  return flexDirection;
}

static inline float ABI26_0_0YGResolveValueMargin(
    const ABI26_0_0YGValue value,
    const float parentSize) {
  return value.unit == ABI26_0_0YGUnitAuto ? 0 : ABI26_0_0YGResolveValue(value, parentSize);
}
