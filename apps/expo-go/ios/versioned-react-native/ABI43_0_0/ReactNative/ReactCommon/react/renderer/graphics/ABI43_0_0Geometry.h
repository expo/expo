/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Float.h>
#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Point.h>
#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Rect.h>
#include <ABI43_0_0React/ABI43_0_0renderer/graphics/RectangleCorners.h>
#include <ABI43_0_0React/ABI43_0_0renderer/graphics/RectangleEdges.h>
#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Size.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

struct Vector {
  Float x{0};
  Float y{0};
  Float z{0};
  Float w{0};
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
