/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0ParagraphAttributes.h"

#include <ReactABI34_0_0/attributedstring/conversions.h>
#include <ReactABI34_0_0/debug/debugStringConvertibleUtils.h>
#include <ReactABI34_0_0/graphics/conversions.h>
#include <ReactABI34_0_0/utils/FloatComparison.h>

namespace facebook {
namespace ReactABI34_0_0 {

bool ParagraphAttributes::operator==(const ParagraphAttributes &rhs) const {
  return std::tie(maximumNumberOfLines, ellipsizeMode, adjustsFontSizeToFit) ==
      std::tie(
             rhs.maximumNumberOfLines,
             rhs.ellipsizeMode,
             rhs.adjustsFontSizeToFit) &&
      floatEquality(minimumFontSize, rhs.minimumFontSize) &&
      floatEquality(maximumFontSize, rhs.maximumFontSize);
}

bool ParagraphAttributes::operator!=(const ParagraphAttributes &rhs) const {
  return !(*this == rhs);
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphAttributes::getDebugProps() const {
  return {
      debugStringConvertibleItem("maximumNumberOfLines", maximumNumberOfLines),
      debugStringConvertibleItem("ellipsizeMode", ellipsizeMode),
      debugStringConvertibleItem("adjustsFontSizeToFit", adjustsFontSizeToFit),
      debugStringConvertibleItem("minimumFontSize", minimumFontSize),
      debugStringConvertibleItem("maximumFontSize", maximumFontSize)};
}
#endif

} // namespace ReactABI34_0_0
} // namespace facebook
