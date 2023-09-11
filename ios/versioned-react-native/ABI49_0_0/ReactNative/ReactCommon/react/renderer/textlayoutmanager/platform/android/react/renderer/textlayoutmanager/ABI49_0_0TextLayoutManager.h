/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/config/ABI49_0_0ReactNativeConfig.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedString.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedStringBox.h>
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
  TextLayoutManager(const ContextContainer::Shared &contextContainer);

  /*
   * Not copyable.
   */
  TextLayoutManager(TextLayoutManager const &) = delete;
  TextLayoutManager &operator=(TextLayoutManager const &) = delete;

  /*
   * Not movable.
   */
  TextLayoutManager(TextLayoutManager &&) = delete;
  TextLayoutManager &operator=(TextLayoutManager &&) = delete;

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  TextMeasurement measure(
      AttributedStringBox const &attributedStringBox,
      ParagraphAttributes const &paragraphAttributes,
      LayoutConstraints layoutConstraints,
      std::shared_ptr<void> /* hostTextStorage */) const;

  std::shared_ptr<void> getHostTextStorage(
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  /**
   * Measures an AttributedString on the platform, as identified by some
   * opaque cache ID.
   */
  TextMeasurement measureCachedSpannableById(
      int64_t cacheId,
      ParagraphAttributes const &paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  /*
   * Measures lines of `attributedString` using native text rendering
   * infrastructure.
   */
  LinesMeasurements measureLines(
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      Size size) const;

  /*
   * Returns an opaque pointer to platform-specific TextLayoutManager.
   * Is used on a native views layer to delegate text rendering to the manager.
   */
  void *getNativeTextLayoutManager() const;

 private:
  TextMeasurement doMeasure(
      AttributedString attributedString,
      ParagraphAttributes const &paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  TextMeasurement doMeasureMapBuffer(
      AttributedString attributedString,
      ParagraphAttributes const &paragraphAttributes,
      LayoutConstraints layoutConstraints) const;

  LinesMeasurements measureLinesMapBuffer(
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      Size size) const;

  void *self_{};
  ContextContainer::Shared contextContainer_;
  TextMeasureCache measureCache_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
