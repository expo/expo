/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include "ABI34_0_0YGFloatOptional.h"
#include "ABI34_0_0Yoga-internal.h"

constexpr std::array<float, 2> kABI34_0_0YGDefaultDimensionValues = {
    {ABI34_0_0YGUndefined, ABI34_0_0YGUndefined}};

struct ABI34_0_0YGLayout {
  std::array<float, 4> position = {};
  std::array<float, 2> dimensions = kABI34_0_0YGDefaultDimensionValues;
  std::array<float, 6> margin = {};
  std::array<float, 6> border = {};
  std::array<float, 6> padding = {};
  ABI34_0_0YGDirection direction : 2;
  bool didUseLegacyFlag : 1;
  bool doesLegacyStretchFlagAffectsLayout : 1;
  bool hadOverflow : 1;

  uint32_t computedFlexBasisGeneration = 0;
  ABI34_0_0YGFloatOptional computedFlexBasis = {};

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  uint32_t generationCount = 0;
  ABI34_0_0YGDirection lastOwnerDirection = (ABI34_0_0YGDirection) -1;

  uint32_t nextCachedMeasurementsIndex = 0;
  std::array<ABI34_0_0YGCachedMeasurement, ABI34_0_0YG_MAX_CACHED_RESULT_COUNT>
      cachedMeasurements = {};
  std::array<float, 2> measuredDimensions = kABI34_0_0YGDefaultDimensionValues;

  ABI34_0_0YGCachedMeasurement cachedLayout = ABI34_0_0YGCachedMeasurement();

  ABI34_0_0YGLayout()
      : direction(ABI34_0_0YGDirectionInherit),
        didUseLegacyFlag(false),
        doesLegacyStretchFlagAffectsLayout(false),
        hadOverflow(false) {}

  bool operator==(ABI34_0_0YGLayout layout) const;
  bool operator!=(ABI34_0_0YGLayout layout) const {
    return !(*this == layout);
  }
};
