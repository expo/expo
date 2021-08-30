/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/attributedstring/ParagraphAttributes.h>
#include <ABI41_0_0React/attributedstring/TextAttributes.h>
#include <ABI41_0_0React/components/iostextinput/conversions.h>
#include <ABI41_0_0React/components/iostextinput/primitives.h>
#include <ABI41_0_0React/components/text/BaseTextProps.h>
#include <ABI41_0_0React/components/view/ViewProps.h>
#include <ABI41_0_0React/core/Props.h>
#include <ABI41_0_0React/core/propsConversions.h>
#include <ABI41_0_0React/graphics/Color.h>
#include <ABI41_0_0React/imagemanager/primitives.h>
#include <vector>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class TextInputProps final : public ViewProps, public BaseTextProps {
 public:
  TextInputProps() = default;
  TextInputProps(TextInputProps const &sourceProps, RawProps const &rawProps);

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

  /*
   * Accessors
   */
  TextAttributes getEffectiveTextAttributes() const;
  ParagraphAttributes getEffectiveParagraphAttributes() const;

#ifdef ANDROID
  folly::dynamic getDynamic() const;
#endif
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
