// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/EXDefines.h>

EX_EXTERN_C_BEGIN

/**
 Converts an Objective-C object, such as a dictionary, to a JS value, as the legacy event emitter converted event
 payloads, and lends the value to `body`. The valuePointer is a raw pointer to the `facebook::jsi::Value`. The value
 lives only until `body` returns.
 */
void EXJSUtilsWithConvertedObjCObject(void *_Nonnull runtimePointer,
                                      id _Nullable object,
                                      void (^_Nonnull NS_NOESCAPE body)(const void *_Nonnull valuePointer))
  NS_SWIFT_NAME(withConvertedObjCObject(runtimePointer:object:_:));

/**
 Calls an event listener with the given `this` object and arguments. The listenerPointer is a raw pointer to the
 `facebook::jsi::Value` of the listener function, the thisPointer to a `facebook::jsi::Object`, and the
 argumentsPointer to `argumentCount` values of `facebook::jsi::Value`. An error that the listener throws doesn't
 reach the caller: it goes to the React Native error handler, so the other listeners of the event still run.
 */
void EXJSUtilsCallEventListener(void *_Nonnull runtimePointer,
                                const void *_Nonnull listenerPointer,
                                const void *_Nonnull thisPointer,
                                const void *_Nullable argumentsPointer,
                                size_t argumentCount)
  NS_SWIFT_NAME(callJSEventListener(runtimePointer:listenerPointer:thisPointer:argumentsPointer:argumentCount:));

EX_EXTERN_C_END
