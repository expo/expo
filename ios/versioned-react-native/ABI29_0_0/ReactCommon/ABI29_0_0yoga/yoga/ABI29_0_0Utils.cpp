/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI29_0_0Utils.h"

ABI29_0_0YGFlexDirection ABI29_0_0YGFlexDirectionCross(
    const ABI29_0_0YGFlexDirection flexDirection,
    const ABI29_0_0YGDirection direction) {
  return ABI29_0_0YGFlexDirectionIsColumn(flexDirection)
      ? ABI29_0_0YGResolveFlexDirection(ABI29_0_0YGFlexDirectionRow, direction)
      : ABI29_0_0YGFlexDirectionColumn;
}

float ABI29_0_0YGFloatMax(const float a, const float b) {
  if (!ABI29_0_0YGFloatIsUndefined(a) && !ABI29_0_0YGFloatIsUndefined(b)) {
    return fmaxf(a, b);
  }
  return ABI29_0_0YGFloatIsUndefined(a) ? b : a;
}

float ABI29_0_0YGFloatMin(const float a, const float b) {
  if (!ABI29_0_0YGFloatIsUndefined(a) && !ABI29_0_0YGFloatIsUndefined(b)) {
    return fminf(a, b);
  }

  return ABI29_0_0YGFloatIsUndefined(a) ? b : a;
}

bool ABI29_0_0YGValueEqual(const ABI29_0_0YGValue a, const ABI29_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI29_0_0YGUnitUndefined ||
      (ABI29_0_0YGFloatIsUndefined(a.value) && ABI29_0_0YGFloatIsUndefined(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

bool ABI29_0_0YGFloatsEqual(const float a, const float b) {
  if (!ABI29_0_0YGFloatIsUndefined(a) && !ABI29_0_0YGFloatIsUndefined(b)) {
    return fabs(a - b) < 0.0001f;
  }
  return ABI29_0_0YGFloatIsUndefined(a) && ABI29_0_0YGFloatIsUndefined(b);
}
