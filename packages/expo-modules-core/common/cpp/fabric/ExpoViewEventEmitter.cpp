// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewEventEmitter.h"

#include <utility>

using namespace facebook;

namespace expo {

void ExpoViewEventEmitter::dispatch(const std::string &eventName, const react::ValueFactory& payloadFactory) const {
  dispatchEvent(eventName, payloadFactory);
}

} // namespace expo
