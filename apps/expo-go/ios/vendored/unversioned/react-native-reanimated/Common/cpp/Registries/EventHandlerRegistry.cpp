#include "EventHandlerRegistry.h"
#include "WorkletEventHandler.h"

#include <utility>

namespace reanimated {

void EventHandlerRegistry::registerEventHandler(
    std::shared_ptr<WorkletEventHandler> eventHandler) {
  const std::lock_guard<std::mutex> lock(instanceMutex);
  const auto &eventName = eventHandler->getEventName();
  auto handlerId = eventHandler->getHandlerId();

  if (eventHandler->shouldIgnoreEmitterReactTag()) {
    eventMappingsWithoutTag[eventName][handlerId] = eventHandler;
  } else {
    const auto emitterReactTag = eventHandler->getEmitterReactTag();
    const auto eventHash = std::make_pair(emitterReactTag, eventName);
    eventMappingsWithTag[eventHash][handlerId] = eventHandler;
  }
  eventHandlers[handlerId] = eventHandler;
}

void EventHandlerRegistry::unregisterEventHandler(uint64_t id) {
  const std::lock_guard<std::mutex> lock(instanceMutex);
  auto handlerIt = eventHandlers.find(id);
  if (handlerIt != eventHandlers.end()) {
    const auto &eventHandler = handlerIt->second;
    const auto &eventName = eventHandler->getEventName();

    if (eventHandler->shouldIgnoreEmitterReactTag()) {
      const auto eventMappingIt = eventMappingsWithoutTag.find(eventName);
      auto &handlersMap = eventMappingIt->second;
      handlersMap.erase(id);
      if (handlersMap.empty()) {
        eventMappingsWithoutTag.erase(eventMappingIt);
      }
    } else {
      const auto emitterReactTag = eventHandler->getEmitterReactTag();
      const auto eventHash = std::make_pair(emitterReactTag, eventName);
      const auto eventMappingIt = eventMappingsWithTag.find(eventHash);
      auto &handlersMap = eventMappingIt->second;
      handlersMap.erase(id);
      if (handlersMap.empty()) {
        eventMappingsWithTag.erase(eventMappingIt);
      }
    }
    eventHandlers.erase(handlerIt);
  }
}

void EventHandlerRegistry::processEvent(
    const std::shared_ptr<WorkletRuntime> &uiWorkletRuntime,
    const double eventTimestamp,
    const std::string &eventName,
    const int emitterReactTag,
    const jsi::Value &eventPayload) {
  std::vector<std::shared_ptr<WorkletEventHandler>> handlersForEvent;
  {
    const std::lock_guard<std::mutex> lock(instanceMutex);
    auto handlersIt = eventMappingsWithoutTag.find(eventName);
    if (handlersIt != eventMappingsWithoutTag.end()) {
      for (auto handler : handlersIt->second) {
        handlersForEvent.push_back(handler.second);
      }
    }
    const auto eventHash = std::make_pair(emitterReactTag, eventName);
    auto handlersWithTagIt = eventMappingsWithTag.find(eventHash);
    if (handlersWithTagIt != eventMappingsWithTag.end()) {
      for (auto handler : handlersWithTagIt->second) {
        handlersForEvent.push_back(handler.second);
      }
    }
  }

  jsi::Runtime &rt = uiWorkletRuntime->getJSIRuntime();
  eventPayload.asObject(rt).setProperty(
      rt, "eventName", jsi::String::createFromUtf8(rt, eventName));
  for (auto handler : handlersForEvent) {
    handler->process(uiWorkletRuntime, eventTimestamp, eventPayload);
  }
}

bool EventHandlerRegistry::isAnyHandlerWaitingForEvent(
    const std::string &eventName,
    const int emitterReactTag) {
  const std::lock_guard<std::mutex> lock(instanceMutex);
  const auto eventHash = std::make_pair(emitterReactTag, eventName);
  auto it = eventMappingsWithTag.find(eventHash);
  return it != eventMappingsWithTag.end() && !it->second.empty();
}

} // namespace reanimated
