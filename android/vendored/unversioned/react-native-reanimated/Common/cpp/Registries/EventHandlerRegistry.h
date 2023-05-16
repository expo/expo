#pragma once

#include <jsi/jsi.h>
#include <map>
#include <memory>
#include <mutex>
#include <set>
#include <string>
#include <unordered_map>
#include <vector>

using namespace facebook;

namespace reanimated {

class WorkletEventHandler;

class EventHandlerRegistry {
  std::map<
      std::string,
      std::unordered_map<uint64_t, std::shared_ptr<WorkletEventHandler>>>
      eventMappings;
  std::map<uint64_t, std::shared_ptr<WorkletEventHandler>> eventHandlers;
  std::mutex instanceMutex;

 public:
  void registerEventHandler(std::shared_ptr<WorkletEventHandler> eventHandler);
  void unregisterEventHandler(uint64_t id);

  void processEvent(
      jsi::Runtime &rt,
      double eventTimestamp,
      const std::string &eventName,
      const jsi::Value &eventPayload);

  bool isAnyHandlerWaitingForEvent(const std::string &eventName);
};

} // namespace reanimated
