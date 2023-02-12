#include "WorkletEventHandler.h"

namespace reanimated {

void WorkletEventHandler::process(
    jsi::Runtime &rt,
    const jsi::Value &eventValue) {
  handler.callWithThis(rt, handler, eventValue);
}

} // namespace reanimated
