/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

/*
 * Defines visibility of the shadow node and particular layout
 * engine which should be used for laying out the node.
 */
enum class DisplayType {
  None,
  Flex,
  Inline,
};

/*
 * User interface layout direction.
 */
enum class LayoutDirection {
  Undefined,
  LeftToRight,
  RightToLeft,
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook

namespace std {
template <>
struct hash<ABI41_0_0facebook::ABI41_0_0React::LayoutDirection> {
  size_t operator()(const ABI41_0_0facebook::ABI41_0_0React::LayoutDirection &v) const {
    return hash<int>()(static_cast<int>(v));
  }
};
} // namespace std
