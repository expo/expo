/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0TextAttributes.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/BaseTextProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0Props.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Color.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class TextProps : public Props, public BaseTextProps {
 public:
  TextProps() = default;
  TextProps(
      const PropsParserContext &context,
      const TextProps &sourceProps,
      const RawProps &rawProps);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

#pragma mark - DebugStringConvertible

#if ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
