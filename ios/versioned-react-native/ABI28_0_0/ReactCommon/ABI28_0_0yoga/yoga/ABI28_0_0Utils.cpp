/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI28_0_0Utils.h"

ABI28_0_0YGFlexDirection ABI28_0_0YGFlexDirectionCross(
    const ABI28_0_0YGFlexDirection flexDirection,
    const ABI28_0_0YGDirection direction) {
  return ABI28_0_0YGFlexDirectionIsColumn(flexDirection)
      ? ABI28_0_0YGResolveFlexDirection(ABI28_0_0YGFlexDirectionRow, direction)
      : ABI28_0_0YGFlexDirectionColumn;
}

float ABI28_0_0YGFloatMax(const float a, const float b) {
  if (!ABI28_0_0YGFloatIsUndefined(a) && !ABI28_0_0YGFloatIsUndefined(b)) {
    return fmaxf(a, b);
  }
  return ABI28_0_0YGFloatIsUndefined(a) ? b : a;
}

float ABI28_0_0YGFloatMin(const float a, const float b) {
  if (!ABI28_0_0YGFloatIsUndefined(a) && !ABI28_0_0YGFloatIsUndefined(b)) {
    return fminf(a, b);
  }

  return ABI28_0_0YGFloatIsUndefined(a) ? b : a;
}

bool ABI28_0_0YGValueEqual(const ABI28_0_0YGValue a, const ABI28_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI28_0_0YGUnitUndefined ||
      (ABI28_0_0YGFloatIsUndefined(a.value) && ABI28_0_0YGFloatIsUndefined(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

bool ABI28_0_0YGFloatsEqual(const float a, const float b) {
  if (!ABI28_0_0YGFloatIsUndefined(a) && !ABI28_0_0YGFloatIsUndefined(b)) {
    return fabs(a - b) < 0.0001f;
  }
  return ABI28_0_0YGFloatIsUndefined(a) && ABI28_0_0YGFloatIsUndefined(b);
}
