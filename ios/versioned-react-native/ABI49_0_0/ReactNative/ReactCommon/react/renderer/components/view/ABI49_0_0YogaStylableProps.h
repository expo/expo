/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0yoga/ABI49_0_0YGStyle.h>

#include <ABI49_0_0React/renderer/core/ABI49_0_0Props.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/debug/ABI49_0_0DebugStringConvertible.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class YogaStylableProps : public Props {
  using CompactValue = ABI49_0_0facebook::yoga::detail::CompactValue;

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
  ABI49_0_0YGStyle yogaStyle{};

  // Duplicates of existing properties with different names, taking
  // precedence. E.g. "marginBlock" instead of "marginVertical"
  CompactValue marginInline;
  CompactValue marginInlineStart;
  CompactValue marginInlineEnd;
  CompactValue marginBlock;

  CompactValue paddingInline;
  CompactValue paddingInlineStart;
  CompactValue paddingInlineEnd;
  CompactValue paddingBlock;

  // BlockEnd/BlockStart map to top/bottom (no writing mode), but we preserve
  // Yoga's precedence and prefer specific edges (e.g. top) to ones which are
  // flow relative (e.g. blockStart).
  CompactValue marginBlockStart;
  CompactValue marginBlockEnd;

  CompactValue paddingBlockStart;
  CompactValue paddingBlockEnd;

#if ABI49_0_0RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

  SharedDebugStringConvertibleList getDebugProps() const override;

#endif

 private:
  void convertRawPropAliases(
      const PropsParserContext &context,
      YogaStylableProps const &sourceProps,
      RawProps const &rawProps);
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
