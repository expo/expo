/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI26_0_0Utils.h"

ABI26_0_0YGFlexDirection ABI26_0_0YGFlexDirectionCross(
    const ABI26_0_0YGFlexDirection flexDirection,
    const ABI26_0_0YGDirection direction) {
  return ABI26_0_0YGFlexDirectionIsColumn(flexDirection)
      ? ABI26_0_0YGResolveFlexDirection(ABI26_0_0YGFlexDirectionRow, direction)
      : ABI26_0_0YGFlexDirectionColumn;
}

bool ABI26_0_0YGValueEqual(const ABI26_0_0YGValue a, const ABI26_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI26_0_0YGUnitUndefined ||
      (std::isnan(a.value) && std::isnan(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}
