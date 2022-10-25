/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Defines visibility of the shadow node and particular layout
 * engine which should be used for laying out the node.
 */
enum class DisplayType {
  None = 0,
  Flex = 1,
  Inline = 2,
};

/*
 * User interface layout direction.
 */
enum class LayoutDirection {
  Undefined = 0,
  LeftToRight = 1,
  RightToLeft = 2,
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook

namespace std {
template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::LayoutDirection> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::LayoutDirection &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::DisplayType> {
  size_t operator()(const ABI47_0_0facebook::ABI47_0_0React::DisplayType &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};

} // namespace std
