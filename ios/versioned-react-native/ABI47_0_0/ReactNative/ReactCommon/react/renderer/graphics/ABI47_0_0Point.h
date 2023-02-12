/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <tuple>

#include <folly/Hash.h>
#include <ABI47_0_0React/ABI47_0_0renderer/graphics/Float.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Contains a point in a two-dimensional coordinate system.
 */
struct Point {
  Float x{0};
  Float y{0};

  Point &operator+=(Point const &point) noexcept {
    x += point.x;
    y += point.y;
    return *this;
  }

  Point &operator-=(Point const &point) noexcept {
    x -= point.x;
    y -= point.y;
    return *this;
  }

  Point &operator*=(Point const &point) noexcept {
    x *= point.x;
    y *= point.y;
    return *this;
  }

  friend Point operator+(Point lhs, Point const &rhs) noexcept {
    return lhs += rhs;
  }

  friend Point operator-(Point lhs, Point const &rhs) noexcept {
    return lhs -= rhs;
  }
};

inline bool operator==(Point const &rhs, Point const &lhs) noexcept {
  return std::tie(lhs.x, lhs.y) == std::tie(rhs.x, rhs.y);
}

inline bool operator!=(Point const &rhs, Point const &lhs) noexcept {
  return !(lhs == rhs);
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook

namespace std {

template <>
struct hash<ABI47_0_0facebook::ABI47_0_0React::Point> {
  size_t operator()(ABI47_0_0facebook::ABI47_0_0React::Point const &point) const noexcept {
    return folly::hash::hash_combine(0, point.x, point.y);
  }
};

} // namespace std
