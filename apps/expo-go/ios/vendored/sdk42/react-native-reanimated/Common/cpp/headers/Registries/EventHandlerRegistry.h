#pragma once

#include <vector>
#include <map>
#include <set>
#include <unordered_map>
#include <string>
#include <ABI42_0_0jsi/ABI42_0_0jsi.h>
#include <mutex>

using namespace ABI42_0_0facebook;

namespace ABI42_0_0reanimated {

class WorkletEventHandler;

class EventHandlerRegistry {
  std::map<std::string, std::unordered_map<unsigned long, std::shared_ptr<WorkletEventHandler>>> eventMappings;
  std::map<unsigned long, std::shared_ptr<WorkletEventHandler>> eventHandlers;
  std::mutex instanceMutex;

public:
  void registerEventHandler(std::shared_ptr<WorkletEventHandler> eventHandler);
  void unregisterEventHandler(unsigned long id);

  void processEvent(jsi::Runtime &rt, std::string eventName, std::string eventPayload);
  bool isAnyHandlerWaitingForEvent(std::string eventName);
};

}
