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

void EXJSUtilsCallEventListener(void *runtimePointer,
                                const void *listenerPointer,
                                const void *thisPointer,
                                const void *argumentsPointer,
                                size_t argumentCount)
{
  auto &runtime = *static_cast<jsi::Runtime *>(runtimePointer);
  auto &listener = *static_cast<const jsi::Value *>(listenerPointer);
  auto &thisObject = *static_cast<const jsi::Object *>(thisPointer);
  auto *args = static_cast<const jsi::Value *>(argumentsPointer);

  try {
    listener.getObject(runtime).asFunction(runtime).callWithThis(runtime, thisObject, args, argumentCount);
  } catch (jsi::JSError &error) {
    try {
      facebook::react::handleJSError(runtime, error, false);
    } catch (const std::exception &) {
      // `handleJSError` throws when the JS error handler (`ErrorUtils`) isn't set up, for example in a
      // runtime without React Native.
      NSLog(@"[ExpoModulesCore] An event listener threw an error: %s", error.what());
    }
  }
}
