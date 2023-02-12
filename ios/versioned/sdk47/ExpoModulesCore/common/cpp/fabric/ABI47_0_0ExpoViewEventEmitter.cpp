// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewEventEmitter.h"

using namespace ABI47_0_0facebook;

namespace ABI47_0_0expo {

void ExpoViewEventEmitter::dispatch(std::string eventName, react::ValueFactory payloadFactory) const {
  dispatchEvent(eventName, payloadFactory);
}

} // namespace ABI47_0_0expo
