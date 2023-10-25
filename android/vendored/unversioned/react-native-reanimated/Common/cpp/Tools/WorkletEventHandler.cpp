#include "WorkletEventHandler.h"

namespace reanimated {

void WorkletEventHandler::process(
    const std::shared_ptr<WorkletRuntime> &workletRuntime,
    const double eventTimestamp,
    const jsi::Value &eventValue) const {
  workletRuntime->runGuarded(
      handlerFunction_, jsi::Value(eventTimestamp), eventValue);
}

uint64_t WorkletEventHandler::getHandlerId() const {
  return handlerId_;
}

const std::string &WorkletEventHandler::getEventName() const {
  return eventName_;
}

uint64_t WorkletEventHandler::getEmitterReactTag() const {
  return emitterReactTag_;
}

bool WorkletEventHandler::shouldIgnoreEmitterReactTag() const {
  return emitterReactTag_ == -1;
}

} // namespace reanimated
