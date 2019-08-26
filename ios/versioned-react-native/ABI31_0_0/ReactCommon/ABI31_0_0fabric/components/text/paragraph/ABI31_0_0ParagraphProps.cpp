/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0ParagraphProps.h"

#include <ABI31_0_0fabric/ABI31_0_0attributedstring/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0core/propsConversions.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace ReactABI31_0_0 {

static ParagraphAttributes convertRawProp(const RawProps &rawProps, const ParagraphAttributes &defaultParagraphAttributes) {
  ParagraphAttributes paragraphAttributes;

  paragraphAttributes.maximumNumberOfLines = convertRawProp(rawProps, "numberOfLines", defaultParagraphAttributes.maximumNumberOfLines);
  paragraphAttributes.ellipsizeMode = convertRawProp(rawProps, "ellipsizeMode", defaultParagraphAttributes.ellipsizeMode);
  paragraphAttributes.adjustsFontSizeToFit = convertRawProp(rawProps, "adjustsFontSizeToFit", defaultParagraphAttributes.adjustsFontSizeToFit);
  paragraphAttributes.minimumFontSize = convertRawProp(rawProps, "minimumFontSize", defaultParagraphAttributes.minimumFontSize, std::numeric_limits<Float>::quiet_NaN());
  paragraphAttributes.maximumFontSize = convertRawProp(rawProps, "maximumFontSize", defaultParagraphAttributes.maximumFontSize, std::numeric_limits<Float>::quiet_NaN());

  return paragraphAttributes;
}

ParagraphProps::ParagraphProps(const ParagraphProps &sourceProps, const RawProps &rawProps):
  ViewProps(sourceProps, rawProps),
  BaseTextProps(sourceProps, rawProps),
  paragraphAttributes(convertRawProp(rawProps, sourceProps.paragraphAttributes)),
  isSelectable(convertRawProp(rawProps, "selectable", sourceProps.isSelectable)) {};

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ParagraphProps::getDebugProps() const {
  return
    ViewProps::getDebugProps() +
    BaseTextProps::getDebugProps() +
    paragraphAttributes.getDebugProps() +
    SharedDebugStringConvertibleList {
      debugStringConvertibleItem("isSelectable", isSelectable)
    };
}

} // namespace ReactABI31_0_0
} // namespace facebook
