#pragma once

#include <vector>
#include <map>
#include <set>
#include <unordered_map>
#include <string>
#include <ABI40_0_0jsi/ABI40_0_0jsi.h>
#include <mutex>

using namespace ABI40_0_0facebook;

namespace ABI40_0_0reanimated {

class EventHandler;

class EventHandlerRegistry {
  std::map<std::string, std::unordered_map<unsigned long, std::shared_ptr<EventHandler>>> eventMappings;
  std::map<unsigned long, std::shared_ptr<EventHandler>> eventHandlers;
  std::mutex instanceMutex;

public:
  void registerEventHandler(std::shared_ptr<EventHandler> eventHandler);
  void unregisterEventHandler(unsigned long id);

  void processEvent(jsi::Runtime &rt, std::string eventName, std::string eventPayload);
  bool isAnyHandlerWaitingForEvent(std::string eventName);
};

}
