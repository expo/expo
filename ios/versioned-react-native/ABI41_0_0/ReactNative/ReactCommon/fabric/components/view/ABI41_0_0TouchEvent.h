/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/debug/DebugStringConvertible.h>

#include <unordered_set>

#include <ABI41_0_0React/components/view/Touch.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

using Touches = std::unordered_set<Touch, Touch::Hasher, Touch::Comparator>;

/*
 * Defines the `touchstart`, `touchend`, `touchmove`, and `touchcancel` event
 * types.
 */
struct TouchEvent {
  /*
   * A list of Touches for every point of contact currently touching the
   * surface.
   */
  Touches touches;

  /*
   * A list of Touches for every point of contact which contributed to the
   * event.
   */
  Touches changedTouches;

  /*
   * A list of Touches for every point of contact that is touching the surface
   * and started on the element that is the target of the current event.
   */
  Touches targetTouches;
};

#if ABI41_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(TouchEvent const &touchEvent);
std::vector<DebugStringConvertibleObject> getDebugProps(
    TouchEvent const &touchEvent,
    DebugStringConvertibleOptions options);

#endif

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
