/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <ABI49_0_0React/renderer/attributedstring/ABI49_0_0conversions.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/text/ParagraphState.h>
#ifdef ANDROID
#include <ABI49_0_0React/renderer/mapbuffer/ABI49_0_0MapBuffer.h>
#include <ABI49_0_0React/renderer/mapbuffer/ABI49_0_0MapBufferBuilder.h>
#endif

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

#ifdef ANDROID
inline folly::dynamic toDynamic(ParagraphState const &paragraphState) {
  folly::dynamic newState = folly::dynamic::object();
  newState["attributedString"] = toDynamic(paragraphState.attributedString);
  newState["paragraphAttributes"] =
      toDynamic(paragraphState.paragraphAttributes);
  newState["hash"] = newState["attributedString"]["hash"];
  return newState;
}

inline MapBuffer toMapBuffer(ParagraphState const &paragraphState) {
  auto builder = MapBufferBuilder();
  auto attStringMapBuffer = toMapBuffer(paragraphState.attributedString);
  builder.putMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING, attStringMapBuffer);
  auto paMapBuffer = toMapBuffer(paragraphState.paragraphAttributes);
  builder.putMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES, paMapBuffer);
  builder.putInt(TX_STATE_KEY_HASH, attStringMapBuffer.getInt(AS_KEY_HASH));
  return builder.build();
}
#endif

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
