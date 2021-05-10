#pragma once

#include <string>
#include <jsi/jsi.h>

using namespace facebook;

namespace reanimated {

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
