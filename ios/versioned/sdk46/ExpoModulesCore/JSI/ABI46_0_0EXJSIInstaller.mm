// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXJSIInstaller.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXJavaScriptRuntime.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0ExpoModulesHostObject.h>
#import <ABI46_0_0ExpoModulesCore/Swift.h>

namespace jsi = ABI46_0_0facebook::jsi;

/**
 This name will be used as a property of the JS global object to which the host object is added.
 */
static NSString *expoModulesHostObjectPropertyName = @"ExpoModules";

@interface ABI46_0_0RCTBridge (ExpoBridgeWithRuntime)

- (void *)runtime;
- (std::shared_ptr<ABI46_0_0facebook::ABI46_0_0React::CallInvoker>)jsCallInvoker;

@end

@implementation ABI46_0_0EXJavaScriptRuntimeManager

+ (nullable ABI46_0_0EXJavaScriptRuntime *)runtimeFromBridge:(nonnull ABI46_0_0RCTBridge *)bridge
{
  jsi::Runtime *jsiRuntime = [bridge respondsToSelector:@selector(runtime)] ? reinterpret_cast<jsi::Runtime *>(bridge.runtime) : nullptr;
  return jsiRuntime ? [[ABI46_0_0EXJavaScriptRuntime alloc] initWithRuntime:jsiRuntime callInvoker:bridge.jsCallInvoker] : nil;
}

+ (BOOL)installExpoModulesHostObject:(nonnull ABI46_0_0EXAppContext *)appContext
{
  ABI46_0_0EXJavaScriptRuntime *runtime = [appContext runtime];

  // The runtime may be unavailable, e.g. remote debugger is enabled or it hasn't been set yet.
  if (!runtime) {
    return false;
  }

  ABI46_0_0EXJavaScriptObject *global = [runtime global];

  if ([global hasProperty:expoModulesHostObjectPropertyName]) {
    return false;
  }

  std::shared_ptr<ABI46_0_0expo::ExpoModulesHostObject> hostObjectPtr = std::make_shared<ABI46_0_0expo::ExpoModulesHostObject>(appContext);
  ABI46_0_0EXJavaScriptObject *hostObject = [runtime createHostObject:hostObjectPtr];

  // Define the ExpoModules object as a non-configurable, read-only and enumerable property.
  [global defineProperty:expoModulesHostObjectPropertyName
                   value:hostObject
                 options:ABI46_0_0EXJavaScriptObjectPropertyDescriptorEnumerable];
  return true;
}

@end
