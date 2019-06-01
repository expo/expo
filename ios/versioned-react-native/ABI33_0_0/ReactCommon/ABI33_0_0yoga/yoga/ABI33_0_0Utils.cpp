/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "ABI33_0_0Utils.h"

using namespace facebook;

ABI33_0_0YGFlexDirection ABI33_0_0YGFlexDirectionCross(
    const ABI33_0_0YGFlexDirection flexDirection,
    const ABI33_0_0YGDirection direction) {
  return ABI33_0_0YGFlexDirectionIsColumn(flexDirection)
      ? ABI33_0_0YGResolveFlexDirection(ABI33_0_0YGFlexDirectionRow, direction)
      : ABI33_0_0YGFlexDirectionColumn;
}

float ABI33_0_0YGFloatMax(const float a, const float b) {
  if (!ABI33_0_0yoga::isUndefined(a) && !ABI33_0_0yoga::isUndefined(b)) {
    return fmaxf(a, b);
  }
  return ABI33_0_0yoga::isUndefined(a) ? b : a;
}

float ABI33_0_0YGFloatMin(const float a, const float b) {
  if (!ABI33_0_0yoga::isUndefined(a) && !ABI33_0_0yoga::isUndefined(b)) {
    return fminf(a, b);
  }

  return ABI33_0_0yoga::isUndefined(a) ? b : a;
}

bool ABI33_0_0YGValueEqual(const ABI33_0_0YGValue a, const ABI33_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI33_0_0YGUnitUndefined ||
      (ABI33_0_0yoga::isUndefined(a.value) && ABI33_0_0yoga::isUndefined(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

bool ABI33_0_0YGFloatsEqual(const float a, const float b) {
  if (!ABI33_0_0yoga::isUndefined(a) && !ABI33_0_0yoga::isUndefined(b)) {
    return fabs(a - b) < 0.0001f;
  }
  return ABI33_0_0yoga::isUndefined(a) && ABI33_0_0yoga::isUndefined(b);
}

float ABI33_0_0YGFloatSanitize(const float val) {
  return ABI33_0_0yoga::isUndefined(val) ? 0 : val;
}

ABI33_0_0YGFloatOptional ABI33_0_0YGFloatOptionalMax(ABI33_0_0YGFloatOptional op1, ABI33_0_0YGFloatOptional op2) {
  if (op1 >= op2) {
    return op1;
  }
  if (op2 > op1) {
    return op2;
  }
  return op1.isUndefined() ? op2 : op1;
}
