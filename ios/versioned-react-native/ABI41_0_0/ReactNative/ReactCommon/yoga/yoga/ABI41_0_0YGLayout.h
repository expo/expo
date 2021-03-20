/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include "ABI41_0_0BitUtils.h"
#include "ABI41_0_0YGFloatOptional.h"
#include "ABI41_0_0Yoga-internal.h"

using namespace ABI41_0_0facebook::yoga;

struct ABI41_0_0YGLayout {
  std::array<float, 4> position = {};
  std::array<float, 2> dimensions = {{ABI41_0_0YGUndefined, ABI41_0_0YGUndefined}};
  std::array<float, 4> margin = {};
  std::array<float, 4> border = {};
  std::array<float, 4> padding = {};

private:
  static constexpr size_t directionOffset = 0;
  static constexpr size_t didUseLegacyFlagOffset =
      directionOffset + ABI41_0_0facebook::yoga::detail::bitWidthFn<ABI41_0_0YGDirection>();
  static constexpr size_t doesLegacyStretchFlagAffectsLayoutOffset =
      didUseLegacyFlagOffset + 1;
  static constexpr size_t hadOverflowOffset =
      doesLegacyStretchFlagAffectsLayoutOffset + 1;
  uint8_t flags = 0;

public:
  uint32_t computedFlexBasisGeneration = 0;
  ABI41_0_0YGFloatOptional computedFlexBasis = {};

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  uint32_t generationCount = 0;
  ABI41_0_0YGDirection lastOwnerDirection = (ABI41_0_0YGDirection) -1;

  uint32_t nextCachedMeasurementsIndex = 0;
  std::array<ABI41_0_0YGCachedMeasurement, ABI41_0_0YG_MAX_CACHED_RESULT_COUNT>
      cachedMeasurements = {};
  std::array<float, 2> measuredDimensions = {{ABI41_0_0YGUndefined, ABI41_0_0YGUndefined}};

  ABI41_0_0YGCachedMeasurement cachedLayout = ABI41_0_0YGCachedMeasurement();

  ABI41_0_0YGDirection direction() const {
    return ABI41_0_0facebook::yoga::detail::getEnumData<ABI41_0_0YGDirection>(
        flags, directionOffset);
  }

  void setDirection(ABI41_0_0YGDirection direction) {
    ABI41_0_0facebook::yoga::detail::setEnumData<ABI41_0_0YGDirection>(
        flags, directionOffset, direction);
  }

  bool didUseLegacyFlag() const {
    return ABI41_0_0facebook::yoga::detail::getBooleanData(
        flags, didUseLegacyFlagOffset);
  }

  void setDidUseLegacyFlag(bool val) {
    ABI41_0_0facebook::yoga::detail::setBooleanData(flags, didUseLegacyFlagOffset, val);
  }

  bool doesLegacyStretchFlagAffectsLayout() const {
    return ABI41_0_0facebook::yoga::detail::getBooleanData(
        flags, doesLegacyStretchFlagAffectsLayoutOffset);
  }

  void setDoesLegacyStretchFlagAffectsLayout(bool val) {
    ABI41_0_0facebook::yoga::detail::setBooleanData(
        flags, doesLegacyStretchFlagAffectsLayoutOffset, val);
  }

  bool hadOverflow() const {
    return ABI41_0_0facebook::yoga::detail::getBooleanData(flags, hadOverflowOffset);
  }
  void setHadOverflow(bool hadOverflow) {
    ABI41_0_0facebook::yoga::detail::setBooleanData(
        flags, hadOverflowOffset, hadOverflow);
  }

  bool operator==(ABI41_0_0YGLayout layout) const;
  bool operator!=(ABI41_0_0YGLayout layout) const { return !(*this == layout); }
};
