/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0Touch.h"

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

#if ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(Touch const &touch) {
  return "Touch";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    Touch const &touch,
    DebugStringConvertibleOptions options) {
  return {
      {"pagePoint", getDebugDescription(touch.pagePoint, options)},
      {"offsetPoint", getDebugDescription(touch.offsetPoint, options)},
      {"screenPoint", getDebugDescription(touch.screenPoint, options)},
      {"identifier", getDebugDescription(touch.identifier, options)},
      {"target", getDebugDescription(touch.target, options)},
      {"force", getDebugDescription(touch.force, options)},
      {"timestamp", getDebugDescription(touch.timestamp, options)},
  };
}

#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
