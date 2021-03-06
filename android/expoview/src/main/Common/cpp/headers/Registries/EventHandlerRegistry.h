#pragma once

#include <vector>
#include <map>
#include <set>
#include <unordered_map>
#include <string>
#include <jsi/jsi.h>
#include <mutex>

using namespace facebook;

namespace reanimated {

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
