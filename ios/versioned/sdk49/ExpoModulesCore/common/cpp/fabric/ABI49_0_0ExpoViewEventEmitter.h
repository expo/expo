// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ViewEventEmitter.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

namespace react = ABI49_0_0facebook::ABI49_0_0React;

namespace ABI49_0_0expo {

class ExpoViewEventEmitter : public ABI49_0_0facebook::ABI49_0_0React::ViewEventEmitter {
public:
  using ViewEventEmitter::ViewEventEmitter;
  using Shared = std::shared_ptr<const ExpoViewEventEmitter>;

  /**
   Dispatches an event to send from the native view to JavaScript.
   This is basically exposing `dispatchEvent` from `ABI49_0_0facebook::ABI49_0_0React::EventEmitter` for public use.
   */
  void dispatch(std::string eventName, react::ValueFactory payloadFactory) const;
};

} // namespace ABI49_0_0expo

#endif // __cplusplus
