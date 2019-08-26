/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI31_0_0fabric/ABI31_0_0components/scrollview/primitives.h>
#include <ABI31_0_0fabric/ABI31_0_0components/view/ViewProps.h>

namespace facebook {
namespace ReactABI31_0_0 {

// TODO (T28334063): Consider for codegen.
class ScrollViewProps final:
  public ViewProps {

public:
  ScrollViewProps() = default;
  ScrollViewProps(const ScrollViewProps &sourceProps, const RawProps &rawProps);

#pragma mark - Props

  const bool alwaysBounceHorizontal {true};
  const bool alwaysBounceVertical {true};
  const bool bounces {true};
  const bool bouncesZoom {true};
  const bool canCancelContentTouches {true};
  const bool centerContent {};
  const bool automaticallyAdjustContentInsets  {};
  const Float decelerationRate {0.998};
  const bool directionalLockEnabled {};
  const ScrollViewIndicatorStyle indicatorStyle {};
  const ScrollViewKeyboardDismissMode keyboardDismissMode {};
  const Float maximumZoomScale {1.0};
  const Float minimumZoomScale {1.0};
  const bool scrollEnabled {true};
  const bool pagingEnabled {};
  const bool pinchGestureEnabled {true};
  const bool scrollsToTop {true};
  const bool showsHorizontalScrollIndicator {true};
  const bool showsVerticalScrollIndicator {true};
  const Float scrollEventThrottle {};
  const Float zoomScale {1.0};
  const EdgeInsets contentInset {};
  const EdgeInsets scrollIndicatorInsets {};
  const int snapToInterval {};
  const ScrollViewSnapToAlignment snapToAlignment {};

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;
};

} // namespace ReactABI31_0_0
} // namespace facebook

