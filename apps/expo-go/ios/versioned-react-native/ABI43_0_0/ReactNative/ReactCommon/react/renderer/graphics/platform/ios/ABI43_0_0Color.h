/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>

#include <ABI43_0_0React/ABI43_0_0renderer/graphics/ColorComponents.h>
#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Float.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

using Color = int32_t;

using SharedColor = better::optional<Color>;

SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

SharedColor clearColor();
SharedColor blackColor();
SharedColor whiteColor();

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
