/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI33_0_0TextLayoutManager.h"

#import "ABI33_0_0RCTTextLayoutManager.h"

namespace facebook {
namespace ReactABI33_0_0 {

TextLayoutManager::TextLayoutManager(
    const SharedContextContainer &contextContainer) {
  self_ = (__bridge_retained void *)[ABI33_0_0RCTTextLayoutManager new];
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
    LayoutConstraints layoutConstraints) const {
  ABI33_0_0RCTTextLayoutManager *textLayoutManager =
      (__bridge ABI33_0_0RCTTextLayoutManager *)self_;
  return [textLayoutManager measureWithAttributedString:attributedString
                                    paragraphAttributes:paragraphAttributes
                                      layoutConstraints:layoutConstraints];
}

} // namespace ReactABI33_0_0
} // namespace facebook
