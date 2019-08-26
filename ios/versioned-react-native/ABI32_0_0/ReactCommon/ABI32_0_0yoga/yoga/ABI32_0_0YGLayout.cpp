/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "ABI32_0_0YGLayout.h"
#include "ABI32_0_0Utils.h"

using namespace facebook;

const std::array<float, 2> kABI32_0_0YGDefaultDimensionValues = {
    {ABI32_0_0YGUndefined, ABI32_0_0YGUndefined}};

ABI32_0_0YGLayout::ABI32_0_0YGLayout()
    : position(),
      dimensions(kABI32_0_0YGDefaultDimensionValues),
      margin(),
      border(),
      padding(),
      direction(ABI32_0_0YGDirectionInherit),
      computedFlexBasisGeneration(0),
      computedFlexBasis(ABI32_0_0YGFloatOptional()),
      hadOverflow(false),
      generationCount(0),
      lastOwnerDirection((ABI32_0_0YGDirection)-1),
      nextCachedMeasurementsIndex(0),
      cachedMeasurements(),
      measuredDimensions(kABI32_0_0YGDefaultDimensionValues),
      cachedLayout(ABI32_0_0YGCachedMeasurement()),
      didUseLegacyFlag(false),
      doesLegacyStretchFlagAffectsLayout(false) {}

bool ABI32_0_0YGLayout::operator==(ABI32_0_0YGLayout layout) const {
  bool isEqual = ABI32_0_0YGFloatArrayEqual(position, layout.position) &&
      ABI32_0_0YGFloatArrayEqual(dimensions, layout.dimensions) &&
      ABI32_0_0YGFloatArrayEqual(margin, layout.margin) &&
      ABI32_0_0YGFloatArrayEqual(border, layout.border) &&
      ABI32_0_0YGFloatArrayEqual(padding, layout.padding) &&
      direction == layout.direction && hadOverflow == layout.hadOverflow &&
      lastOwnerDirection == layout.lastOwnerDirection &&
      nextCachedMeasurementsIndex == layout.nextCachedMeasurementsIndex &&
      cachedLayout == layout.cachedLayout &&
      computedFlexBasis == layout.computedFlexBasis;

  for (uint32_t i = 0; i < ABI32_0_0YG_MAX_CACHED_RESULT_COUNT && isEqual; ++i) {
    isEqual = isEqual && cachedMeasurements[i] == layout.cachedMeasurements[i];
  }

  if (!ABI32_0_0yoga::isUndefined(measuredDimensions[0]) ||
      !ABI32_0_0yoga::isUndefined(layout.measuredDimensions[0])) {
    isEqual =
        isEqual && (measuredDimensions[0] == layout.measuredDimensions[0]);
  }
  if (!ABI32_0_0yoga::isUndefined(measuredDimensions[1]) ||
      !ABI32_0_0yoga::isUndefined(layout.measuredDimensions[1])) {
    isEqual =
        isEqual && (measuredDimensions[1] == layout.measuredDimensions[1]);
  }

  return isEqual;
}
