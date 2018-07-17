/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI29_0_0YGLayout.h"
#include "ABI29_0_0Utils.h"

const std::array<float, 2> kABI29_0_0YGDefaultDimensionValues = {
    {ABI29_0_0YGUndefined, ABI29_0_0YGUndefined}};

ABI29_0_0YGLayout::ABI29_0_0YGLayout()
    : position(),
      dimensions(kABI29_0_0YGDefaultDimensionValues),
      margin(),
      border(),
      padding(),
      direction(ABI29_0_0YGDirectionInherit),
      computedFlexBasisGeneration(0),
      computedFlexBasis(ABI29_0_0YGUndefined),
      hadOverflow(false),
      generationCount(0),
      lastParentDirection((ABI29_0_0YGDirection)-1),
      nextCachedMeasurementsIndex(0),
      cachedMeasurements(),
      measuredDimensions(kABI29_0_0YGDefaultDimensionValues),
      cachedLayout(ABI29_0_0YGCachedMeasurement()),
      didUseLegacyFlag(false),
      doesLegacyStretchFlagAffectsLayout(false) {}

bool ABI29_0_0YGLayout::operator==(ABI29_0_0YGLayout layout) const {
  bool isEqual = ABI29_0_0YGFloatArrayEqual(position, layout.position) &&
      ABI29_0_0YGFloatArrayEqual(dimensions, layout.dimensions) &&
      ABI29_0_0YGFloatArrayEqual(margin, layout.margin) &&
      ABI29_0_0YGFloatArrayEqual(border, layout.border) &&
      ABI29_0_0YGFloatArrayEqual(padding, layout.padding) &&
      direction == layout.direction && hadOverflow == layout.hadOverflow &&
      lastParentDirection == layout.lastParentDirection &&
      nextCachedMeasurementsIndex == layout.nextCachedMeasurementsIndex &&
      cachedLayout == layout.cachedLayout;

  for (uint32_t i = 0; i < ABI29_0_0YG_MAX_CACHED_RESULT_COUNT && isEqual; ++i) {
    isEqual = isEqual && cachedMeasurements[i] == layout.cachedMeasurements[i];
  }

  if (!ABI29_0_0YGFloatIsUndefined(computedFlexBasis) ||
      !ABI29_0_0YGFloatIsUndefined(layout.computedFlexBasis)) {
    isEqual = isEqual && (computedFlexBasis == layout.computedFlexBasis);
  }
  if (!ABI29_0_0YGFloatIsUndefined(measuredDimensions[0]) ||
      !ABI29_0_0YGFloatIsUndefined(layout.measuredDimensions[0])) {
    isEqual =
        isEqual && (measuredDimensions[0] == layout.measuredDimensions[0]);
  }
  if (!ABI29_0_0YGFloatIsUndefined(measuredDimensions[1]) ||
      !ABI29_0_0YGFloatIsUndefined(layout.measuredDimensions[1])) {
    isEqual =
        isEqual && (measuredDimensions[1] == layout.measuredDimensions[1]);
  }

  return isEqual;
}

bool ABI29_0_0YGLayout::operator!=(ABI29_0_0YGLayout layout) const {
  return !(*this == layout);
}
