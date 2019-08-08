/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <string>

#include "ABI33_0_0Yoga.h"

namespace facebook {
namespace ABI33_0_0yoga {

void ABI33_0_0YGNodeToString(
    std::string& str,
    ABI33_0_0YGNodeRef node,
    ABI33_0_0YGPrintOptions options,
    uint32_t level);

} // namespace ABI33_0_0yoga
} // namespace facebook
