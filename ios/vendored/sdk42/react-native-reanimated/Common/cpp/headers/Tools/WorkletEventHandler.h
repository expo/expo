#pragma once

#include <string>
#include <ABI42_0_0jsi/ABI42_0_0jsi.h>

using namespace ABI42_0_0facebook;

namespace ABI42_0_0reanimated {

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
