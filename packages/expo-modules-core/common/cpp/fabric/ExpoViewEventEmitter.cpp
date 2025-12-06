// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewEventEmitter.h"

#include <utility>

using namespace facebook;

namespace expo {

void ExpoViewEventEmitter::dispatch(std::string eventName, const react::ValueFactory& payloadFactory) const {
  dispatchEvent(std::move(eventName), payloadFactory);
}

} // namespace expo
