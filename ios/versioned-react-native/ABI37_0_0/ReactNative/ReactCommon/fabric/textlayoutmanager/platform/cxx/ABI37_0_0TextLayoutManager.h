/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI37_0_0React/attributedstring/AttributedString.h>
#include <ABI37_0_0React/attributedstring/ParagraphAttributes.h>
#include <ABI37_0_0React/core/LayoutConstraints.h>
#include <ABI37_0_0React/utils/ContextContainer.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class TextLayoutManager;

using SharedTextLayoutManager = std::shared_ptr<const TextLayoutManager>;

/*
 * Cross platform facade for Android-specific TextLayoutManager.
 */
class TextLayoutManager {
 public:
  TextLayoutManager(const ContextContainer::Shared &contextContainer)
      : contextContainer_(contextContainer){};
  ~TextLayoutManager();

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  Size measure(
      AttributedString attributedString,
      ParagraphAttributes paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  /*
   * Returns an opaque pointer to platform-specific TextLayoutManager.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  void *getNativeTextLayoutManager() const;

 private:
  void *self_;

  ContextContainer::Shared contextContainer_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
