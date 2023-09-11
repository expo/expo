/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <folly/Hash.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Float.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Point.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * Contains width and height values.
 */
struct Size {
  Float width{0};
  Float height{0};

  Size &operator+=(Point const &point) noexcept {
    width += point.x;
    height += point.y;
    return *this;
  }

  Size &operator*=(Point const &point) noexcept {
    width *= point.x;
    height *= point.y;
    return *this;
  }
};

inline bool operator==(Size const &rhs, Size const &lhs) noexcept {
  return std::tie(lhs.width, lhs.height) == std::tie(rhs.width, rhs.height);
}

inline bool operator!=(Size const &rhs, Size const &lhs) noexcept {
  return !(lhs == rhs);
}

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook

namespace std {

template <>
struct hash<ABI48_0_0facebook::ABI48_0_0React::Size> {
  size_t operator()(ABI48_0_0facebook::ABI48_0_0React::Size const &size) const {
    return folly::hash::hash_combine(0, size.width, size.height);
  }
};

} // namespace std
