// Copyright 2024-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <jsi/jsi.h>

#include "JSIUtils.h"
#include "ObjectDeallocator.h"
#include "EventEmitter.h"

namespace jsi = facebook::jsi;

namespace expo::SharedObject {

/**
 Type of the shared object IDs.
 */
typedef long ObjectId;

/**
 Defines an object releaser block of the shared object.
 */
typedef std::function<void(const ObjectId)> ObjectReleaser;

/**
 Installs a base JavaScript class for all shared objects with a shared release block.
 */
void installBaseClass(jsi::Runtime &runtime, const ObjectReleaser& releaser);

/**
 Returns the base JavaScript class for all shared objects, i.e. `global.expo.SharedObject`.
 */
jsi::Function getBaseClass(jsi::Runtime &runtime);

/**
 Creates a concrete shared object class with the given name and constructor.
 */
jsi::Function createClass(jsi::Runtime &runtime, const char *className, common::ClassConstructor constructor);

/**
 Class representing a native state of the shared object.
 */
class JSI_EXPORT NativeState : public EventEmitter::NativeState {
public:
  const ObjectId objectId = 0;
  const ObjectReleaser releaser;

  /**
   Initializes a native state for the shared object with the given ID. The `context`
   and `contextDeallocator` are forwarded to the base so the JS-side `getNativeState`
   can round-trip back to a Swift wrapper on Apple; ignored on platforms without
   ExpoModulesJSI.
   */
  NativeState(ObjectId objectId,
              ObjectReleaser releaser,
              void *context = nullptr,
              void (*contextDeallocator)(void *) = nullptr);

  ~NativeState() override;
}; // class NativeState

} // namespace expo::SharedObject

#endif // __cplusplus
