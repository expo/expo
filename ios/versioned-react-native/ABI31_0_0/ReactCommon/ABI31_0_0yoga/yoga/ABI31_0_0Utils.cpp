/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "ABI31_0_0Utils.h"

using namespace facebook;

ABI31_0_0YGFlexDirection ABI31_0_0YGFlexDirectionCross(
    const ABI31_0_0YGFlexDirection flexDirection,
    const ABI31_0_0YGDirection direction) {
  return ABI31_0_0YGFlexDirectionIsColumn(flexDirection)
      ? ABI31_0_0YGResolveFlexDirection(ABI31_0_0YGFlexDirectionRow, direction)
      : ABI31_0_0YGFlexDirectionColumn;
}

float ABI31_0_0YGFloatMax(const float a, const float b) {
  if (!yoga::isUndefined(a) && !yoga::isUndefined(b)) {
    return fmaxf(a, b);
  }
  return yoga::isUndefined(a) ? b : a;
}

float ABI31_0_0YGFloatMin(const float a, const float b) {
  if (!yoga::isUndefined(a) && !yoga::isUndefined(b)) {
    return fminf(a, b);
  }

  return yoga::isUndefined(a) ? b : a;
}

bool ABI31_0_0YGValueEqual(const ABI31_0_0YGValue a, const ABI31_0_0YGValue b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI31_0_0YGUnitUndefined ||
      (yoga::isUndefined(a.value) && yoga::isUndefined(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

bool ABI31_0_0YGFloatsEqual(const float a, const float b) {
  if (!yoga::isUndefined(a) && !yoga::isUndefined(b)) {
    return fabs(a - b) < 0.0001f;
  }
  return yoga::isUndefined(a) && yoga::isUndefined(b);
}

float ABI31_0_0YGFloatSanitize(const float& val) {
  return yoga::isUndefined(val) ? 0 : val;
}

float ABI31_0_0YGUnwrapFloatOptional(const ABI31_0_0YGFloatOptional& op) {
  return op.isUndefined() ? ABI31_0_0YGUndefined : op.getValue();
}

ABI31_0_0YGFloatOptional ABI31_0_0YGFloatOptionalMax(
    const ABI31_0_0YGFloatOptional& op1,
    const ABI31_0_0YGFloatOptional& op2) {
  if (!op1.isUndefined() && !op2.isUndefined()) {
    return op1.getValue() > op2.getValue() ? op1 : op2;
  }
  return op1.isUndefined() ? op2 : op1;
}
