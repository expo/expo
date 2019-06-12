/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI33_0_0ScrollViewEventEmitter.h"

namespace facebook {
namespace ReactABI33_0_0 {

static ABI33_0_0jsi::Value scrollViewMetricsPayload(
    ABI33_0_0jsi::Runtime &runtime,
    const ScrollViewMetrics &scrollViewMetrics) {
  auto payload = ABI33_0_0jsi::Object(runtime);

  {
    auto contentOffset = ABI33_0_0jsi::Object(runtime);
    contentOffset.setProperty(runtime, "x", scrollViewMetrics.contentOffset.x);
    contentOffset.setProperty(runtime, "y", scrollViewMetrics.contentOffset.y);
    payload.setProperty(runtime, "contentOffset", contentOffset);
  }

  {
    auto contentInset = ABI33_0_0jsi::Object(runtime);
    contentInset.setProperty(
        runtime, "top", scrollViewMetrics.contentInset.top);
    contentInset.setProperty(
        runtime, "left", scrollViewMetrics.contentInset.left);
    contentInset.setProperty(
        runtime, "bottom", scrollViewMetrics.contentInset.bottom);
    contentInset.setProperty(
        runtime, "right", scrollViewMetrics.contentInset.right);
    payload.setProperty(runtime, "contentInset", contentInset);
  }

  {
    auto contentSize = ABI33_0_0jsi::Object(runtime);
    contentSize.setProperty(
        runtime, "width", scrollViewMetrics.contentSize.width);
    contentSize.setProperty(
        runtime, "height", scrollViewMetrics.contentSize.height);
    payload.setProperty(runtime, "contentSize", contentSize);
  }

  {
    auto containerSize = ABI33_0_0jsi::Object(runtime);
    containerSize.setProperty(
        runtime, "width", scrollViewMetrics.containerSize.width);
    containerSize.setProperty(
        runtime, "height", scrollViewMetrics.containerSize.height);
    payload.setProperty(runtime, "layoutMeasurement", containerSize);
  }

  payload.setProperty(runtime, "zoomScale", scrollViewMetrics.zoomScale);

  return payload;
}

void ScrollViewEventEmitter::onScroll(
    const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("scroll", scrollViewMetrics);
}

void ScrollViewEventEmitter::onScrollBeginDrag(
    const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("scrollBeginDrag", scrollViewMetrics);
}

void ScrollViewEventEmitter::onScrollEndDrag(
    const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("scrollEndDrag", scrollViewMetrics);
}

void ScrollViewEventEmitter::onMomentumScrollBegin(
    const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("momentumScrollBegin", scrollViewMetrics);
}

void ScrollViewEventEmitter::onMomentumScrollEnd(
    const ScrollViewMetrics &scrollViewMetrics) const {
  dispatchScrollViewEvent("momentumScrollEnd", scrollViewMetrics);
}

void ScrollViewEventEmitter::dispatchScrollViewEvent(
    const std::string &name,
    const ScrollViewMetrics &scrollViewMetrics,
    EventPriority priority) const {
  dispatchEvent(
      name,
      [scrollViewMetrics](ABI33_0_0jsi::Runtime &runtime) {
        return scrollViewMetricsPayload(runtime, scrollViewMetrics);
      },
      priority);
}

} // namespace ReactABI33_0_0
} // namespace facebook
