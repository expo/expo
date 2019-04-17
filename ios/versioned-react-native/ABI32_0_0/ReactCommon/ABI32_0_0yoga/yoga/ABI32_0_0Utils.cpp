/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "ABI32_0_0Utils.h"

using namespace facebook;

ABI32_0_0YGFlexDirection ABI32_0_0YGFlexDirectionCross(
    const ABI32_0_0YGFlexDirection flexDirection,
    const ABI32_0_0YGDirection direction) {
  return ABI32_0_0YGFlexDirectionIsColumn(flexDirection)
      ? ABI32_0_0YGResolveFlexDirection(ABI32_0_0YGFlexDirectionRow, direction)
      : ABI32_0_0YGFlexDirectionColumn;
}

float ABI32_0_0YGFloatMax(const float a, const float b) {
  if (!ABI32_0_0yoga::isUndefined(a) && !ABI32_0_0yoga::isUndefined(b)) {
    return fmaxf(a, b);
  }
  return ABI32_0_0yoga::isUndefined(a) ? b : a;
}

float ABI32_0_0YGFloatMin(const float a, const float b) {
  if (!ABI32_0_0yoga::isUndefined(a) && !ABI32_0_0yoga::isUndefined(b)) {
    return fminf(a, b);
  }

  return ABI32_0_0yoga::isUndefined(a) ? b : a;
}

bool ABI32_0_0YGValueEqual(const ABI32_0_0YGValue a, const ABI32_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI32_0_0YGUnitUndefined ||
      (ABI32_0_0yoga::isUndefined(a.value) && ABI32_0_0yoga::isUndefined(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

bool ABI32_0_0YGFloatsEqual(const float a, const float b) {
  if (!ABI32_0_0yoga::isUndefined(a) && !ABI32_0_0yoga::isUndefined(b)) {
    return fabs(a - b) < 0.0001f;
  }
  return ABI32_0_0yoga::isUndefined(a) && ABI32_0_0yoga::isUndefined(b);
}

float ABI32_0_0YGFloatSanitize(const float& val) {
  return ABI32_0_0yoga::isUndefined(val) ? 0 : val;
}

float ABI32_0_0YGUnwrapFloatOptional(const ABI32_0_0YGFloatOptional& op) {
  return op.isUndefined() ? ABI32_0_0YGUndefined : op.getValue();
}

ABI32_0_0YGFloatOptional ABI32_0_0YGFloatOptionalMax(
    const ABI32_0_0YGFloatOptional& op1,
    const ABI32_0_0YGFloatOptional& op2) {
  if (!op1.isUndefined() && !op2.isUndefined()) {
    return op1.getValue() > op2.getValue() ? op1 : op2;
  }
  return op1.isUndefined() ? op2 : op1;
}
