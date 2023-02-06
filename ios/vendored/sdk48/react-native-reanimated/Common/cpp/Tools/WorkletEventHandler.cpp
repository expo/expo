#include "WorkletEventHandler.h"

namespace ABI48_0_0reanimated {

void WorkletEventHandler::process(
    jsi::Runtime &rt,
    const jsi::Value &eventValue) {
  handler.callWithThis(rt, handler, eventValue);
}

} // namespace reanimated
