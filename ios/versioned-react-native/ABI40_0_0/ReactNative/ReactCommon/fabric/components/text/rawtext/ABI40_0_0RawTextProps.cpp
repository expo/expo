/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI40_0_0RawTextProps.h"

#include <ABI40_0_0React/core/propsConversions.h>
#include <ABI40_0_0React/debug/debugStringConvertibleUtils.h>

namespace ABI40_0_0facebook {
namespace ABI40_0_0React {

RawTextProps::RawTextProps(
    const RawTextProps &sourceProps,
    const RawProps &rawProps)
    : Props(sourceProps, rawProps),
      text(convertRawProp(rawProps, "text", sourceProps.text, {})){};

#pragma mark - DebugStringConvertible

#if ABI40_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList RawTextProps::getDebugProps() const {
  return {debugStringConvertibleItem("text", text)};
}
#endif

} // namespace ABI40_0_0React
} // namespace ABI40_0_0facebook
