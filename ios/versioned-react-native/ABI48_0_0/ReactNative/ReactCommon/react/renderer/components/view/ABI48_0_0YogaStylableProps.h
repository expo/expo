/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0yoga/ABI48_0_0YGStyle.h>

#include <ABI48_0_0React/ABI48_0_0renderer/core/Props.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/PropsParserContext.h>
#include <ABI48_0_0React/ABI48_0_0renderer/debug/DebugStringConvertible.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class YogaStylableProps : public Props {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(
      const PropsParserContext &context,
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps,
      bool shouldSetRawProps = true);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

#ifdef ANDROID
  void propsDiffMapBuffer(Props const *oldProps, MapBufferBuilder &builder)
      const override;
#endif

#pragma mark - Props

  ABI48_0_0YGStyle yogaStyle{};

#if ABI48_0_0RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const override;

#endif
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
