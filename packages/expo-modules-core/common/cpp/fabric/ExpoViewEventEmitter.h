// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <jsi/jsi.h>
#include <memory>

namespace react = facebook::react;

namespace expo {

/**
 EXPERIMENT: caches the RuntimeScheduler so `dispatchSync` can run a full event-loop tick on the
 calling (main) thread via `executeNowOnTheSameThread` — making the JS handler + commit truly
 synchronous. Set once at runtime install. If null, `dispatchSync` falls back to the async path.
 */
void setSyncEventScheduler(std::shared_ptr<facebook::react::RuntimeScheduler> scheduler);

class ExpoViewEventEmitter : public facebook::react::ViewEventEmitter {
public:
  using facebook::react::ViewEventEmitter::ViewEventEmitter;
  using Shared = std::shared_ptr<const ExpoViewEventEmitter>;

  /**
   Dispatches an event to send from the native view to JavaScript.
   This is basically exposing `dispatchEvent` from `facebook::react::EventEmitter` for public use.
   */
  void dispatch(const std::string &eventName, const react::ValueFactory& payloadFactory) const;

  /**
   Dispatches an event synchronously and with discrete priority: flushes React on the calling thread
   so the JS handler runs and commits before this returns. Mirrors React Native's VirtualView, which
   uses it to mount content the moment a row becomes visible (avoids the one-frame async-mount blank).
   Only safe to call from the main/JS thread; it blocks while JS renders.
   */
  void dispatchSync(const std::string &eventName, const react::ValueFactory& payloadFactory) const;
};

} // namespace expo

#endif // __cplusplus
