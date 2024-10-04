/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>

#include <ABI48_0_0React/ABI48_0_0renderer/core/LayoutMetrics.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ABI48_0_0ReactPrimitives.h>

#include "ABI48_0_0TouchEventEmitter.h"

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class ViewEventEmitter;

using SharedViewEventEmitter = std::shared_ptr<const ViewEventEmitter>;

class ViewEventEmitter : public TouchEventEmitter {
 public:
  using TouchEventEmitter::TouchEventEmitter;

#pragma mark - Accessibility

  void onAccessibilityAction(std::string const &name) const;
  void onAccessibilityTap() const;
  void onAccessibilityMagicTap() const;
  void onAccessibilityEscape() const;

#pragma mark - Layout

  void onLayout(const LayoutMetrics &layoutMetrics) const;

 private:
  /*
   * Contains the most recent `frame` and a `mutex` protecting access to it.
   */
  struct LayoutEventState {
    /*
     * Protects an access to other fields of the struct.
     */
    std::mutex mutex;

    /*
     * Last dispatched `frame` value or value that's being dispatched right now.
     */
    Rect frame{};

    /*
     * Indicates that the `frame` value was already dispatched (and dispatching
     * of the *same* value is not needed).
     */
    bool wasDispatched{false};

    /*
     * Indicates that some lambda is already being dispatching (and dispatching
     * another one is not needed).
     */
    bool isDispatching{false};
  };

  mutable std::shared_ptr<LayoutEventState> layoutEventState_{
      std::make_shared<LayoutEventState>()};
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
