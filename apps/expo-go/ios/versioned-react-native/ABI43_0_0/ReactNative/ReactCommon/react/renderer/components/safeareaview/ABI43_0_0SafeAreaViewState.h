/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Geometry.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * State for <SafeAreaView> component.
 */
class SafeAreaViewState final {
 public:
  using Shared = std::shared_ptr<SafeAreaViewState const>;

  EdgeInsets const padding{};
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
