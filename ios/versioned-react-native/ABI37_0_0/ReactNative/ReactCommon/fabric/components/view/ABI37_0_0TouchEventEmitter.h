/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <ABI37_0_0React/core/EventEmitter.h>
#include <ABI37_0_0React/core/LayoutMetrics.h>
#include <ABI37_0_0React/core/ABI37_0_0ReactPrimitives.h>
#include <ABI37_0_0React/debug/DebugStringConvertible.h>
#include <ABI37_0_0React/components/view/TouchEvent.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

class TouchEventEmitter;

using SharedTouchEventEmitter = std::shared_ptr<TouchEventEmitter const>;

class TouchEventEmitter : public EventEmitter {
 public:
  using EventEmitter::EventEmitter;

  void onTouchStart(TouchEvent const &event) const;
  void onTouchMove(TouchEvent const &event) const;
  void onTouchEnd(TouchEvent const &event) const;
  void onTouchCancel(TouchEvent const &event) const;

 private:
  void dispatchTouchEvent(
      std::string const &type,
      TouchEvent const &event,
      EventPriority const &priority) const;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
