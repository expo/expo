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
 Creates an event listener from a function. The functionPointer is a raw pointer to the `facebook::jsi::Value` of the
 function. Returns a pointer to a new `facebook::jsi::Function`, which the other `EXJSUtils...EventListener` functions
 take. Destroy it with `EXJSUtilsDestroyEventListener` while its runtime exists.
 */
void *_Nonnull EXJSUtilsCreateEventListener(void *_Nonnull runtimePointer, const void *_Nonnull functionPointer)
  NS_SWIFT_NAME(createJSEventListener(runtimePointer:functionPointer:));

/**
 Destroys an event listener that `EXJSUtilsCreateEventListener` created.
 */
void EXJSUtilsDestroyEventListener(void *_Nonnull listenerPointer)
  NS_SWIFT_NAME(destroyJSEventListener(_:));

/**
 Returns whether the value that valuePointer points to, a `facebook::jsi::Value`, is the function of the listener.
 */
bool EXJSUtilsIsEventListenerFunction(void *_Nonnull runtimePointer,
                                      const void *_Nonnull listenerPointer,
                                      const void *_Nonnull valuePointer)
  NS_SWIFT_NAME(isJSEventListenerFunction(runtimePointer:listenerPointer:valuePointer:));

/**
 Calls an event listener with the given `this` object and arguments. The listenerPointer is a listener that
 `EXJSUtilsCreateEventListener` created, the thisPointer is a raw pointer to a `facebook::jsi::Object`, and the
 argumentsPointer to `argumentCount` values of `facebook::jsi::Value`. An error that the listener throws doesn't
 reach the caller: it goes to the React Native error handler, so the other listeners of the event still run.
 */
void EXJSUtilsCallEventListener(void *_Nonnull runtimePointer,
                                const void *_Nonnull listenerPointer,
                                const void *_Nonnull thisPointer,
                                const void *_Nullable argumentsPointer,
                                size_t argumentCount)
  NS_SWIFT_NAME(callJSEventListener(runtimePointer:listenerPointer:thisPointer:argumentsPointer:argumentCount:));

/**
 Same as `EXJSUtilsCallEventListener`, but the thisValuePointer is a raw pointer to the `facebook::jsi::Value` of the
 `this` object, which the call passes on without a copy on React Native 0.86 and later.
 */
void EXJSUtilsCallEventListenerWithThisValue(void *_Nonnull runtimePointer,
                                             const void *_Nonnull listenerPointer,
                                             const void *_Nonnull thisValuePointer,
                                             const void *_Nullable argumentsPointer,
                                             size_t argumentCount)
  NS_SWIFT_NAME(callJSEventListener(runtimePointer:listenerPointer:thisValuePointer:argumentsPointer:argumentCount:));

/**
 Returns a pointer to the value at the given index in the values that valuesPointer points to, values of
 `facebook::jsi::Value`.
 */
const void *_Nonnull EXJSUtilsValueAtIndex(const void *_Nonnull valuesPointer, size_t index)
  NS_SWIFT_NAME(jsValuePointer(in:at:));

/**
 Calls the observing functions of an event emitter in the two properties, in order, with the event name. Skips a
 property that isn't an object. The objectPointer is a raw pointer to the `facebook::jsi::Object` of the emitter, the
 name pointers to `facebook::jsi::PropNameID`s, and the eventPointer to the `facebook::jsi::Value` of the event name.
 A getter or a function can throw, and a C++ exception can't cross into Swift. So it returns the thrown value as a new
 `facebook::jsi::Value`, which the caller destroys with `EXJSUtilsDestroyValue`, or `NULL` when nothing throws.
 */
void *_Nullable EXJSUtilsCallObservingFunctions(void *_Nonnull runtimePointer,
                                                const void *_Nonnull objectPointer,
                                                const void *_Nonnull firstNamePointer,
                                                const void *_Nonnull secondNamePointer,
                                                const void *_Nonnull eventPointer)
  NS_SWIFT_NAME(callObservingFunctions(runtimePointer:objectPointer:firstNamePointer:secondNamePointer:eventPointer:));

/**
 Sets `isInstance` to whether the value is an instance of the constructor of the object, that is
 `value instanceof object.constructor`. The objectPointer is a raw pointer to a `facebook::jsi::Object`, the
 valuePointer to a `facebook::jsi::Value`, and the constructorNamePointer to the `facebook::jsi::PropNameID` of
 `"constructor"`. Returns the thrown value like `EXJSUtilsCallObservingFunctions`.
 */
void *_Nullable EXJSUtilsIsInstanceOfConstructor(void *_Nonnull runtimePointer,
                                                 const void *_Nonnull objectPointer,
                                                 const void *_Nonnull valuePointer,
                                                 const void *_Nonnull constructorNamePointer,
                                                 bool *_Nonnull isInstance)
  NS_SWIFT_NAME(isInstanceOfConstructor(runtimePointer:objectPointer:valuePointer:constructorNamePointer:isInstance:));

/**
 Destroys a `facebook::jsi::Value` that an `EXJSUtils` function returned.
 */
void EXJSUtilsDestroyValue(void *_Nonnull valuePointer)
  NS_SWIFT_NAME(destroyJSValue(_:));

EX_EXTERN_C_END
