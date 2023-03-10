// Copyright 2022-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0ExpoModulesHostObject.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXJavaScriptObject.h>
#import <ABI48_0_0ExpoModulesCore/LazyObject.h>
#import <ABI48_0_0ExpoModulesCore/Swift.h>

namespace ABI48_0_0expo {

ExpoModulesHostObject::ExpoModulesHostObject(ABI48_0_0EXAppContext *appContext) : appContext(appContext) {}

ExpoModulesHostObject::~ExpoModulesHostObject() {
  modulesCache.clear();
  [appContext setRuntime:nil];
}

jsi::Value ExpoModulesHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  std::string moduleName = name.utf8(runtime);
  NSString *nsModuleName = [NSString stringWithUTF8String:moduleName.c_str()];

  if (![appContext hasModule:nsModuleName]) {
    // The module object can already be cached but no longer registered — we remove it from the cache in that case.
    modulesCache.erase(moduleName);
    return jsi::Value::undefined();
  }
  if (UniqueJSIObject &cachedObject = modulesCache[moduleName]) {
    return jsi::Value(runtime, *cachedObject);
  }

  // Create a lazy object for the specific module. It defers initialization of the final module object.
  LazyObject::Shared moduleLazyObject = std::make_shared<LazyObject>(^SharedJSIObject(jsi::Runtime &runtime) {
    return [[appContext getNativeModuleObject:nsModuleName] getShared];
  });

  // Save the module's lazy host object for later use.
  modulesCache[moduleName] = std::make_unique<jsi::Object>(jsi::Object::createFromHostObject(runtime, moduleLazyObject));

  return jsi::Value(runtime, *modulesCache[moduleName]);
}

void ExpoModulesHostObject::set(jsi::Runtime &runtime, const jsi::PropNameID &name, const jsi::Value &value) {
  std::string message("RuntimeError: Cannot override the host object for expo module '");
  message += name.utf8(runtime);
  message += "'.";
  throw jsi::JSError(runtime, message);
}

std::vector<jsi::PropNameID> ExpoModulesHostObject::getPropertyNames(jsi::Runtime &runtime) {
  NSArray<NSString *> *moduleNames = [appContext getModuleNames];
  std::vector<jsi::PropNameID> propertyNames;

  propertyNames.reserve([moduleNames count]);

  for (NSString *moduleName in moduleNames) {
    propertyNames.push_back(jsi::PropNameID::forAscii(runtime, [moduleName UTF8String]));
  }
  return propertyNames;
}

} // namespace ABI48_0_0expo
