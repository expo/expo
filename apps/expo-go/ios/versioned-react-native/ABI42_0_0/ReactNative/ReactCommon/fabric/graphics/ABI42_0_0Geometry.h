/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <functional>
#include <tuple>

#include <folly/Hash.h>
#include <ABI42_0_0React/graphics/Float.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * Point
 */
struct Point {
  Float x{0};
  Float y{0};

  Point &operator+=(const Point &point) {
    x += point.x;
    y += point.y;
    return *this;
  }

  Point &operator-=(const Point &point) {
    x -= point.x;
    y -= point.y;
    return *this;
  }

  Point &operator*=(const Point &point) {
    x *= point.x;
    y *= point.y;
    return *this;
  }

  friend Point operator+(Point lhs, const Point &rhs) {
    return lhs += rhs;
  }

  friend Point operator-(Point lhs, const Point &rhs) {
    return lhs -= rhs;
  }

  bool operator==(const Point &rhs) const {
    return std::tie(this->x, this->y) == std::tie(rhs.x, rhs.y);
  }

  bool operator!=(const Point &rhs) const {
    return !(*this == rhs);
  }
};

struct Vector {
  Float x{0};
  Float y{0};
  Float z{0};
  Float w{0};
};

/*
 * Size
 */
struct Size {
  Float width{0};
  Float height{0};

  Size &operator+=(const Point &point) {
    width += point.x;
    height += point.y;
    return *this;
  }

  Size &operator*=(const Point &point) {
    width *= point.x;
    height *= point.y;
    return *this;
  }

  bool operator==(const Size &rhs) const {
    return std::tie(this->width, this->height) ==
        std::tie(rhs.width, rhs.height);
  }

  bool operator!=(const Size &rhs) const {
    return !(*this == rhs);
  }
};

/*
 * Rect: Point and Size
 */
struct Rect {
  Point origin{0, 0};
  Size size{0, 0};

  bool operator==(const Rect &rhs) const {
    return std::tie(this->origin, this->size) == std::tie(rhs.origin, rhs.size);
  }

  bool operator!=(const Rect &rhs) const {
    return !(*this == rhs);
  }

  Float getMaxX() const {
    return size.width > 0 ? origin.x + size.width : origin.x;
  }
  Float getMaxY() const {
    return size.height > 0 ? origin.y + size.height : origin.y;
  }
  Float getMinX() const {
    return size.width >= 0 ? origin.x : origin.x + size.width;
  }
  Float getMinY() const {
    return size.height >= 0 ? origin.y : origin.y + size.height;
  }
  Float getMidX() const {
    return origin.x + size.width / 2;
  }
  Float getMidY() const {
    return origin.y + size.height / 2;
  }
  Point getCenter() const {
    return {getMidX(), getMidY()};
  }

  void unionInPlace(const Rect &rect) {
    auto x1 = std::min(getMinX(), rect.getMinX());
    auto y1 = std::min(getMinY(), rect.getMinY());
    auto x2 = std::max(getMaxX(), rect.getMaxX());
    auto y2 = std::max(getMaxY(), rect.getMaxY());
    origin = {x1, y1};
    size = {x2 - x1, y2 - y1};
  }

  bool containsPoint(Point point) {
    return point.x >= origin.x && point.y >= origin.y &&
        point.x <= (origin.x + size.width) &&
        point.y <= (origin.y + size.height);
  }

  static Rect
  boundingRect(Point const &a, Point const &b, Point const &c, Point const &d) {
    auto leftTopPoint = a;
    auto rightBottomPoint = a;

    leftTopPoint.x = std::min(leftTopPoint.x, b.x);
    leftTopPoint.x = std::min(leftTopPoint.x, c.x);
    leftTopPoint.x = std::min(leftTopPoint.x, d.x);

    leftTopPoint.y = std::min(leftTopPoint.y, b.y);
    leftTopPoint.y = std::min(leftTopPoint.y, c.y);
    leftTopPoint.y = std::min(leftTopPoint.y, d.y);

    rightBottomPoint.x = std::max(rightBottomPoint.x, b.x);
    rightBottomPoint.x = std::max(rightBottomPoint.x, c.x);
    rightBottomPoint.x = std::max(rightBottomPoint.x, d.x);

    rightBottomPoint.y = std::max(rightBottomPoint.y, b.y);
    rightBottomPoint.y = std::max(rightBottomPoint.y, c.y);
    rightBottomPoint.y = std::max(rightBottomPoint.y, d.y);

    return {leftTopPoint,
            {rightBottomPoint.x - leftTopPoint.x,
             rightBottomPoint.y - leftTopPoint.y}};
  }
};

