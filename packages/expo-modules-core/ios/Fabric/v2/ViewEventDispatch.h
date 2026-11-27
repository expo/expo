// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/EXViewEventEmitting.h>

#ifdef __cplusplus

#include <memory>
#include <string>

#include <react/renderer/components/view/ViewEventEmitter.h>

#include "NewViewEventEmitter.h"

namespace expo::views {

/**
 Dispatches an event of a view of Expo Modules v2 through its event emitter, which is a `NewViewEventEmitter` because
 `NewViewShadowNode` creates it. `encodePayload` writes the payload in each runtime that reads the event. Without it,
 or when it writes nothing, the payload is an empty object.
 */
inline void dispatchViewEvent(
  const facebook::react::SharedViewEventEmitter &eventEmitter,
  NSString *_Nonnull name,
  EXViewEventPayloadEncoder _Nullable encodePayload
) {
  const auto emitter = std::static_pointer_cast<const NewViewEventEmitter>(eventEmitter);
  if (!emitter) {
    return;
  }
  std::string eventName(name.UTF8String);
  if (!encodePayload) {
    emitter->dispatch(std::move(eventName), facebook::react::EventEmitter::defaultPayloadFactory());
    return;
  }
  emitter->dispatch(std::move(eventName), [encodePayload](facebook::jsi::Runtime &runtime) {
    facebook::jsi::Value payload = facebook::jsi::Object(runtime);
    // A block can't capture the move-only value or the reference itself, so it captures their addresses.
    facebook::jsi::Value *payloadPointer = &payload;
    facebook::jsi::Runtime *runtimePointer = &runtime;
    encodePayload(runtimePointer, ^(const void *value) {
      *payloadPointer = facebook::jsi::Value(*runtimePointer, *static_cast<const facebook::jsi::Value *>(value));
    });
    return payload;
  });
}

} // namespace expo::views

#endif // __cplusplus
