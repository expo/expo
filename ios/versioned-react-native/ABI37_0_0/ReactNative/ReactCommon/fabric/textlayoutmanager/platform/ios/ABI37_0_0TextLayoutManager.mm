/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI37_0_0TextLayoutManager.h"

#import "ABI37_0_0RCTTextLayoutManager.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

TextLayoutManager::TextLayoutManager(ContextContainer::Shared const &contextContainer)
{
  self_ = (__bridge_retained void *)[ABI37_0_0RCTTextLayoutManager new];
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
  ABI37_0_0RCTTextLayoutManager *textLayoutManager =
      (__bridge ABI37_0_0RCTTextLayoutManager *)self_;
  return [textLayoutManager measureWithAttributedString:attributedString
                                    paragraphAttributes:paragraphAttributes
                                      layoutConstraints:layoutConstraints];
}

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
