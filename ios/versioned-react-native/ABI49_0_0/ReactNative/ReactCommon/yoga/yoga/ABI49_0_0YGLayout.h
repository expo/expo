/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef __cplusplus

#include "ABI49_0_0BitUtils.h"
#include "ABI49_0_0YGFloatOptional.h"
#include "ABI49_0_0Yoga-internal.h"

struct ABI49_0_0YGLayout {
  std::array<float, 4> position = {};
  std::array<float, 2> dimensions = {{ABI49_0_0YGUndefined, ABI49_0_0YGUndefined}};
  std::array<float, 4> margin = {};
  std::array<float, 4> border = {};
  std::array<float, 4> padding = {};

private:
  static constexpr size_t directionOffset = 0;
  static constexpr size_t hadOverflowOffset =
      directionOffset + ABI49_0_0facebook::yoga::detail::bitWidthFn<ABI49_0_0YGDirection>();
  uint8_t flags = 0;

public:
  uint32_t computedFlexBasisGeneration = 0;
  ABI49_0_0YGFloatOptional computedFlexBasis = {};

  // Instead of recomputing the entire layout every single time, we cache some
  // information to break early when nothing changed
  uint32_t generationCount = 0;
  ABI49_0_0YGDirection lastOwnerDirection = ABI49_0_0YGDirectionInherit;

  uint32_t nextCachedMeasurementsIndex = 0;
  std::array<ABI49_0_0YGCachedMeasurement, ABI49_0_0YG_MAX_CACHED_RESULT_COUNT>
      cachedMeasurements = {};
  std::array<float, 2> measuredDimensions = {{ABI49_0_0YGUndefined, ABI49_0_0YGUndefined}};

  ABI49_0_0YGCachedMeasurement cachedLayout = ABI49_0_0YGCachedMeasurement();

  ABI49_0_0YGDirection direction() const {
    return ABI49_0_0facebook::yoga::detail::getEnumData<ABI49_0_0YGDirection>(
        flags, directionOffset);
  }

  void setDirection(ABI49_0_0YGDirection direction) {
    ABI49_0_0facebook::yoga::detail::setEnumData<ABI49_0_0YGDirection>(
        flags, directionOffset, direction);
  }

  bool hadOverflow() const {
    return ABI49_0_0facebook::yoga::detail::getBooleanData(flags, hadOverflowOffset);
  }
  void setHadOverflow(bool hadOverflow) {
    ABI49_0_0facebook::yoga::detail::setBooleanData(
        flags, hadOverflowOffset, hadOverflow);
  }

  bool operator==(ABI49_0_0YGLayout layout) const;
  bool operator!=(ABI49_0_0YGLayout layout) const { return !(*this == layout); }
};

#endif
