/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef DEBUG
#pragma once
#include <string>

#include "ABI45_0_0Yoga.h"

namespace ABI45_0_0facebook {
namespace yoga {

void ABI45_0_0YGNodeToString(
    std::string& str,
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGPrintOptions options,
    uint32_t level);

} // namespace yoga
} // namespace ABI45_0_0facebook
#endif
