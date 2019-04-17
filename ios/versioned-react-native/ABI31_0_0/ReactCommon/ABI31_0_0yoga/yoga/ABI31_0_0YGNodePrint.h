/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once
#include <string>

#include "ABI31_0_0Yoga.h"

namespace facebook {
namespace ABI31_0_0yoga {

void ABI31_0_0YGNodeToString(
    std::string* str,
    ABI31_0_0YGNodeRef node,
    ABI31_0_0YGPrintOptions options,
    uint32_t level);

} // namespace ABI31_0_0yoga
} // namespace facebook
