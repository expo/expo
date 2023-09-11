#include "EventHandlerRegistry.h"
#include "WorkletEventHandler.h"

namespace reanimated {

void EventHandlerRegistry::registerEventHandler(
    std::shared_ptr<WorkletEventHandler> eventHandler) {
  const std::lock_guard<std::mutex> lock(instanceMutex);
  eventMappings[eventHandler->eventName][eventHandler->id] = eventHandler;
  eventHandlers[eventHandler->id] = eventHandler;
}

void EventHandlerRegistry::unregisterEventHandler(uint64_t id) {
  const std::lock_guard<std::mutex> lock(instanceMutex);
  auto handlerIt = eventHandlers.find(id);
  if (handlerIt != eventHandlers.end()) {
    eventMappings[handlerIt->second->eventName].erase(id);
    if (eventMappings[handlerIt->second->eventName].empty()) {
      eventMappings.erase(handlerIt->second->eventName);
    }
    eventHandlers.erase(handlerIt);
  }
}

void EventHandlerRegistry::processEvent(
    jsi::Runtime &rt,
    double eventTimestamp,
    const std::string &eventName,
    const jsi::Value &eventPayload) {
  std::vector<std::shared_ptr<WorkletEventHandler>> handlersForEvent;
  {
    const std::lock_guard<std::mutex> lock(instanceMutex);
    auto handlersIt = eventMappings.find(eventName);
    if (handlersIt != eventMappings.end()) {
      for (auto handler : handlersIt->second) {
        handlersForEvent.push_back(handler.second);
      }
    }
  }

  eventPayload.asObject(rt).setProperty(
      rt, "eventName", jsi::String::createFromUtf8(rt, eventName));
  for (auto handler : handlersForEvent) {
    handler->process(eventTimestamp, eventPayload);
  }
}

bool EventHandlerRegistry::isAnyHandlerWaitingForEvent(
    const std::string &eventName) {
  const std::lock_guard<std::mutex> lock(instanceMutex);
  auto it = eventMappings.find(eventName);
  return (it != eventMappings.end()) && (!(it->second).empty());
}

} // namespace reanimated
