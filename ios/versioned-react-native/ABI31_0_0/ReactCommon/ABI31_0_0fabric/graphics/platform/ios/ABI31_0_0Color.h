/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI31_0_0fabric/ABI31_0_0graphics/Float.h>

#include <ABI31_0_0fabric/ABI31_0_0graphics/ColorComponents.h>

namespace facebook {
namespace ReactABI31_0_0 {

using Color = CGColor;
using SharedColor = std::shared_ptr<Color>;

SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

} // namespace ReactABI31_0_0
} // namespace facebook
