/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0ParagraphProps.h"

#include <ABI37_0_0React/attributedstring/conversions.h>
#include <ABI37_0_0React/core/propsConversions.h>
#include <ABI37_0_0React/debug/debugStringConvertibleUtils.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

static ParagraphAttributes convertRawProp(
    RawProps const &rawProps,
    ParagraphAttributes const &defaultParagraphAttributes) {
  auto paragraphAttributes = ParagraphAttributes{};

  paragraphAttributes.maximumNumberOfLines = convertRawProp(
      rawProps,
      "numberOfLines",
      defaultParagraphAttributes.maximumNumberOfLines);
  paragraphAttributes.ellipsizeMode = convertRawProp(
      rawProps, "ellipsizeMode", defaultParagraphAttributes.ellipsizeMode);
  paragraphAttributes.adjustsFontSizeToFit = convertRawProp(
      rawProps,
      "adjustsFontSizeToFit",
      defaultParagraphAttributes.adjustsFontSizeToFit);
  paragraphAttributes.minimumFontSize = convertRawProp(
      rawProps,
      "minimumFontSize",
      defaultParagraphAttributes.minimumFontSize,
      std::numeric_limits<Float>::quiet_NaN());
  paragraphAttributes.maximumFontSize = convertRawProp(
      rawProps,
      "maximumFontSize",
      defaultParagraphAttributes.maximumFontSize,
      std::numeric_limits<Float>::quiet_NaN());

  return paragraphAttributes;
}

ParagraphProps::ParagraphProps(
    ParagraphProps const &sourceProps,
    RawProps const &rawProps)
    : ViewProps(sourceProps, rawProps),
      BaseTextProps(sourceProps, rawProps),
      paragraphAttributes(
          convertRawProp(rawProps, sourceProps.paragraphAttributes)),
      isSelectable(
          convertRawProp(rawProps, "selectable", sourceProps.isSelectable)){};

#pragma mark - DebugStringConvertible

#if ABI37_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphProps::getDebugProps() const {
  return ViewProps::getDebugProps() + BaseTextProps::getDebugProps() +
      paragraphAttributes.getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem("isSelectable", isSelectable)};
}
#endif

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
