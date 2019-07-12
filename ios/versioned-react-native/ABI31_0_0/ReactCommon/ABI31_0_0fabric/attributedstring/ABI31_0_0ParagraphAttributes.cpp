/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0ParagraphAttributes.h"

#include <ABI31_0_0fabric/ABI31_0_0attributedstring/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0graphics/conversions.h>
#include <ABI31_0_0fabric/ABI31_0_0debug/debugStringConvertibleUtils.h>

namespace facebook {
namespace ReactABI31_0_0 {

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ParagraphAttributes::getDebugProps() const {
  return {
    debugStringConvertibleItem("maximumNumberOfLines", maximumNumberOfLines),
    debugStringConvertibleItem("ellipsizeMode", ellipsizeMode),
    debugStringConvertibleItem("adjustsFontSizeToFit", adjustsFontSizeToFit),
    debugStringConvertibleItem("minimumFontSize", minimumFontSize),
    debugStringConvertibleItem("maximumFontSize", maximumFontSize)
  };
}

} // namespace ReactABI31_0_0
} // namespace facebook
