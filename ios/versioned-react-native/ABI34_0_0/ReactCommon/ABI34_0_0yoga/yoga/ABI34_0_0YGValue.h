/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <math.h>
#include "ABI34_0_0YGEnums.h"
#include "ABI34_0_0YGMacros.h"

ABI34_0_0YG_EXTERN_C_BEGIN

// Not defined in MSVC++
#ifndef NAN
static const uint32_t __nan = 0x7fc00000;
#define NAN (*(const float*) __nan)
#endif

#define ABI34_0_0YGUndefined NAN

typedef struct ABI34_0_0YGValue {
  float value;
  ABI34_0_0YGUnit unit;
} ABI34_0_0YGValue;

extern const ABI34_0_0YGValue ABI34_0_0YGValueAuto;
extern const ABI34_0_0YGValue ABI34_0_0YGValueUndefined;
extern const ABI34_0_0YGValue ABI34_0_0YGValueZero;

ABI34_0_0YG_EXTERN_C_END

#ifdef __cplusplus

inline bool operator==(const ABI34_0_0YGValue& lhs, const ABI34_0_0YGValue& rhs) {
  if (lhs.unit != rhs.unit) {
    return false;
  }

  switch (lhs.unit) {
    case ABI34_0_0YGUnitUndefined:
    case ABI34_0_0YGUnitAuto:
      return true;
    case ABI34_0_0YGUnitPoint:
    case ABI34_0_0YGUnitPercent:
      return lhs.value == rhs.value;
  }

  return false;
}

inline bool operator!=(const ABI34_0_0YGValue& lhs, const ABI34_0_0YGValue& rhs) {
  return !(lhs == rhs);
}

inline ABI34_0_0YGValue operator-(const ABI34_0_0YGValue& value) {
  return {-value.value, value.unit};
}

namespace facebook {
namespace ABI34_0_0yoga {
namespace literals {

inline ABI34_0_0YGValue operator"" _pt(long double value) {
  return ABI34_0_0YGValue{static_cast<float>(value), ABI34_0_0YGUnitPoint};
}
inline ABI34_0_0YGValue operator"" _pt(unsigned long long value) {
  return operator"" _pt(static_cast<long double>(value));
}

inline ABI34_0_0YGValue operator"" _percent(long double value) {
  return ABI34_0_0YGValue{static_cast<float>(value), ABI34_0_0YGUnitPercent};
}
inline ABI34_0_0YGValue operator"" _percent(unsigned long long value) {
  return operator"" _percent(static_cast<long double>(value));
}

} // namespace literals
} // namespace ABI34_0_0yoga
} // namespace facebook

#endif
