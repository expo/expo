// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewEventEmitter.h"

using namespace ABI49_0_0facebook;

namespace ABI49_0_0expo {

void ExpoViewEventEmitter::dispatch(std::string eventName, react::ValueFactory payloadFactory) const {
  dispatchEvent(eventName, payloadFactory);
}

} // namespace ABI49_0_0expo
