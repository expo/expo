/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0TextLayoutManager.h"

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

TextLayoutManager::~TextLayoutManager() {}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

Size TextLayoutManager::measure(
    AttributedStringBox attributedStringBox,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const {
  return Size{0, 0};
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
