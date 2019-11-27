/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI36_0_0TextLayoutManager.h"

#import "ABI36_0_0RCTTextLayoutManager.h"

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

TextLayoutManager::TextLayoutManager(ContextContainer::Shared const &contextContainer)
{
  self_ = (__bridge_retained void *)[ABI36_0_0RCTTextLayoutManager new];
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
  ABI36_0_0RCTTextLayoutManager *textLayoutManager =
      (__bridge ABI36_0_0RCTTextLayoutManager *)self_;
  return [textLayoutManager measureWithAttributedString:attributedString
                                    paragraphAttributes:paragraphAttributes
                                      layoutConstraints:layoutConstraints];
}

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook
