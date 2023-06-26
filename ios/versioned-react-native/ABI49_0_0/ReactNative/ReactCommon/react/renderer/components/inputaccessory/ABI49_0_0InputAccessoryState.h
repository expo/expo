/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/core/ABI49_0_0graphicsConversions.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Float.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * State for <InputAccessoryView> component.
 */
class InputAccessoryState final {
 public:
  InputAccessoryState(){};
  InputAccessoryState(Size viewportSize_) : viewportSize(viewportSize_){};

  const Size viewportSize{};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
