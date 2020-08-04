/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <math.h>
#include "ABI37_0_0YGEnums.h"
#include "ABI37_0_0YGMacros.h"

ABI37_0_0YG_EXTERN_C_BEGIN

// Not defined in MSVC++
#ifndef NAN
static const uint32_t __nan = 0x7fc00000;
#define NAN (*(const float*) __nan)
#endif

#define ABI37_0_0YGUndefined NAN

typedef struct ABI37_0_0YGValue {
  float value;
  ABI37_0_0YGUnit unit;
} ABI37_0_0YGValue;

extern const ABI37_0_0YGValue ABI37_0_0YGValueAuto;
extern const ABI37_0_0YGValue ABI37_0_0YGValueUndefined;
extern const ABI37_0_0YGValue ABI37_0_0YGValueZero;

ABI37_0_0YG_EXTERN_C_END

#ifdef __cplusplus

inline bool operator==(const ABI37_0_0YGValue& lhs, const ABI37_0_0YGValue& rhs) {
  if (lhs.unit != rhs.unit) {
    return false;
  }

  switch (lhs.unit) {
    case ABI37_0_0YGUnitUndefined:
    case ABI37_0_0YGUnitAuto:
      return true;
    case ABI37_0_0YGUnitPoint:
    case ABI37_0_0YGUnitPercent:
      return lhs.value == rhs.value;
  }

  return false;
}

inline bool operator!=(const ABI37_0_0YGValue& lhs, const ABI37_0_0YGValue& rhs) {
  return !(lhs == rhs);
}

inline ABI37_0_0YGValue operator-(const ABI37_0_0YGValue& value) {
  return {-value.value, value.unit};
}

namespace ABI37_0_0facebook {
namespace yoga {
namespace literals {

inline ABI37_0_0YGValue operator"" _pt(long double value) {
  return ABI37_0_0YGValue{static_cast<float>(value), ABI37_0_0YGUnitPoint};
}
inline ABI37_0_0YGValue operator"" _pt(unsigned long long value) {
  return operator"" _pt(static_cast<long double>(value));
}

inline ABI37_0_0YGValue operator"" _percent(long double value) {
  return ABI37_0_0YGValue{static_cast<float>(value), ABI37_0_0YGUnitPercent};
}
inline ABI37_0_0YGValue operator"" _percent(unsigned long long value) {
  return operator"" _percent(static_cast<long double>(value));
}

} // namespace literals
} // namespace yoga
} // namespace ABI37_0_0facebook

#endif
