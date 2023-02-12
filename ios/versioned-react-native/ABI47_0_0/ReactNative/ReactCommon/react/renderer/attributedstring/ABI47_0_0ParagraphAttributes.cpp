/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0ParagraphAttributes.h"

#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/conversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/debug/debugStringConvertibleUtils.h>
#include <ABI47_0_0React/ABI47_0_0renderer/graphics/conversions.h>
#include <ABI47_0_0React/ABI47_0_0utils/FloatComparison.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

bool ParagraphAttributes::operator==(const ParagraphAttributes &rhs) const {
  return std::tie(
             maximumNumberOfLines,
             ellipsizeMode,
             textBreakStrategy,
             adjustsFontSizeToFit,
             includeFontPadding,
             android_hyphenationFrequency) ==
      std::tie(
             rhs.maximumNumberOfLines,
             rhs.ellipsizeMode,
             rhs.textBreakStrategy,
             rhs.adjustsFontSizeToFit,
             rhs.includeFontPadding,
             rhs.android_hyphenationFrequency) &&
      floatEquality(minimumFontSize, rhs.minimumFontSize) &&
      floatEquality(maximumFontSize, rhs.maximumFontSize);
}

bool ParagraphAttributes::operator!=(const ParagraphAttributes &rhs) const {
  return !(*this == rhs);
}

#pragma mark - DebugStringConvertible

#if ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ParagraphAttributes::getDebugProps() const {
  return {
      debugStringConvertibleItem("maximumNumberOfLines", maximumNumberOfLines),
      debugStringConvertibleItem("ellipsizeMode", ellipsizeMode),
      debugStringConvertibleItem("textBreakStrategy", textBreakStrategy),
      debugStringConvertibleItem("adjustsFontSizeToFit", adjustsFontSizeToFit),
      debugStringConvertibleItem("minimumFontSize", minimumFontSize),
      debugStringConvertibleItem("maximumFontSize", maximumFontSize),
      debugStringConvertibleItem("includeFontPadding", includeFontPadding),
      debugStringConvertibleItem(
          "android_hyphenationFrequency", android_hyphenationFrequency)};
}
#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
