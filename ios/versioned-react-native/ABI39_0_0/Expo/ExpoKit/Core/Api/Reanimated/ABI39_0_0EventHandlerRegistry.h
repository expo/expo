#pragma once

#include <vector>
#include <map>
#include <set>
#include <unordered_map>
#include <string>
#include <ABI39_0_0jsi/ABI39_0_0jsi.h>

using namespace ABI39_0_0facebook;

namespace ABI39_0_0reanimated {

class EventHandler;

class EventHandlerRegistry {
  std::map<std::string, std::unordered_map<unsigned long, std::shared_ptr<EventHandler>>> eventMappings;
  std::map<unsigned long, std::shared_ptr<EventHandler>> eventHandlers;

public:
  void registerEventHandler(std::shared_ptr<EventHandler> eventHandler);
  void unregisterEventHandler(unsigned long id);

  void processEvent(jsi::Runtime &rt, std::string eventName, std::string eventPayload);
};

}