/*
 * Generic data structure describes some values associated with *edges*
 * of a rectangle.
 */
template <typename T>
struct RectangleEdges {
  T left{};
  T top{};
  T right{};
  T bottom{};

  bool operator==(const RectangleEdges<T> &rhs) const {
    return std::tie(this->left, this->top, this->right, this->bottom) ==
        std::tie(rhs.left, rhs.top, rhs.right, rhs.bottom);
  }

  bool operator!=(const RectangleEdges<T> &rhs) const {
    return !(*this == rhs);
  }

  bool isUniform() const {
    return left == top && left == right && left == bottom;
  }
};

template <typename T>
RectangleEdges<T> operator+(
    RectangleEdges<T> const &lhs,
    RectangleEdges<T> const &rhs) {
  return RectangleEdges<T>{lhs.left + rhs.left,
                           lhs.top + rhs.top,
                           lhs.right + rhs.right,
                           lhs.bottom + rhs.bottom};
}

template <typename T>
RectangleEdges<T> operator-(
    RectangleEdges<T> const &lhs,
    RectangleEdges<T> const &rhs) {
  return RectangleEdges<T>{lhs.left - rhs.left,
                           lhs.top - rhs.top,
                           lhs.right - rhs.right,
                           lhs.bottom - rhs.bottom};
}

/*
 * Generic data structure describes some values associated with *corners*
 * of a rectangle.
 */
template <typename T>
struct RectangleCorners {
  T topLeft{};
  T topRight{};
  T bottomLeft{};
  T bottomRight{};

  bool operator==(const RectangleCorners<T> &rhs) const {
    return std::tie(
               this->topLeft,
               this->topRight,
               this->bottomLeft,
               this->bottomRight) ==
        std::tie(rhs.topLeft, rhs.topRight, rhs.bottomLeft, rhs.bottomRight);
  }

  bool operator!=(const RectangleCorners<T> &rhs) const {
    return !(*this == rhs);
  }

  bool isUniform() const {
    return topLeft == topRight && topLeft == bottomLeft &&
        topLeft == bottomRight;
  }
};

/*
 * EdgeInsets
 */
using EdgeInsets = RectangleEdges<Float>;

/*
 * CornerInsets
 */
using CornerInsets = RectangleCorners<Float>;

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook

namespace std {
template <>
struct hash<ABI42_0_0facebook::ABI42_0_0React::Point> {
  size_t operator()(const ABI42_0_0facebook::ABI42_0_0React::Point &point) const {
    return folly::hash::hash_combine(0, point.x, point.y);
  }
};

template <>
struct hash<ABI42_0_0facebook::ABI42_0_0React::Size> {
  size_t operator()(const ABI42_0_0facebook::ABI42_0_0React::Size &size) const {
    return folly::hash::hash_combine(0, size.width, size.height);
  }
};

template <>
struct hash<ABI42_0_0facebook::ABI42_0_0React::Rect> {
  size_t operator()(const ABI42_0_0facebook::ABI42_0_0React::Rect &rect) const {
    return folly::hash::hash_combine(0, rect.origin, rect.size);
  }
};

template <typename T>
struct hash<ABI42_0_0facebook::ABI42_0_0React::RectangleEdges<T>> {
  size_t operator()(const ABI42_0_0facebook::ABI42_0_0React::RectangleEdges<T> &edges) const {
    return folly::hash::hash_combine(
        0, edges.left, edges.right, edges.top, edges.bottom);
  }
};

template <typename T>
struct hash<ABI42_0_0facebook::ABI42_0_0React::RectangleCorners<T>> {
  size_t operator()(const ABI42_0_0facebook::ABI42_0_0React::RectangleCorners<T> &corners) const {
    return folly::hash::hash_combine(
        0,
        corners.topLeft,
        corners.bottomLeft,
        corners.topRight,
        corners.bottomRight);
  }
};

} // namespace std
