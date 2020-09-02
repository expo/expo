#pragma once

#include <string>
#include <ABI39_0_0jsi/ABI39_0_0jsi.h>

using namespace ABI39_0_0facebook;

namespace ABI39_0_0reanimated {

class EventHandlerRegistry;

class EventHandler {
  friend EventHandlerRegistry;

private:
  unsigned long id;
  std::string eventName;
  jsi::Function handler;

public:
  EventHandler(unsigned long id,
               std::string eventName,
               jsi::Function &&handler): id(id), eventName(eventName), handler(std::move(handler)) {}
  void process(jsi::Runtime &rt, jsi::Value &eventValue);
};

}
