/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI48_0_0React/ABI48_0_0renderer/graphics/Geometry.h>

#ifdef ANDROID
#include <folly/dynamic.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBuffer.h>
#include <ABI48_0_0React/ABI48_0_0renderer/mapbuffer/MapBufferBuilder.h>
#endif

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

/*
 * State for <ScrollView> component.
 */
class ScrollViewState final {
 public:
  Point contentOffset;
  Rect contentBoundingRect;
  int scrollAwayPaddingTop;

  /*
   * Returns size of scrollable area.
   */
  Size getContentSize() const;

#ifdef ANDROID
  ScrollViewState() = default;
  ScrollViewState(ScrollViewState const &previousState, folly::dynamic data)
      : contentOffset(
            {(Float)data["contentOffsetLeft"].getDouble(),
             (Float)data["contentOffsetTop"].getDouble()}),
        contentBoundingRect({}),
        scrollAwayPaddingTop((Float)data["scrollAwayPaddingTop"].getDouble()){};

  folly::dynamic getDynamic() const {
    return folly::dynamic::object("contentOffsetLeft", contentOffset.x)(
        "contentOffsetTop", contentOffset.y)(
        "scrollAwayPaddingTop", scrollAwayPaddingTop);
  };
  MapBuffer getMapBuffer() const {
    return MapBufferBuilder::EMPTY();
  };
#endif
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
