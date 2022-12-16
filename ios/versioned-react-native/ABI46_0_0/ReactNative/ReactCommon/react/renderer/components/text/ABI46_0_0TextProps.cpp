/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI46_0_0TextProps.h"

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

TextProps::TextProps(
    const PropsParserContext &context,
    const TextProps &sourceProps,
    const RawProps &rawProps)
    : Props(context, sourceProps, rawProps),
      BaseTextProps::BaseTextProps(context, sourceProps, rawProps){};

#pragma mark - DebugStringConvertible

#if ABI46_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList TextProps::getDebugProps() const {
  return BaseTextProps::getDebugProps();
}
#endif

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
