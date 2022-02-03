/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>
#include <memory>

#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI44_0_0React/ABI44_0_0renderer/components/text/BaseTextProps.h>
#include <ABI44_0_0React/ABI44_0_0renderer/components/view/ViewProps.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/Props.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

/*
 * Props of <Paragraph> component.
 * Most of the props are directly stored in composed `ParagraphAttributes`
 * object.
 */
class ParagraphProps : public ViewProps, public BaseTextProps {
 public:
  ParagraphProps() = default;
  ParagraphProps(ParagraphProps const &sourceProps, RawProps const &rawProps);

#pragma mark - Props

  /*
   * Contains all prop values that affect visual representation of the
   * paragraph.
   */
  ParagraphAttributes const paragraphAttributes{};

  /*
   * Defines can the text be selected (and copied) or not.
   */
  bool const isSelectable{};

  bool const onTextLayout{};

#pragma mark - DebugStringConvertible

#if ABI44_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
