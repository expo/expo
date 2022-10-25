// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJSIInstaller.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXJavaScriptRuntime.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0ExpoModulesHostObject.h>
#import <ABI47_0_0ExpoModulesCore/LazyObject.h>
#import <ABI47_0_0ExpoModulesCore/Swift.h>

namespace jsi = ABI47_0_0facebook::jsi;

/**
 Property name used to define the modules host object in the main object of the Expo JS runtime.
 */
static NSString *modulesHostObjectPropertyName = @"modules";

/**
 Property name used to define the modules host object in the global object of the Expo JS runtime (legacy).
 */
static NSString *modulesHostObjectLegacyPropertyName = @"ExpoModules";

@interface ABI47_0_0RCTBridge (ExpoBridgeWithRuntime)

- (void *)runtime;
- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::CallInvoker>)jsCallInvoker;

@end

@implementation ABI47_0_0EXJavaScriptRuntimeManager

+ (nullable ABI47_0_0EXJavaScriptRuntime *)runtimeFromBridge:(nonnull ABI47_0_0RCTBridge *)bridge
{
  jsi::Runtime *jsiRuntime = [bridge respondsToSelector:@selector(runtime)] ? reinterpret_cast<jsi::Runtime *>(bridge.runtime) : nullptr;
  return jsiRuntime ? [[ABI47_0_0EXJavaScriptRuntime alloc] initWithRuntime:jsiRuntime callInvoker:bridge.jsCallInvoker] : nil;
}

+ (BOOL)installExpoModulesHostObject:(nonnull ABI47_0_0EXAppContext *)appContext
{
  ABI47_0_0EXJavaScriptRuntime *runtime = [appContext runtime];

  // The runtime may be unavailable, e.g. remote debugger is enabled or it hasn't been set yet.
  if (!runtime) {
    return false;
  }

  ABI47_0_0EXJavaScriptObject *global = [runtime global];
  ABI47_0_0EXJavaScriptObject *mainObject = [runtime mainObject];

  if ([mainObject hasProperty:modulesHostObjectPropertyName]) {
    return false;
  }

  std::shared_ptr<ABI47_0_0expo::ExpoModulesHostObject> modulesHostObjectPtr = std::make_shared<ABI47_0_0expo::ExpoModulesHostObject>(appContext);
  ABI47_0_0EXJavaScriptObject *modulesHostObject = [runtime createHostObject:modulesHostObjectPtr];

  // Define the `global.expo.modules` object as a non-configurable, read-only and enumerable property.
  [mainObject defineProperty:modulesHostObjectPropertyName
                       value:modulesHostObject
                     options:ABI47_0_0EXJavaScriptObjectPropertyDescriptorEnumerable];

  // Also define `global.ExpoModules` for backwards compatibility (used before SDK47, can be removed in SDK48).
  [global defineProperty:modulesHostObjectLegacyPropertyName
                   value:modulesHostObject
                 options:ABI47_0_0EXJavaScriptObjectPropertyDescriptorEnumerable];
  return true;
}

@end
