/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once
#include "ABI31_0_0YGFloatOptional.h"
#include "ABI31_0_0Yoga-internal.h"

struct ABI31_0_0YGLayout {
  std::array<float, 4> position;
  std::array<float, 2> dimensions;
  std::array<float, 6> margin;
  std::array<float, 6> border;
  std::array<float, 6> padding;
  ABI31_0_0YGDirection direction;

  uint32_t computedFlexBasisGeneration;
  ABI31_0_0YGFloatOptional computedFlexBasis;
  bool hadOverflow;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI31_0_0YGDirection lastOwnerDirection;

  uint32_t nextCachedMeasurementsIndex;
  std::array<ABI31_0_0YGCachedMeasurement, ABI31_0_0YG_MAX_CACHED_RESULT_COUNT>
      cachedMeasurements;
  std::array<float, 2> measuredDimensions;

  ABI31_0_0YGCachedMeasurement cachedLayout;
  bool didUseLegacyFlag;
  bool doesLegacyStretchFlagAffectsLayout;

  ABI31_0_0YGLayout();

  bool operator==(ABI31_0_0YGLayout layout) const;
  bool operator!=(ABI31_0_0YGLayout layout) const {
    return !(*this == layout);
  }
};
