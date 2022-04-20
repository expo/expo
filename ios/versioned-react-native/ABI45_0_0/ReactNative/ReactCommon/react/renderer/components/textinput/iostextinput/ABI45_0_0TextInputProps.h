/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI45_0_0React/ABI45_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI45_0_0React/ABI45_0_0renderer/attributedstring/TextAttributes.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/iostextinput/conversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/iostextinput/primitives.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/text/BaseTextProps.h>
#include <ABI45_0_0React/ABI45_0_0renderer/components/view/ViewProps.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/Props.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/PropsParserContext.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/propsConversions.h>
#include <ABI45_0_0React/ABI45_0_0renderer/graphics/Color.h>
#include <ABI45_0_0React/ABI45_0_0renderer/imagemanager/primitives.h>
#include <vector>

namespace ABI45_0_0facebook {
namespace ABI45_0_0React {

class TextInputProps final : public ViewProps, public BaseTextProps {
 public:
  TextInputProps() = default;
  TextInputProps(
      const PropsParserContext &context,
      TextInputProps const &sourceProps,
      RawProps const &rawProps);

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
  butter::optional<Selection> selection{};

  std::string const inputAccessoryViewID{};

  bool onKeyPressSync{false};
  bool onChangeSync{false};

  /*
   * Accessors
   */
  TextAttributes getEffectiveTextAttributes(Float fontSizeMultiplier) const;
  ParagraphAttributes getEffectiveParagraphAttributes() const;
};

} // namespace ABI45_0_0React
} // namespace ABI45_0_0facebook
