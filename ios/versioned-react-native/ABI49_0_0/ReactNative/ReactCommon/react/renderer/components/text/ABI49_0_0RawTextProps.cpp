/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0RawTextProps.h"

#include <ABI49_0_0React/renderer/core/ABI49_0_0propsConversions.h>
#include <ABI49_0_0React/renderer/debug/ABI49_0_0debugStringConvertibleUtils.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

RawTextProps::RawTextProps(
    const PropsParserContext &context,
    const RawTextProps &sourceProps,
    const RawProps &rawProps)
    : Props(context, sourceProps, rawProps),
      text(convertRawProp(context, rawProps, "text", sourceProps.text, {})){};

#pragma mark - DebugStringConvertible

#if ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList RawTextProps::getDebugProps() const {
  return SharedDebugStringConvertibleList{
      debugStringConvertibleItem("text", text)};
}
#endif

} // namespace ABI49_0_0facebook::ABI49_0_0React
