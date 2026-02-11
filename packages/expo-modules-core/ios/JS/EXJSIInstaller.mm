// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesJSI/BridgelessJSCallInvoker.h>

#import <ExpoModulesCore/EXJSIInstaller.h>
#import <ExpoModulesCore/ExpoModulesHostObject.h>
#import <ExpoModulesCore/LazyObject.h>
#import <ExpoModulesCore/SharedObject.h>
#import <ExpoModulesCore/SharedRef.h>
#import <ExpoModulesCore/EventEmitter.h>
#import <ExpoModulesCore/NativeModule.h>
#import <ExpoModulesCore/Swift.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesJSI/EXJSIUtils.h>

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

namespace jsi = facebook::jsi;

/**
 Property name of the core object in the global scope of the Expo JS runtime.
 */
NSString *const EXGlobalCoreObjectPropertyName = @"expo";

/**
 Property name used to define the modules host object in the main object of the Expo JS runtime.
 */
static NSString *modulesHostObjectPropertyName = @"modules";

@interface RCTBridge (ExpoBridgeWithRuntime)

- (void *)runtime;
- (std::shared_ptr<facebook::react::CallInvoker>)jsCallInvoker;

@end

@implementation EXJavaScriptRuntimeManager

+ (nullable EXRuntime *)runtimeFromBridge:(nonnull RCTBridge *)bridge
{
  jsi::Runtime *jsiRuntime = reinterpret_cast<jsi::Runtime *>(bridge.runtime);
  if (!jsiRuntime) {
    return nil;
  }

  return [[EXRuntime alloc] initWithRuntime:*jsiRuntime];
}

#pragma mark - Installing JSI bindings

+ (BOOL)installExpoModulesHostObject:(nonnull EXAppContext *)appContext
{
  EXRuntime *runtime = [appContext _runtime];

  // The runtime may be unavailable, e.g. remote debugger is enabled or it hasn't been set yet.
  if (!runtime) {
    return false;
  }

  EXJavaScriptObject *global = [runtime global];
  EXJavaScriptValue *coreProperty = [global getProperty:EXGlobalCoreObjectPropertyName];
  NSAssert([coreProperty isObject], @"The global core property should be an object");
  EXJavaScriptObject *coreObject = [coreProperty getObject];

  if ([coreObject hasProperty:modulesHostObjectPropertyName]) {
    return false;
  }

  std::shared_ptr<expo::ExpoModulesHostObject> modulesHostObjectPtr = std::make_shared<expo::ExpoModulesHostObject>(appContext);
  EXJavaScriptObject *modulesHostObject = [runtime createHostObject:modulesHostObjectPtr];

  // Define the `global.expo.modules` object as a non-configurable, read-only and enumerable property.
  [coreObject defineProperty:modulesHostObjectPropertyName
                       value:modulesHostObject
                     options:EXJavaScriptObjectPropertyDescriptorEnumerable];

  return true;
}

+ (void)installSharedObjectClass:(nonnull EXRuntime *)runtime releaser:(void(^)(long))releaser
{
  expo::SharedObject::installBaseClass(*[runtime get], [releaser](expo::SharedObject::ObjectId objectId) {
    releaser(objectId);
  });
}

+ (void)installSharedRefClass:(nonnull EXJavaScriptRuntime *)runtime
{
  expo::SharedRef::installBaseClass(*[runtime get]);
}

+ (void)installEventEmitterClass:(nonnull EXJavaScriptRuntime *)runtime
{
  expo::EventEmitter::installClass(*[runtime get]);
}

+ (void)installNativeModuleClass:(nonnull EXJavaScriptRuntime *)runtime
{
  expo::NativeModule::installClass(*[runtime get]);
}

@end
