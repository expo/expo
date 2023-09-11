/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI48_0_0AndroidTextInputState.h"

#include <ABI48_0_0React/ABI48_0_0renderer/components/text/conversions.h>
#include <ABI48_0_0React/ABI48_0_0renderer/debug/debugStringConvertibleUtils.h>

#ifdef ANDROID
#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBuffer.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBufferBuilder.h>
#endif

#include <utility>

namespace ABI48_0_0facebook::ABI48_0_0React {

AndroidTextInputState::AndroidTextInputState(
    int64_t mostRecentEventCount,
    AttributedString attributedString,
    AttributedString ABI48_0_0ReactTreeAttributedString,
    ParagraphAttributes paragraphAttributes,
    TextAttributes defaultTextAttributes,
    ShadowView defaultParentShadowView,
    float defaultThemePaddingStart,
    float defaultThemePaddingEnd,
    float defaultThemePaddingTop,
    float defaultThemePaddingBottom)
    : mostRecentEventCount(mostRecentEventCount),
      attributedString(std::move(attributedString)),
      ABI48_0_0ReactTreeAttributedString(std::move(ABI48_0_0ReactTreeAttributedString)),
      paragraphAttributes(std::move(paragraphAttributes)),
      defaultTextAttributes(std::move(defaultTextAttributes)),
      defaultParentShadowView(std::move(defaultParentShadowView)),
      defaultThemePaddingStart(defaultThemePaddingStart),
      defaultThemePaddingEnd(defaultThemePaddingEnd),
      defaultThemePaddingTop(defaultThemePaddingTop),
      defaultThemePaddingBottom(defaultThemePaddingBottom) {}

AndroidTextInputState::AndroidTextInputState(
    AndroidTextInputState const &previousState,
    folly::dynamic const &data)
    : mostRecentEventCount(data.getDefault(
                                   "mostRecentEventCount",
                                   previousState.mostRecentEventCount)
                               .getInt()),
      cachedAttributedStringId(data.getDefault(
                                       "opaqueCacheId",
                                       previousState.cachedAttributedStringId)
                                   .getInt()),
      attributedString(previousState.attributedString),
      ABI48_0_0ReactTreeAttributedString(previousState.ABI48_0_0ReactTreeAttributedString),
      paragraphAttributes(previousState.paragraphAttributes),
      defaultTextAttributes(previousState.defaultTextAttributes),
      defaultParentShadowView(previousState.defaultParentShadowView),
      defaultThemePaddingStart(data.getDefault(
                                       "themePaddingStart",
                                       previousState.defaultThemePaddingStart)
                                   .getDouble()),
      defaultThemePaddingEnd(data.getDefault(
                                     "themePaddingEnd",
                                     previousState.defaultThemePaddingEnd)
                                 .getDouble()),
      defaultThemePaddingTop(data.getDefault(
                                     "themePaddingTop",
                                     previousState.defaultThemePaddingTop)
                                 .getDouble()),
      defaultThemePaddingBottom(data.getDefault(
                                        "themePaddingBottom",
                                        previousState.defaultThemePaddingBottom)
                                    .getDouble()){};

#ifdef ANDROID
folly::dynamic AndroidTextInputState::getDynamic() const {
  // Java doesn't need all fields, so we don't pass them all along.
  folly::dynamic newState = folly::dynamic::object();

  // If we have a `cachedAttributedStringId` we know that we're (1) not trying
  // to set a new string, so we don't need to pass it along; (2) setState was
  // called from Java to trigger a relayout with a `cachedAttributedStringId`,
  // so Java has all up-to-date information and we should pass an empty map
  // through.
  if (cachedAttributedStringId == 0) {
    newState["mostRecentEventCount"] = mostRecentEventCount;
    newState["attributedString"] = toDynamic(attributedString);
    newState["hash"] = newState["attributedString"]["hash"];
    newState["paragraphAttributes"] =
        toDynamic(paragraphAttributes); // TODO: can we memoize this in Java?
  }
  return newState;
}

MapBuffer AndroidTextInputState::getMapBuffer() const {
  auto builder = MapBufferBuilder();
  // See comment in getDynamic block.
  if (cachedAttributedStringId == 0) {
    builder.putInt(TX_STATE_KEY_MOST_RECENT_EVENT_COUNT, mostRecentEventCount);

    auto attStringMapBuffer = toMapBuffer(attributedString);
    builder.putMapBuffer(TX_STATE_KEY_ATTRIBUTED_STRING, attStringMapBuffer);
    auto paMapBuffer = toMapBuffer(paragraphAttributes);
    builder.putMapBuffer(TX_STATE_KEY_PARAGRAPH_ATTRIBUTES, paMapBuffer);

    builder.putInt(TX_STATE_KEY_HASH, attStringMapBuffer.getInt(AS_KEY_HASH));
  }
  return builder.build();
}

#endif

} // namespace ABI48_0_0facebook::ABI48_0_0React
