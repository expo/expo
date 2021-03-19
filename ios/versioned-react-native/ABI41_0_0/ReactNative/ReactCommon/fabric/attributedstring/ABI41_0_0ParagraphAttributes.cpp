/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI41_0_0ParagraphAttributes.h"

#include <ABI41_0_0React/attributedstring/conversions.h>
#include <ABI41_0_0React/debug/debugStringConvertibleUtils.h>
#include <ABI41_0_0React/graphics/conversions.h>
#include <ABI41_0_0React/utils/FloatComparison.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

bool ParagraphAttributes::operator==(const ParagraphAttributes &rhs) const {
  return std::tie(
             maximumNumberOfLines,
             ellipsizeMode,
             textBreakStrategy,
             adjustsFontSizeToFit) ==
      std::tie(
             rhs.maximumNumberOfLines,
             rhs.ellipsizeMode,
             rhs.textBreakStrategy,
             rhs.adjustsFontSizeToFit) &&
      floatEquality(minimumFontSize, rhs.minimumFontSize) &&
      floatEquality(maximumFontSize, rhs.maximumFontSize);
}

bool ParagraphAttributes::operator!=(const ParagraphAttributes &rhs) const {
  return !(*this == rhs);
}

#pragma mark - DebugStringConvertible

#if ABI41_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphAttributes::getDebugProps() const {
  return {
      debugStringConvertibleItem("maximumNumberOfLines", maximumNumberOfLines),
      debugStringConvertibleItem("ellipsizeMode", ellipsizeMode),
      debugStringConvertibleItem("textBreakStrategy", textBreakStrategy),
      debugStringConvertibleItem("adjustsFontSizeToFit", adjustsFontSizeToFit),
      debugStringConvertibleItem("minimumFontSize", minimumFontSize),
      debugStringConvertibleItem("maximumFontSize", maximumFontSize)};
}
#endif

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
