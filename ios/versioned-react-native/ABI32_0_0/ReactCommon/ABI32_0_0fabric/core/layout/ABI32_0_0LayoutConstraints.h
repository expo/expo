/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI32_0_0fabric/ABI32_0_0core/LayoutPrimitives.h>
#include <ABI32_0_0fabric/ABI32_0_0graphics/Geometry.h>

namespace facebook {
namespace ReactABI32_0_0 {

/*
 * Unified layout constraints for measuring.
 */
struct LayoutConstraints {
  Size minimumSize {0, 0};
  Size maximumSize {kFloatUndefined, kFloatUndefined};
  LayoutDirection layoutDirection;
};

} // namespace ReactABI32_0_0
} // namespace facebook
