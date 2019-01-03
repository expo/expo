/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI32_0_0fabric/ABI32_0_0components/view/AccessibilityPrimitives.h>
#include <folly/dynamic.h>

namespace facebook {
namespace ReactABI32_0_0 {

AccessibilityTraits accessibilityTraitsFromDynamic(const folly::dynamic &value);

} // namespace ReactABI32_0_0
} // namespace facebook
