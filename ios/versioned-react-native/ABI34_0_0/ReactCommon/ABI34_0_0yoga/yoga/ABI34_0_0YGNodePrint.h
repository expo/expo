/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once
#include <string>

#include "ABI34_0_0Yoga.h"

namespace facebook {
namespace ABI34_0_0yoga {

void ABI34_0_0YGNodeToString(
    std::string& str,
    ABI34_0_0YGNodeRef node,
    ABI34_0_0YGPrintOptions options,
    uint32_t level);

} // namespace ABI34_0_0yoga
} // namespace facebook
