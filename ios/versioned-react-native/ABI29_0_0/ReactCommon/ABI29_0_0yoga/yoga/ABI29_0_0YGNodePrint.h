/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once
#include <string>

#include "ABI29_0_0Yoga.h"

namespace facebook {
namespace yoga {

void ABI29_0_0YGNodeToString(
    std::string* str,
    ABI29_0_0YGNodeRef node,
    ABI29_0_0YGPrintOptions options,
    uint32_t level);

} // namespace yoga
} // namespace facebook
