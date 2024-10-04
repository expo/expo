/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0EventEmitter.h"

#include <folly/dynamic.h>
#include <ABI42_0_0jsi/ABI42_0_0JSIDynamic.h>
#include <ABI42_0_0jsi/ABI42_0_0jsi.h>
#include <ABI42_0_0React/debug/SystraceSection.h>

#include "ABI42_0_0RawEvent.h"

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

// TODO(T29874519): Get rid of "top" prefix once and for all.
/*
 * Capitalizes the first letter of the event type and adds "top" prefix if
 * necessary (e.g. "layout" becames "topLayout").
 */
static std::string normalizeEventType(const std::string &type) {
  auto prefixedType = type;
  if (type.find("top", 0) != 0) {
    prefixedType.insert(0, "top");
    prefixedType[3] = toupper(prefixedType[3]);
  }
  return prefixedType;
}

std::mutex &EventEmitter::DispatchMutex() {
  static std::mutex mutex;
  return mutex;
}

ValueFactory EventEmitter::defaultPayloadFactory() {
  static auto payloadFactory =
      ValueFactory{[](jsi::Runtime &runtime) { return jsi::Object(runtime); }};
  return payloadFactory;
}

EventEmitter::EventEmitter(
    SharedEventTarget eventTarget,
    Tag tag,
    EventDispatcher::Weak eventDispatcher)
    : eventTarget_(std::move(eventTarget)),
      eventDispatcher_(std::move(eventDispatcher)) {}

void EventEmitter::dispatchEvent(
    const std::string &type,
    const folly::dynamic &payload,
    const EventPriority &priority) const {
  dispatchEvent(
      type,
      [payload](jsi::Runtime &runtime) {
        return valueFromDynamic(runtime, payload);
      },
      priority);
}

void EventEmitter::dispatchEvent(
    const std::string &type,
    const ValueFactory &payloadFactory,
    const EventPriority &priority) const {
  SystraceSection s("EventEmitter::dispatchEvent");

  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  eventDispatcher->dispatchEvent(
      RawEvent(normalizeEventType(type), payloadFactory, eventTarget_),
      priority);
}

void EventEmitter::setEnabled(bool enabled) const {
  enableCounter_ += enabled ? 1 : -1;

  bool shouldBeEnabled = enableCounter_ > 0;
  if (isEnabled_ != shouldBeEnabled) {
    isEnabled_ = shouldBeEnabled;
    if (eventTarget_) {
      eventTarget_->setEnabled(isEnabled_);
    }
  }

  // Note: Initially, the state of `eventTarget_` and the value `enableCounter_`
  // is mismatched intentionally (it's `non-null` and `0` accordingly). We need
  // this to support an initial nebula state where the event target must be
  // retained without any associated mounted node.
  bool shouldBeRetained = enableCounter_ > 0;
  if (shouldBeRetained != (eventTarget_ != nullptr)) {
    if (!shouldBeRetained) {
      eventTarget_.reset();
    }
  }
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
