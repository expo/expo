/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI44_0_0YGLayout.h"
#include "ABI44_0_0Utils.h"

using namespace ABI44_0_0facebook;

bool ABI44_0_0YGLayout::operator==(ABI44_0_0YGLayout layout) const {
  bool isEqual = ABI44_0_0YGFloatArrayEqual(position, layout.position) &&
      ABI44_0_0YGFloatArrayEqual(dimensions, layout.dimensions) &&
      ABI44_0_0YGFloatArrayEqual(margin, layout.margin) &&
      ABI44_0_0YGFloatArrayEqual(border, layout.border) &&
      ABI44_0_0YGFloatArrayEqual(padding, layout.padding) &&
      direction() == layout.direction() &&
      hadOverflow() == layout.hadOverflow() &&
      lastOwnerDirection == layout.lastOwnerDirection &&
      nextCachedMeasurementsIndex == layout.nextCachedMeasurementsIndex &&
      cachedLayout == layout.cachedLayout &&
      computedFlexBasis == layout.computedFlexBasis;

  for (uint32_t i = 0; i < ABI44_0_0YG_MAX_CACHED_RESULT_COUNT && isEqual; ++i) {
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
