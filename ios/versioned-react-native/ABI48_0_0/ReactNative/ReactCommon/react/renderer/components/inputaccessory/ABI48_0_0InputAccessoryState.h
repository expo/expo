/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Float.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Geometry.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/conversions.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * State for <InputAccessoryView> component.
 */
class InputAccessoryState final {
 public:
  InputAccessoryState(){};
  InputAccessoryState(Size viewportSize_) : viewportSize(viewportSize_){};

  const Size viewportSize{};
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
