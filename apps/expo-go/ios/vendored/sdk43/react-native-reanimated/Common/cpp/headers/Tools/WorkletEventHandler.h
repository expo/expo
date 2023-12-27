#pragma once

#include <string>
#include <ABI43_0_0jsi/ABI43_0_0jsi.h>

using namespace ABI43_0_0facebook;

namespace ABI43_0_0reanimated {

class EventHandlerRegistry;

class WorkletEventHandler {
  friend EventHandlerRegistry;

private:
  unsigned long id;
  std::string eventName;
  jsi::Function handler;

public:
  WorkletEventHandler(unsigned long id,
               std::string eventName,
               jsi::Function &&handler): id(id), eventName(eventName), handler(std::move(handler)) {}
  void process(jsi::Runtime &rt, jsi::Value &eventValue);
};

}
