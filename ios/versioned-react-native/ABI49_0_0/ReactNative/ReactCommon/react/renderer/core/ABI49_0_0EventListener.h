/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <shared_mutex>
#include <string>

#include <ABI49_0_0React/renderer/core/ABI49_0_0RawEvent.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/**
 * Listener for events dispatched to JS runtime.
 * Return `true` to interrupt default dispatch to JS event emitter, `false` to
 * pass through to default handlers.
 */
using EventListener = std::function<bool(const RawEvent &event)>;

class EventListenerContainer {
 public:
  /*
   * Invoke listeners in this container with the event.
   * Returns true if event was handled by the listener, false to continue
   * default dispatch.
   */
  bool willDispatchEvent(const RawEvent &event);

  void addListener(const std::shared_ptr<EventListener const> &listener);
  void removeListener(const std::shared_ptr<EventListener const> &listener);

 private:
  std::shared_mutex mutex_;
  std::vector<std::shared_ptr<EventListener const>> eventListeners_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
