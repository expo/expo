#include "DevMenuWorkletEventHandler.h"

namespace devmenureanimated {

void WorkletEventHandler::process(
    jsi::Runtime &rt,
    const jsi::Value &eventValue) {
  handler.callWithThis(rt, handler, eventValue);
}

} // namespace devmenureanimated
