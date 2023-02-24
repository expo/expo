#include "EventHandlerRegistry.h"
#include "WorkletEventHandler.h"

namespace reanimated {

void EventHandlerRegistry::registerEventHandler(
    std::shared_ptr<WorkletEventHandler> eventHandler) {
  const std::lock_guard<std::mutex> lock(instanceMutex);
  eventMappings[eventHandler->eventName][eventHandler->id] = eventHandler;
  eventHandlers[eventHandler->id] = eventHandler;
}

void EventHandlerRegistry::unregisterEventHandler(unsigned long id) {
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
    std::string eventName,
    std::string eventPayload) {
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
  // We receive here a JS Map with JSON as a value of NativeMap key
  // { NativeMap: { "jsonProp": "json value" } }
  // So we need to extract only JSON part
  std::string delimimter = "NativeMap:";
  auto positionToSplit = eventPayload.find(delimimter) + delimimter.size();
  auto lastBracketCharactedPosition = eventPayload.size() - positionToSplit - 1;
  auto eventJSON =
      eventPayload.substr(positionToSplit, lastBracketCharactedPosition);

  if (eventJSON.compare(std::string("null")) == 0) {
    return;
  }

  auto eventObject = jsi::Value::createFromJsonUtf8(
      rt, reinterpret_cast<uint8_t *>(&eventJSON[0]), eventJSON.size());

  eventObject.asObject(rt).setProperty(
      rt, "eventName", jsi::String::createFromUtf8(rt, eventName));
  for (auto handler : handlersForEvent) {
    handler->process(rt, eventObject);
  }
}

bool EventHandlerRegistry::isAnyHandlerWaitingForEvent(std::string eventName) {
  const std::lock_guard<std::mutex> lock(instanceMutex);
  auto it = eventMappings.find(eventName);
  return (it != eventMappings.end()) && (!(it->second).empty());
}

} // namespace reanimated
