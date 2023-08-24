#pragma once

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <memory>
#include <string>
#include <utility>

#include "Shareables.h"

using namespace ABI49_0_0facebook;

namespace ABI49_0_0reanimated {

class EventHandlerRegistry;

class WorkletEventHandler {
  friend EventHandlerRegistry;

 private:
  std::shared_ptr<JSRuntimeHelper> _runtimeHelper;
  uint64_t id;
  std::string eventName;
  jsi::Value _handlerFunction;

 public:
  WorkletEventHandler(
      const std::shared_ptr<JSRuntimeHelper> &runtimeHelper,
      uint64_t id,
      std::string eventName,
      jsi::Value &&handlerFunction)
      : _runtimeHelper(runtimeHelper),
        id(id),
        eventName(eventName),
        _handlerFunction(std::move(handlerFunction)) {}
  void process(double eventTimestamp, const jsi::Value &eventValue);
};

} // namespace reanimated
