// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <string>

#include <react/renderer/components/view/ViewEventEmitter.h>

namespace expo::views {

class NewViewEventEmitter final : public facebook::react::ViewEventEmitter {
public:
  using facebook::react::ViewEventEmitter::ViewEventEmitter;

  /**
   Dispatches an event from the native view to JavaScript. Makes the protected `dispatchEvent` public.
   */
  void dispatch(std::string eventName, const facebook::react::ValueFactory &payloadFactory) const;
};

} // namespace expo::views

#endif // __cplusplus
