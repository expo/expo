/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0renderer/core/ABI47_0_0ReactPrimitives.h>
#include <ABI47_0_0React/ABI47_0_0renderer/debug/DebugStringConvertible.h>
#include <ABI47_0_0React/ABI47_0_0renderer/graphics/Geometry.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

/*
 * Describes an individual touch point for a touch event.
 * See https://www.w3.org/TR/touch-events/ for more details.
 */
struct Touch {
  /*
   * The coordinate of point relative to the root component in points.
   */
  Point pagePoint;

  /*
   * The coordinate of point relative to the target component in points.
   */
  Point offsetPoint;

  /*
   * The coordinate of point relative to the screen component in points.
   */
  Point screenPoint;

  /*
   * An identification number for each touch point.
   */
  int identifier;

  /*
   * The tag of a component on which the touch point started when it was first
   * placed on the surface, even if the touch point has since moved outside the
   * interactive area of that element.
   */
  Tag target;

  /*
   * The force of the touch.
   */
  Float force;

  /*
   * The time in seconds when the touch occurred or when it was last mutated.
   */
  Float timestamp;

  /*
   * The particular implementation of `Hasher` and (especially) `Comparator`
   * make sense only when `Touch` object is used as a *key* in indexed
   * collections. Because of that they are expressed as separate classes.
   */
  struct Hasher {
    size_t operator()(Touch const &touch) const {
      return std::hash<decltype(touch.identifier)>()(touch.identifier);
    }
  };

  struct Comparator {
    bool operator()(Touch const &lhs, Touch const &rhs) const {
      return lhs.identifier == rhs.identifier;
    }
  };
};

using Touches = std::unordered_set<Touch, Touch::Hasher, Touch::Comparator>;

#if ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(Touch const &touch);
std::vector<DebugStringConvertibleObject> getDebugProps(
    Touch const &object,
    DebugStringConvertibleOptions options);

#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
