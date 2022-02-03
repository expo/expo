/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI43_0_0React/ABI43_0_0renderer/attributedstring/AttributedString.h>
#include <ABI43_0_0React/ABI43_0_0renderer/attributedstring/AttributedStringBox.h>
#include <ABI43_0_0React/ABI43_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/LayoutConstraints.h>
#include <ABI43_0_0React/ABI43_0_0renderer/textlayoutmanager/TextMeasureCache.h>
#include <ABI43_0_0React/ABI43_0_0utils/ContextContainer.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

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
   * Measures `attributedStringBox` using native text rendering infrastructure.
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
  void *self_;

  ContextContainer::Shared contextContainer_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
