/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0TextLayoutManager.h"

namespace facebook {
namespace ReactABI31_0_0 {

TextLayoutManager::TextLayoutManager() {
}

TextLayoutManager::~TextLayoutManager() {
}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

Size TextLayoutManager::measure(
  AttributedString attributedString,
  ParagraphAttributes paragraphAttributes,
  LayoutConstraints layoutConstraints
) const {
  // Not implemented.
  return {};
}

} // namespace ReactABI31_0_0
} // namespace facebook
