#import <ExpoModulesCore/EXJSUtils.h>
#import <ExpoModulesCore/EXJSIConversions.h>

#include <cxxreact/ErrorUtils.h>

void EXJSUtilsWithConvertedObjCObject(void *runtimePointer,
                                      id object,
                                      void (^NS_NOESCAPE body)(const void *valuePointer))
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  jsi::Value value = expo::convertObjCObjectToJSIValue(runtime, object);
  body(&value);
}

/**
 Reports an error that an event listener threw to the React Native error handler.
 */
static void handleEventListenerError(jsi::Runtime &runtime, jsi::JSError &error)
{
  try {
    facebook::react::handleJSError(runtime, error, false);
  } catch (const std::exception &) {
    // `handleJSError` throws when the JS error handler (`ErrorUtils`) isn't set up, for example in a
    // runtime without React Native.
    NSLog(@"[ExpoModulesCore] An event listener threw an error: %s", error.what());
  }
}

void *EXJSUtilsCreateEventListener(void *runtimePointer, const void *functionPointer)
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto &function = *static_cast<const jsi::Value *>(functionPointer);
  return new jsi::Function(function.getObject(runtime).getFunction(runtime));
}

void EXJSUtilsDestroyEventListener(void *listenerPointer)
{
  delete static_cast<jsi::Function *>(listenerPointer);
}

bool EXJSUtilsIsEventListenerFunction(void *runtimePointer, const void *listenerPointer, const void *valuePointer)
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto &listener = *static_cast<const jsi::Function *>(listenerPointer);
  auto &value = *static_cast<const jsi::Value *>(valuePointer);
  return value.isObject() && jsi::Object::strictEquals(runtime, listener, value.getObject(runtime));
}

const void *EXJSUtilsValueAtIndex(const void *valuesPointer, size_t index)
{
  return static_cast<const jsi::Value *>(valuesPointer) + index;
}

void EXJSUtilsCallEventListener(void *runtimePointer,
                                const void *listenerPointer,
                                const void *thisPointer,
                                const void *argumentsPointer,
                                size_t argumentCount)
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto &listener = *static_cast<const jsi::Function *>(listenerPointer);
  auto &thisObject = *static_cast<const jsi::Object *>(thisPointer);
  auto *args = static_cast<const jsi::Value *>(argumentsPointer);

  try {
    listener.callWithThis(runtime, thisObject, args, argumentCount);
  } catch (jsi::JSError &error) {
    handleEventListenerError(runtime, error);
  }
}

void EXJSUtilsCallEventListenerWithThisValue(void *runtimePointer,
                                             const void *listenerPointer,
                                             const void *thisValuePointer,
                                             const void *argumentsPointer,
                                             size_t argumentCount)
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto &listener = *static_cast<const jsi::Function *>(listenerPointer);
  auto &thisValue = *static_cast<const jsi::Value *>(thisValuePointer);
  auto *args = static_cast<const jsi::Value *>(argumentsPointer);

  try {
#if REACT_NATIVE_TARGET_VERSION >= 86
    // `callWithThis` takes `this` as an object and copies it into a value for the call.
    runtime.call(listener, thisValue, args, argumentCount);
#else
    // `Runtime::call` is protected before React Native 0.86.
    listener.callWithThis(runtime, thisValue.getObject(runtime), args, argumentCount);
#endif
  } catch (jsi::JSError &error) {
    handleEventListenerError(runtime, error);
  }
}

/**
 Returns the thrown value of the exception that is being handled, as a new `jsi::Value`. Call it in a `catch` block.
 */
static void *newValueOfCaughtException(jsi::Runtime &runtime)
{
  try {
    throw;
  } catch (jsi::JSError &error) {
    return new jsi::Value(runtime, error.value());
  } catch (const std::exception &error) {
    return new jsi::Value(runtime, jsi::JSError(runtime, error.what()).value());
  } catch (...) {
    return new jsi::Value(runtime, jsi::JSError(runtime, "Unknown C++ error").value());
  }
}

static void callObservingFunction(jsi::Runtime &runtime,
                                  const jsi::Object &object,
                                  const jsi::PropNameID &name,
                                  const jsi::Value &event)
{
  jsi::Value function = object.getProperty(runtime, name);
  if (function.isObject()) {
    function.getObject(runtime).asFunction(runtime).callWithThis(runtime, object, &event, static_cast<size_t>(1));
  }
}

void *EXJSUtilsCallObservingFunctions(void *runtimePointer,
                                      const void *objectPointer,
                                      const void *firstNamePointer,
                                      const void *secondNamePointer,
                                      const void *eventPointer)
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto &object = *static_cast<const jsi::Object *>(objectPointer);
  auto &event = *static_cast<const jsi::Value *>(eventPointer);

  try {
    callObservingFunction(runtime, object, *static_cast<const jsi::PropNameID *>(firstNamePointer), event);
    callObservingFunction(runtime, object, *static_cast<const jsi::PropNameID *>(secondNamePointer), event);
    return nullptr;
  } catch (...) {
    return newValueOfCaughtException(runtime);
  }
}

void *EXJSUtilsIsInstanceOfConstructor(void *runtimePointer,
                                       const void *objectPointer,
                                       const void *valuePointer,
                                       const void *constructorNamePointer,
                                       bool *isInstance)
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto &object = *static_cast<const jsi::Object *>(objectPointer);
  auto &value = *static_cast<const jsi::Value *>(valuePointer);
  auto &constructorName = *static_cast<const jsi::PropNameID *>(constructorNamePointer);

  *isInstance = false;
  try {
    jsi::Value constructor = object.getProperty(runtime, constructorName);
    if (value.isObject() && constructor.isObject()) {
      jsi::Object constructorObject = constructor.getObject(runtime);
      if (constructorObject.isFunction(runtime)) {
        *isInstance = value.getObject(runtime).instanceOf(runtime, constructorObject.getFunction(runtime));
      }
    }
    return nullptr;
  } catch (...) {
    return newValueOfCaughtException(runtime);
  }
}

void EXJSUtilsDestroyValue(void *valuePointer)
{
  delete static_cast<jsi::Value *>(valuePointer);
}
