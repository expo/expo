#include "WorkletEventHandler.h"

namespace ABI44_0_0reanimated {

void WorkletEventHandler::process(jsi::Runtime &rt, jsi::Value &eventValue) {
  handler.callWithThis(rt, handler, eventValue);
}

}
