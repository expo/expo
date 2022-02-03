/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI43_0_0RawTextProps.h"

#include <ABI43_0_0React/ABI43_0_0renderer/core/propsConversions.h>
#include <ABI43_0_0React/ABI43_0_0renderer/debug/debugStringConvertibleUtils.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

RawTextProps::RawTextProps(
    const RawTextProps &sourceProps,
    const RawProps &rawProps)
    : Props(sourceProps, rawProps),
      text(convertRawProp(rawProps, "text", sourceProps.text, {})){};

#pragma mark - DebugStringConvertible

#if ABI43_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList RawTextProps::getDebugProps() const {
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("text", text)};
}
#endif

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
