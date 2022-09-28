// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIInstaller.h>
#import <ExpoModulesCore/EXJavaScriptRuntime.h>
#import <ExpoModulesCore/ExpoModulesHostObject.h>
#import <ExpoModulesCore/LazyObject.h>
#import <ExpoModulesCore/Swift.h>

namespace jsi = facebook::jsi;

/**
 Property name used to define the modules host object in the main object of the Expo JS runtime.
 */
static NSString *modulesHostObjectPropertyName = @"modules";

/**
 Property name used to define the modules host object in the global object of the Expo JS runtime (legacy).
 */
static NSString *modulesHostObjectLegacyPropertyName = @"ExpoModules";

@interface RCTBridge (ExpoBridgeWithRuntime)

- (void *)runtime;
- (std::shared_ptr<facebook::react::CallInvoker>)jsCallInvoker;

@end

@implementation EXJavaScriptRuntimeManager

+ (nullable EXJavaScriptRuntime *)runtimeFromBridge:(nonnull RCTBridge *)bridge
{
  jsi::Runtime *jsiRuntime = [bridge respondsToSelector:@selector(runtime)] ? reinterpret_cast<jsi::Runtime *>(bridge.runtime) : nullptr;
  return jsiRuntime ? [[EXJavaScriptRuntime alloc] initWithRuntime:jsiRuntime callInvoker:bridge.jsCallInvoker] : nil;
}

+ (BOOL)installExpoModulesHostObject:(nonnull EXAppContext *)appContext
{
  EXJavaScriptRuntime *runtime = [appContext runtime];

  // The runtime may be unavailable, e.g. remote debugger is enabled or it hasn't been set yet.
  if (!runtime) {
    return false;
  }

  EXJavaScriptObject *global = [runtime global];
  EXJavaScriptObject *mainObject = [runtime mainObject];

  if ([mainObject hasProperty:modulesHostObjectPropertyName]) {
    return false;
  }

  std::shared_ptr<expo::ExpoModulesHostObject> modulesHostObjectPtr = std::make_shared<expo::ExpoModulesHostObject>(appContext);
  EXJavaScriptObject *modulesHostObject = [runtime createHostObject:modulesHostObjectPtr];

  // Define the `global.expo.modules` object as a non-configurable, read-only and enumerable property.
  [mainObject defineProperty:modulesHostObjectPropertyName
                       value:modulesHostObject
                     options:EXJavaScriptObjectPropertyDescriptorEnumerable];

  // Also define `global.ExpoModules` for backwards compatibility (used before SDK47, can be removed in SDK48).
  [global defineProperty:modulesHostObjectLegacyPropertyName
                   value:modulesHostObject
                 options:EXJavaScriptObjectPropertyDescriptorEnumerable];
  return true;
}

@end
