/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI46_0_0React/ABI46_0_0renderer/core/ABI46_0_0ReactPrimitives.h>
#include <ABI46_0_0React/ABI46_0_0renderer/debug/DebugStringConvertible.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/Geometry.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

struct PointerEvent {
  /*
   * A unique identifier for the pointer causing the event.
   */
  int pointerId;
  /*
   * The normalized pressure of the pointer input in the range 0 to 1, where 0
   * and 1 represent the minimum and maximum pressure the hardware is capable of
   * detecting, respectively.
   */
  Float pressure;
  /*
   * Indicates the device type that caused the event (mouse, pen, touch, etc.)
   */
  std::string pointerType;
  /*
   * Point within the application's viewport at which the event occurred (as
   * opposed to the coordinate within the page).
   */
  Point clientPoint;
  /*
   * A reference to the view to which the event was originally dispatched.
   */
  Tag target;
  /*
   * The time at which the event was created (in milliseconds). By
   * specification, this value is time since epoch—but in reality, browsers'
   * definitions vary.
   */
  Float timestamp;
};

#if ABI46_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(PointerEvent const &pointerEvent);
std::vector<DebugStringConvertibleObject> getDebugProps(
    PointerEvent const &pointerEvent,
    DebugStringConvertibleOptions options);

#endif

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
