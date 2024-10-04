/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/view/PointerEvent.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/TouchEvent.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventEmitter.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0LayoutMetrics.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ReactPrimitives.h>
#include <ABI49_0_0React/renderer/debug/ABI49_0_0DebugStringConvertible.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class TouchEventEmitter;

using SharedTouchEventEmitter = std::shared_ptr<TouchEventEmitter const>;

class TouchEventEmitter : public EventEmitter {
 public:
  using EventEmitter::EventEmitter;

  void onTouchStart(TouchEvent const &event) const;
  void onTouchMove(TouchEvent const &event) const;
  void onTouchEnd(TouchEvent const &event) const;
  void onTouchCancel(TouchEvent const &event) const;

  void onPointerCancel(PointerEvent const &event) const;
  void onPointerDown(PointerEvent const &event) const;
  void onPointerMove(PointerEvent const &event) const;
  void onPointerUp(PointerEvent const &event) const;
  void onPointerEnter(PointerEvent const &event) const;
  void onPointerLeave(PointerEvent const &event) const;
  void onPointerOver(PointerEvent const &event) const;
  void onPointerOut(PointerEvent const &event) const;

 private:
  void dispatchTouchEvent(
      std::string type,
      TouchEvent const &event,
      EventPriority priority,
      RawEvent::Category category) const;
  void dispatchPointerEvent(
      std::string type,
      PointerEvent const &event,
      EventPriority priority,
      RawEvent::Category category) const;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
