#include "WorkletEventHandler.h"

namespace reanimated {

void WorkletEventHandler::process(jsi::Runtime &rt, jsi::Value &eventValue) {
  handler.callWithThis(rt, handler, eventValue);
}

}
