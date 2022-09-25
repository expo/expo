/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI46_0_0React/ABI46_0_0renderer/graphics/Float.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/Point.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/Rect.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/RectangleCorners.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/RectangleEdges.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/Size.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

struct Vector {
  Float x{0};
  Float y{0};
  Float z{0};
  Float w{0};
};

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
