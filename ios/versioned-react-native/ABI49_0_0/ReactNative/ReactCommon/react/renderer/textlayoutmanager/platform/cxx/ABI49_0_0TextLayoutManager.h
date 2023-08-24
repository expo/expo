/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedString.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedStringBox.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0ParagraphAttributes.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutConstraints.h>
#include <ABI49_0_0React/renderer/textlayoutmanager/ABI49_0_0TextMeasureCache.h>
#include <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class TextLayoutManager;

using SharedTextLayoutManager = std::shared_ptr<const TextLayoutManager>;

/*
 * Cross platform facade for Android-specific TextLayoutManager.
 */
class TextLayoutManager {
 public:
  TextLayoutManager(const ContextContainer::Shared &contextContainer) {}

  /*
   * Measures `attributedStringBox` using native text rendering infrastructure.
   */
  TextMeasurement measure(
      AttributedStringBox attributedStringBox,
      ParagraphAttributes paragraphAttributes,
      LayoutConstraints layoutConstraints,
      std::shared_ptr<void>) const;

  /*
   * Measures lines of `attributedString` using native text rendering
   * infrastructure.
   */
  LinesMeasurements measureLines(
      AttributedString attributedString,
      ParagraphAttributes paragraphAttributes,
      Size size) const;

  /*
   * Returns an opaque pointer to platform-specific TextLayoutManager.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  void *getNativeTextLayoutManager() const;

  std::shared_ptr<void> getHostTextStorage(
      AttributedString attributedStringBox,
      ParagraphAttributes paragraphAttributes,
      LayoutConstraints layoutConstraints) const;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
