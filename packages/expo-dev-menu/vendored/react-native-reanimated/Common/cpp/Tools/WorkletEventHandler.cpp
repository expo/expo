#include "DevMenuWorkletEventHandler.h"

namespace devmenureanimated {

void WorkletEventHandler::process(jsi::Runtime &rt, jsi::Value &eventValue) {
  handler.callWithThis(rt, handler, eventValue);
}

}
