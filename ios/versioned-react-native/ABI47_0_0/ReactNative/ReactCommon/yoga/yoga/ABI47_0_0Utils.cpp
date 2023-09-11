/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0Utils.h"
#include <stdexcept>

using namespace ABI47_0_0facebook;

ABI47_0_0YGFlexDirection ABI47_0_0YGFlexDirectionCross(
    const ABI47_0_0YGFlexDirection flexDirection,
    const ABI47_0_0YGDirection direction) {
  return ABI47_0_0YGFlexDirectionIsColumn(flexDirection)
      ? ABI47_0_0YGResolveFlexDirection(ABI47_0_0YGFlexDirectionRow, direction)
      : ABI47_0_0YGFlexDirectionColumn;
}

float ABI47_0_0YGFloatMax(const float a, const float b) {
  if (!yoga::isUndefined(a) && !yoga::isUndefined(b)) {
    return fmaxf(a, b);
  }
  return yoga::isUndefined(a) ? b : a;
}

float ABI47_0_0YGFloatMin(const float a, const float b) {
  if (!yoga::isUndefined(a) && !yoga::isUndefined(b)) {
    return fminf(a, b);
  }

  return yoga::isUndefined(a) ? b : a;
}

bool ABI47_0_0YGValueEqual(const ABI47_0_0YGValue& a, const ABI47_0_0YGValue& b) {
  if (a.unit != b.unit) {
    return false;
  }

  if (a.unit == ABI47_0_0YGUnitUndefined ||
      (yoga::isUndefined(a.value) && yoga::isUndefined(b.value))) {
    return true;
  }

  return fabs(a.value - b.value) < 0.0001f;
}

bool ABI47_0_0YGFloatsEqual(const float a, const float b) {
  if (!yoga::isUndefined(a) && !yoga::isUndefined(b)) {
    return fabs(a - b) < 0.0001f;
  }
  return yoga::isUndefined(a) && yoga::isUndefined(b);
}

bool ABI47_0_0YGDoubleEqual(const double a, const double b) {
  if (!yoga::isUndefined(a) && !yoga::isUndefined(b)) {
    return fabs(a - b) < 0.0001;
  }
  return yoga::isUndefined(a) && yoga::isUndefined(b);
}

float ABI47_0_0YGFloatSanitize(const float val) {
  return yoga::isUndefined(val) ? 0 : val;
}

ABI47_0_0YGFloatOptional ABI47_0_0YGFloatOptionalMax(ABI47_0_0YGFloatOptional op1, ABI47_0_0YGFloatOptional op2) {
  if (op1 >= op2) {
    return op1;
  }
  if (op2 > op1) {
    return op2;
  }
  return op1.isUndefined() ? op2 : op1;
}

void throwLogicalErrorWithMessage(const char* message) {
  throw std::logic_error(message);
}
