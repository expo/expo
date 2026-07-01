// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewEventEmitter.h"

#include <utility>

using namespace facebook;

namespace {
// EXPERIMENT: set once at runtime install; used to run synchronous events on the calling thread.
std::shared_ptr<facebook::react::RuntimeScheduler> gSyncEventScheduler;
}

namespace expo {

void setSyncEventScheduler(std::shared_ptr<facebook::react::RuntimeScheduler> scheduler) {
  gSyncEventScheduler = std::move(scheduler);
}

void ExpoViewEventEmitter::dispatch(const std::string &eventName, const react::ValueFactory& payloadFactory) const {
  dispatchEvent(eventName, payloadFactory);
}

void ExpoViewEventEmitter::dispatchSync(const std::string &eventName, const react::ValueFactory& payloadFactory) const {
  auto scheduler = gSyncEventScheduler;
  if (scheduler) {
    // Run a full event-loop tick synchronously on the calling (main) thread. Dispatching the event
    // inside it and requesting a synchronous flush makes the JS handler run and commit before this
    // returns — a truly synchronous mount. CAN DEADLOCK if the JS thread is busy holding the runtime.
    scheduler->executeNowOnTheSameThread([this, &eventName, &payloadFactory](jsi::Runtime &runtime) {
      (void)runtime;
      experimental_flushSync([this, &eventName, &payloadFactory]() {
        dispatchEvent(eventName, payloadFactory, facebook::react::RawEvent::Category::Discrete);
      });
    });
  } else {
    experimental_flushSync([this, &eventName, &payloadFactory]() {
      dispatchEvent(eventName, payloadFactory, facebook::react::RawEvent::Category::Discrete);
    });
  }
}

} // namespace expo
