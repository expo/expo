/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <CoreGraphics/CoreGraphics.h>
#include <ABI41_0_0React/graphics/ColorComponents.h>
#include <ABI41_0_0React/graphics/Float.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

using Color = CGColor;
using SharedColor = std::shared_ptr<Color>;

SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

SharedColor clearColor();
SharedColor blackColor();
SharedColor whiteColor();

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
