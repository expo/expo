// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once
#ifdef __cplusplus

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

namespace jsi = ABI47_0_0facebook::jsi;

namespace ABI47_0_0expo {

/**
 Converts `jsi::Array` to a vector with prop name ids (`std::vector<jsi::PropNameID>`).
 */
std::vector<jsi::PropNameID> jsiArrayToPropNameIdsVector(jsi::Runtime &runtime, const jsi::Array &array);

} // namespace ABI47_0_0expo

#endif // __cplusplus
