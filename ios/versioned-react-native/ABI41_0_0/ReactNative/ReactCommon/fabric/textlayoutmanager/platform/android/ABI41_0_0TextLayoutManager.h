/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI41_0_0React/attributedstring/AttributedString.h>
#include <ABI41_0_0React/attributedstring/AttributedStringBox.h>
#include <ABI41_0_0React/core/LayoutConstraints.h>
#include <ABI41_0_0React/textlayoutmanager/TextMeasureCache.h>
#include <ABI41_0_0React/utils/ContextContainer.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

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
  TextMeasurement measure(
      AttributedStringBox attributedStringBox,
      ParagraphAttributes paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  /*
   * Returns an opaque pointer to platform-specific TextLayoutManager.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  void *getNativeTextLayoutManager() const;

 private:
  TextMeasurement doMeasure(
      AttributedString attributedString,
      ParagraphAttributes paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  void *self_;
  ContextContainer::Shared contextContainer_;
  TextMeasureCache measureCache_{};
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
