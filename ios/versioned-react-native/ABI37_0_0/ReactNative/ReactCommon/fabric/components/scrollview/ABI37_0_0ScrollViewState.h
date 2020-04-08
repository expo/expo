/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI37_0_0React/graphics/Geometry.h>

#include <folly/dynamic.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

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
  ScrollViewState(folly::dynamic data){};
  folly::dynamic getDynamic() const {
    return {};
  };
#endif
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
