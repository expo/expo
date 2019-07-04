/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI31_0_0TextLayoutManager.h"

#import "ABI31_0_0RCTTextLayoutManager.h"

namespace facebook {
namespace ReactABI31_0_0 {

TextLayoutManager::TextLayoutManager() {
  self_ = (__bridge_retained void *)[ABI31_0_0RCTTextLayoutManager new];
}

TextLayoutManager::~TextLayoutManager() {
  CFRelease(self_);
  self_ = nullptr;
}

void *TextLayoutManager::getNativeTextLayoutManager() const {
  return self_;
}

Size TextLayoutManager::measure(
  AttributedString attributedString,
  ParagraphAttributes paragraphAttributes,
  LayoutConstraints layoutConstraints
) const {
  ABI31_0_0RCTTextLayoutManager *textLayoutManager = (__bridge ABI31_0_0RCTTextLayoutManager *)self_;
  return [textLayoutManager measureWithAttributedString:attributedString
                                    paragraphAttributes:paragraphAttributes
                                      layoutConstraints:layoutConstraints];
}

} // namespace ReactABI31_0_0
} // namespace facebook
