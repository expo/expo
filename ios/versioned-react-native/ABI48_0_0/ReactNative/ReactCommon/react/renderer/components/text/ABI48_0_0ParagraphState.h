/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0debug/ABI48_0_0React_native_assert.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/AttributedString.h>
#include <ABI48_0_0React/ABI48_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI48_0_0React/ABI48_0_0renderer/textlayoutmanager/TextLayoutManager.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBuffer.h>
#endif

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

#ifdef ANDROID
// constants for Text State serialization
constexpr static MapBuffer::Key TX_STATE_KEY_ATTRIBUTED_STRING = 0;
constexpr static MapBuffer::Key TX_STATE_KEY_PARAGRAPH_ATTRIBUTES = 1;
// Used for TextInput only
constexpr static MapBuffer::Key TX_STATE_KEY_HASH = 2;
constexpr static MapBuffer::Key TX_STATE_KEY_MOST_RECENT_EVENT_COUNT = 3;
#endif

/*
 * State for <Paragraph> component.
 * Represents what to render and how to render.
 */
class ParagraphState final {
 public:
  /*
   * All content of <Paragraph> component represented as an `AttributedString`.
   */
  AttributedString attributedString;

  /*
   * Represents all visual attributes of a paragraph of text represented as
   * a ParagraphAttributes.
   */
  ParagraphAttributes paragraphAttributes;

  /*
   * `TextLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   * This is not on every platform. This is not used on Android, but is
   * used on the iOS mounting layer.
   */
  std::weak_ptr<TextLayoutManager const> layoutManager;

#ifdef ANDROID
  ParagraphState(
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      std::weak_ptr<const TextLayoutManager> const &layoutManager)
      : attributedString(attributedString),
        paragraphAttributes(paragraphAttributes),
        layoutManager(layoutManager) {}
  ParagraphState() = default;
  ParagraphState(
      ParagraphState const &previousState,
      folly::dynamic const &data) {
    ABI48_0_0React_native_assert(false && "Not supported");
  };
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const;
#endif
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
