/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0EventListener.h"

namespace ABI47_0_0facebook::ABI47_0_0React {

bool EventListenerContainer::willDispatchEvent(const RawEvent &event) {
  std::shared_lock<butter::shared_mutex> lock(mutex_);

  bool handled = false;
  for (auto const &listener : eventListeners_) {
    handled = handled || listener->operator()(event);
  }
  return handled;
}

void EventListenerContainer::addListener(
    const std::shared_ptr<EventListener const> &listener) {
  std::unique_lock<butter::shared_mutex> lock(mutex_);

  eventListeners_.push_back(listener);
}

void EventListenerContainer::removeListener(
    const std::shared_ptr<EventListener const> &listener) {
  std::unique_lock<butter::shared_mutex> lock(mutex_);

  auto it = std::find(eventListeners_.begin(), eventListeners_.end(), listener);
  if (it != eventListeners_.end()) {
    eventListeners_.erase(it);
  }
}

} // namespace ABI47_0_0facebook::ABI47_0_0React
