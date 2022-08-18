// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ViewEventEmitter.h>
#include <jsi/jsi.h>

namespace react = facebook::react;

namespace expo {

class ExpoViewEventEmitter : public facebook::react::ViewEventEmitter {
public:
  using ViewEventEmitter::ViewEventEmitter;
  using Shared = std::shared_ptr<const ExpoViewEventEmitter>;

  /**
   Dispatches an event to send from the native view to JavaScript.
   This is basically exposing `dispatchEvent` from `facebook::react::EventEmitter` for public use.
   */
  void dispatch(std::string eventName, react::ValueFactory payloadFactory) const;
};

} // namespace expo

#endif // __cplusplus
