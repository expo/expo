// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ViewEventEmitter.h>
#include <ABI48_0_0jsi/ABI48_0_0jsi.h>

namespace react = ABI48_0_0facebook::ABI48_0_0React;

namespace ABI48_0_0expo {

class ExpoViewEventEmitter : public ABI48_0_0facebook::ABI48_0_0React::ViewEventEmitter {
public:
  using ViewEventEmitter::ViewEventEmitter;
  using Shared = std::shared_ptr<const ExpoViewEventEmitter>;

  /**
   Dispatches an event to send from the native view to JavaScript.
   This is basically exposing `dispatchEvent` from `ABI48_0_0facebook::ABI48_0_0React::EventEmitter` for public use.
   */
  void dispatch(std::string eventName, react::ValueFactory payloadFactory) const;
};

} // namespace ABI48_0_0expo

#endif // __cplusplus
