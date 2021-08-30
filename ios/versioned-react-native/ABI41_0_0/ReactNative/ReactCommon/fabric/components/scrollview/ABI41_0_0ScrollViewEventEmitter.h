/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <ABI41_0_0React/components/view/ViewEventEmitter.h>
#include <ABI41_0_0React/core/EventEmitter.h>
#include <ABI41_0_0React/graphics/Geometry.h>

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

class ScrollViewMetrics {
 public:
  Size contentSize;
  Point contentOffset;
  EdgeInsets contentInset;
  Size containerSize;
  Float zoomScale;
};

class ScrollViewEventEmitter;

using SharedScrollViewEventEmitter =
    std::shared_ptr<const ScrollViewEventEmitter>;

class ScrollViewEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onScroll(const ScrollViewMetrics &scrollViewMetrics) const;
  void onScrollBeginDrag(const ScrollViewMetrics &scrollViewMetrics) const;
  void onScrollEndDrag(const ScrollViewMetrics &scrollViewMetrics) const;
  void onMomentumScrollBegin(const ScrollViewMetrics &scrollViewMetrics) const;
  void onMomentumScrollEnd(const ScrollViewMetrics &scrollViewMetrics) const;

 private:
  void dispatchScrollViewEvent(
      const std::string &name,
      const ScrollViewMetrics &scrollViewMetrics,
      EventPriority priority = EventPriority::AsynchronousBatched) const;
};

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
