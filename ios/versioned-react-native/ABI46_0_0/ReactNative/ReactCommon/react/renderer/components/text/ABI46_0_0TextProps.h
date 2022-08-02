/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI46_0_0React/ABI46_0_0renderer/attributedstring/TextAttributes.h>
#include <ABI46_0_0React/ABI46_0_0renderer/components/text/BaseTextProps.h>
#include <ABI46_0_0React/ABI46_0_0renderer/core/Props.h>
#include <ABI46_0_0React/ABI46_0_0renderer/core/PropsParserContext.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/Color.h>
#include <ABI46_0_0React/ABI46_0_0renderer/graphics/Geometry.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

class TextProps : public Props, public BaseTextProps {
 public:
  TextProps() = default;
  TextProps(
      const PropsParserContext &context,
      const TextProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - DebugStringConvertible

#if ABI46_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
