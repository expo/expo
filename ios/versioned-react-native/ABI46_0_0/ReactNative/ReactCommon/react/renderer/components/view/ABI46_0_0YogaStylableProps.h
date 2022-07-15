/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI46_0_0yoga/ABI46_0_0YGStyle.h>

#include <ABI46_0_0React/ABI46_0_0renderer/core/Props.h>
#include <ABI46_0_0React/ABI46_0_0renderer/core/PropsParserContext.h>
#include <ABI46_0_0React/ABI46_0_0renderer/debug/DebugStringConvertible.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

class YogaStylableProps : public Props {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(
      const PropsParserContext &context,
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps,
      bool shouldSetRawProps = true);

#pragma mark - Props

  ABI46_0_0YGStyle yogaStyle{};

#if ABI46_0_0RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const;

#endif
};

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
