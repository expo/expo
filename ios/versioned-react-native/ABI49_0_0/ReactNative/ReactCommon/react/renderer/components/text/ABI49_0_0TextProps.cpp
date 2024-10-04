/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0TextProps.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

TextProps::TextProps(
    const PropsParserContext &context,
    const TextProps &sourceProps,
    const RawProps &rawProps)
    : Props(context, sourceProps, rawProps),
      BaseTextProps::BaseTextProps(context, sourceProps, rawProps){};

void TextProps::setProp(
    const PropsParserContext &context,
    RawPropsPropNameHash hash,
    const char *propName,
    RawValue const &value) {
  BaseTextProps::setProp(context, hash, propName, value);
  Props::setProp(context, hash, propName, value);
}

#pragma mark - DebugStringConvertible

#if ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList TextProps::getDebugProps() const {
  return BaseTextProps::getDebugProps();
}
#endif

} // namespace ABI49_0_0facebook::ABI49_0_0React
