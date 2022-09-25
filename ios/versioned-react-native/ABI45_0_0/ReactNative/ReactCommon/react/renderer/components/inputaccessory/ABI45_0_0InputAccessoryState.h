/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Float.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Geometry.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/conversions.h>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

/*
 * State for <InputAccessoryView> component.
 */
class InputAccessoryState final {
 public:
  InputAccessoryState(){};
  InputAccessoryState(Size viewportSize_) : viewportSize(viewportSize_){};

  const Size viewportSize{};
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
