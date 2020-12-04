#include "ABI40_0_0EventHandler.h"

namespace ABI40_0_0reanimated {

void EventHandler::process(jsi::Runtime &rt, jsi::Value &eventValue) {
  handler.callWithThis(rt, handler, eventValue);
}

}
