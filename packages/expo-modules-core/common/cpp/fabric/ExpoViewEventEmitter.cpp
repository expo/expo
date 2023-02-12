// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewEventEmitter.h"

using namespace facebook;

namespace expo {

void ExpoViewEventEmitter::dispatch(std::string eventName, react::ValueFactory payloadFactory) const {
  dispatchEvent(eventName, payloadFactory);
}

} // namespace expo
