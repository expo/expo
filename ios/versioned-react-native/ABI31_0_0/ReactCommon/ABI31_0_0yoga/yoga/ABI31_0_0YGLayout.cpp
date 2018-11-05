/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "ABI31_0_0YGLayout.h"
#include "ABI31_0_0Utils.h"

using namespace facebook;

const std::array<float, 2> kABI31_0_0YGDefaultDimensionValues = {
    {ABI31_0_0YGUndefined, ABI31_0_0YGUndefined}};

ABI31_0_0YGLayout::ABI31_0_0YGLayout()
    : position(),
      dimensions(kABI31_0_0YGDefaultDimensionValues),
      margin(),
      border(),
      padding(),
      direction(ABI31_0_0YGDirectionInherit),
      computedFlexBasisGeneration(0),
      computedFlexBasis(ABI31_0_0YGFloatOptional()),
      hadOverflow(false),
      generationCount(0),
      lastOwnerDirection((ABI31_0_0YGDirection)-1),
      nextCachedMeasurementsIndex(0),
      cachedMeasurements(),
      measuredDimensions(kABI31_0_0YGDefaultDimensionValues),
      cachedLayout(ABI31_0_0YGCachedMeasurement()),
      didUseLegacyFlag(false),
      doesLegacyStretchFlagAffectsLayout(false) {}

bool ABI31_0_0YGLayout::operator==(ABI31_0_0YGLayout layout) const {
  bool isEqual = ABI31_0_0YGFloatArrayEqual(position, layout.position) &&
      ABI31_0_0YGFloatArrayEqual(dimensions, layout.dimensions) &&
      ABI31_0_0YGFloatArrayEqual(margin, layout.margin) &&
      ABI31_0_0YGFloatArrayEqual(border, layout.border) &&
      ABI31_0_0YGFloatArrayEqual(padding, layout.padding) &&
      direction == layout.direction && hadOverflow == layout.hadOverflow &&
      lastOwnerDirection == layout.lastOwnerDirection &&
      nextCachedMeasurementsIndex == layout.nextCachedMeasurementsIndex &&
      cachedLayout == layout.cachedLayout &&
      computedFlexBasis == layout.computedFlexBasis;

  for (uint32_t i = 0; i < ABI31_0_0YG_MAX_CACHED_RESULT_COUNT && isEqual; ++i) {
    isEqual = isEqual && cachedMeasurements[i] == layout.cachedMeasurements[i];
  }

  if (!yoga::isUndefined(measuredDimensions[0]) ||
      !yoga::isUndefined(layout.measuredDimensions[0])) {
    isEqual =
        isEqual && (measuredDimensions[0] == layout.measuredDimensions[0]);
  }
  if (!yoga::isUndefined(measuredDimensions[1]) ||
      !yoga::isUndefined(layout.measuredDimensions[1])) {
    isEqual =
        isEqual && (measuredDimensions[1] == layout.measuredDimensions[1]);
  }

  return isEqual;
}
