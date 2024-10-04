/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/debug/ABI49_0_0React_native_assert.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0AttributedString.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0ParagraphAttributes.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/ParagraphLayoutManager.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <ABI49_0_0React/renderer/mapbuffer/ABI49_0_0MapBuffer.h>
#endif

namespace ABI49_0_0facebook::ABI49_0_0React {

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
struct ParagraphState {
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
   * `ParagraphLayoutManager` provides a connection to platform-specific
   * text rendering infrastructure which is capable to render the
   * `AttributedString`.
   * This is not on every platform. This is not used on Android, but is
   * used on the iOS mounting layer.
   */
  ParagraphLayoutManager paragraphLayoutManager;

#ifdef ANDROID
  ParagraphState(
      AttributedString const &attributedString,
      ParagraphAttributes const &paragraphAttributes,
      ParagraphLayoutManager const &paragraphLayoutManager)
      : attributedString(attributedString),
        paragraphAttributes(paragraphAttributes),
        paragraphLayoutManager(paragraphLayoutManager) {}
  ParagraphState() = default;
  ParagraphState(
      ParagraphState const &previousState,
      folly::dynamic const &data) {
    ABI49_0_0React_native_assert(false && "Not supported");
  };
  folly::dynamic getDynamic() const;
  MapBuffer getMapBuffer() const;
#endif
};

} // namespace ABI49_0_0facebook::ABI49_0_0React
