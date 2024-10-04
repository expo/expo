/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI44_0_0TextLayoutManager.h"

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

TextLayoutManager::~TextLayoutManager() {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

TextMeasurement TextLayoutManager::measure(
    AttributedStringBox attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  return TextMeasurement{{0, 0}, {}};
}

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
