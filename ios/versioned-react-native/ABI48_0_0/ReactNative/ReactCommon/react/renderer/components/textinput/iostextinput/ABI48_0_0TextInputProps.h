/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/TextAttributes.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/iostextinput/conversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/iostextinput/primitives.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/text/BaseTextProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/components/view/ViewProps.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/Props.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/PropsParserContext.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/propsConversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Color.h>
#include <ABI48_0_0React/ABI48_0_0renderer/imagemanager/primitives.h>
#include <vector>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class TextInputProps final : public ViewProps, public BaseTextProps {
 public:
  TextInputProps() = default;
  TextInputProps(
      const PropsParserContext &context,
      TextInputProps const &sourceProps,
      RawProps const &rawProps);

  void setProp(
      const PropsParserContext &context,
      RawPropsPropNameHash hash,
      const char *propName,
      RawValue const &value);

#pragma mark - Props

  TextInputTraits const traits{};
  ParagraphAttributes const paragraphAttributes{};

  std::string const defaultValue{};

  std::string const placeholder{};
  SharedColor const placeholderTextColor{};

  int maxLength{};

  /*
   * Tint colors
   */
  SharedColor const cursorColor{};
  SharedColor const selectionColor{};
  // TODO: Rename to `tintColor` and make universal.
  SharedColor const underlineColorAndroid{};

  /*
   * "Private" (only used by TextInput.js) props
   */
  std::string const text{};
  int const mostRecentEventCount{0};

  bool autoFocus{false};
  std::optional<Selection> selection{};

  std::string const inputAccessoryViewID{};

  bool onKeyPressSync{false};
  bool onChangeSync{false};

  /*
   * Accessors
   */
  TextAttributes getEffectiveTextAttributes(Float fontSizeMultiplier) const;
  ParagraphAttributes getEffectiveParagraphAttributes() const;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
