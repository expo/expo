/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI47_0_0React/ABI47_0_0config/ABI47_0_0ReactNativeConfig.h>
#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/AttributedString.h>
#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/AttributedStringBox.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/LayoutConstraints.h>
#include <ABI47_0_0React/ABI47_0_0renderer/textlayoutmanager/TextMeasureCache.h>
#include <ABI47_0_0React/ABI47_0_0utils/ContextContainer.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

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
      ParagraphAttributes paragraphAttributes,
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

  void *self_;
  ContextContainer::Shared contextContainer_;
  bool mapBufferSerializationEnabled_;
  TextMeasureCache measureCache_;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
