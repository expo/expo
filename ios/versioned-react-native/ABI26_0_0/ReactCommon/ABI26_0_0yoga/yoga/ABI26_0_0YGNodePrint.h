/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
#pragma once
#include <string>

#include "ABI26_0_0Yoga.h"

namespace facebook {
namespace yoga {

void ABI26_0_0YGNodeToString(
    std::string* str,
    ABI26_0_0YGNodeRef node,
    ABI26_0_0YGPrintOptions options,
    uint32_t level);

} // namespace yoga
} // namespace facebook
