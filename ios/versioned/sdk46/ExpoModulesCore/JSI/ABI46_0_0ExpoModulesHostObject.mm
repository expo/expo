// Copyright 2022-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0ExpoModulesHostObject.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXJavaScriptObject.h>
#import <ABI46_0_0ExpoModulesCore/Swift.h>

namespace ABI46_0_0expo {

ExpoModulesHostObject::ExpoModulesHostObject(ABI46_0_0EXAppContext *appContext) : appContext(appContext) {}

ExpoModulesHostObject::~ExpoModulesHostObject() {
  [appContext setRuntime:nil];
}

jsi::Value ExpoModulesHostObject::get(jsi::Runtime &runtime, const jsi::PropNameID &name) {
  NSString *moduleName = [NSString stringWithUTF8String:name.utf8(runtime).c_str()];
  ABI46_0_0EXJavaScriptObject *nativeObject = [appContext getNativeModuleObject:moduleName];

  return nativeObject ? jsi::Value(runtime, *[nativeObject get]) : jsi::Value::undefined();
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

} // namespace ABI46_0_0expo
