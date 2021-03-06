#include "EventHandler.h"

namespace reanimated {

void EventHandler::process(jsi::Runtime &rt, jsi::Value &eventValue) {
  handler.callWithThis(rt, handler, eventValue);
}

}
