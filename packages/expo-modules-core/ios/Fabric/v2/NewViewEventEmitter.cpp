// Copyright 2026-present 650 Industries. All rights reserved.

#include "NewViewEventEmitter.h"

#include <utility>

namespace react = facebook::react;

namespace expo::views {

void NewViewEventEmitter::dispatch(std::string eventName, const react::ValueFactory &payloadFactory) const {
  dispatchEvent(std::move(eventName), payloadFactory);
}

} // namespace expo::views
