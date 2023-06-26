/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0ParagraphAttributes.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0TextAttributes.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/iostextinput/conversions.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/iostextinput/primitives.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/BaseTextProps.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewProps.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0Props.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0propsConversions.h>
#include <ABI49_0_0React/renderer/graphics/ABI49_0_0Color.h>
#include <ABI49_0_0React/renderer/imagemanager/ABI49_0_0primitives.h>
#include <vector>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
