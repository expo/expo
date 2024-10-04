/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI42_0_0React/graphics/Geometry.h>

#include <folly/dynamic.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/*
 * State for <ScrollView> component.
 */
class ScrollViewState final {
 public:
  Point contentOffset;
  Rect contentBoundingRect;

  /*
   * Returns size of scrollable area.
   */
  Size getContentSize() const;

#ifdef ANDROID
  ScrollViewState() = default;
  ScrollViewState(ScrollViewState const &previousState, folly::dynamic data)
      : contentOffset({(Float)data["contentOffsetLeft"].getDouble(),
                       (Float)data["contentOffsetTop"].getDouble()}),
        contentBoundingRect({}){};

  folly::dynamic getDynamic() const {
    return folly::dynamic::object("contentOffsetLeft", contentOffset.x)(
        "contentOffsetTop", contentOffset.y);
  };
#endif
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
