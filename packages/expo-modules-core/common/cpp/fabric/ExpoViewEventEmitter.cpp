// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewEventEmitter.h"

#include <utility>

using namespace facebook;

namespace expo {

void ExpoViewEventEmitter::dispatch(const std::string &eventName, const react::ValueFactory& payloadFactory) const {
  dispatchEvent(eventName, payloadFactory);
}

void ExpoViewEventEmitter::experimental_requestSynchronous(const std::string &eventName, const react::ValueFactory& payloadFactory) const {
  experimental_flushSync([&] {
    dispatchEvent(eventName, payloadFactory, react::RawEvent::Category::Discrete);
  });
}

} // namespace expo
