#include "WorkletEventHandler.h"

namespace ABI49_0_0reanimated {

void WorkletEventHandler::process(
    double eventTimestamp,
    const jsi::Value &eventValue) {
  _runtimeHelper->runOnUIGuarded(
      _handlerFunction, jsi::Value(eventTimestamp), eventValue);
}

} // namespace reanimated
