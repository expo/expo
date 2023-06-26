/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedString.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0ParagraphAttributes.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutConstraints.h>
#include <ABI49_0_0React/renderer/textlayoutmanager/ABI49_0_0TextLayoutManager.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

/*
 * Serves as a middle man between `ParagraphShadowNode` and `TextLayoutManager`.
 * On iOS, caches `NSTextStorage` for individual `ParagraphShadowNode` to make
 * sure only one `NSTextStorage` is created for every string. `NSTextStorage`
 * can be re created on native views layer but it is expensive. On Android, this
 * class does not cache anything.
 */
class ParagraphLayoutManager {
 public:
  TextMeasurement measure(
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  LinesMeasurements measureLines(
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      Size size) const;

  void setTextLayoutManager(
      std::shared_ptr<TextLayoutManager const> textLayoutManager) const;

  /*
   * Returns an opaque pointer to platform-specific `TextLayoutManager`.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  std::shared_ptr<TextLayoutManager const> getTextLayoutManager() const;

  /*
   * Returns opaque shared_ptr holding `NSTextStorage`.
   * May be nullptr.
   * Is used on a native views layer to prevent `NSTextStorage` from being
   * created twice.
   */
  std::shared_ptr<void> getHostTextStorage() const;

 private:
  std::shared_ptr<TextLayoutManager const> mutable textLayoutManager_{};
  std::shared_ptr<void> mutable hostTextStorage_{};

  /* The width Yoga set as maximum width.
   * Yoga sometimes calls measure twice with two
   * different maximum width. One if available space.
   * The other one is exact space needed for the string.
   * This happens when node is dirtied but its size is not affected.
   * To deal with this inefficiency, we cache `TextMeasurement` for each
   * `ParagraphShadowNode`. If Yoga tries to re-measure with available width
   * or exact width, we provide it with the cached value.
   */
  Float mutable availableWidth_{};
  TextMeasurement mutable cachedTextMeasurement_{};

  size_t mutable hash_{};
};
} // namespace ABI49_0_0facebook::ABI49_0_0React
