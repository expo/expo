/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/conversions.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/text/ParagraphState.h>
#ifdef ANDROID
#include <ABI47_0_0React/ABI47_0_0renderer/mapbuffer/MapBuffer.h>
#include <ABI47_0_0React/ABI47_0_0renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

#ifdef ANDROID
inline folly::dynamic toDynamic(ParagraphState const &paragraphState) {
  folly::dynamic newState = folly::dynamic::object();
  newState["attributedString"] = toDynamic(paragraphState.attributedString);
  newState["paragraphAttributes"] =
      toDynamic(paragraphState.paragraphAttributes);
  newState["hash"] = newState["attributedString"]["hash"];
  return newState;
}

// constants for Text State serialization
constexpr static MapBuffer::Key TX_STATE_KEY_ATTRIBUTED_STRING = 0;
constexpr static MapBuffer::Key TX_STATE_KEY_PARAGRAPH_ATTRIBUTES = 1;
// Used for TextInput
constexpr static MapBuffer::Key TX_STATE_KEY_HASH = 2;
constexpr static MapBuffer::Key TX_STATE_KEY_MOST_RECENT_EVENT_COUNT = 3;

inline MapBuffer toMapBuffer(ParagraphState const &paragraphState) {
  auto builder = MapBufferBuilder();
  auto attStringMapBuffer = toMapBuffer(paragraphState.attributedString);
  builder.putMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING, attStringMapBuffer);
  auto paMapBuffer = toMapBuffer(paragraphState.paragraphAttributes);
  builder.putMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES, paMapBuffer);
  // TODO: Used for TextInput
  builder.putInt(TX_STATE_KEY_HASH, 1234);
  return builder.build();
}
#endif

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
