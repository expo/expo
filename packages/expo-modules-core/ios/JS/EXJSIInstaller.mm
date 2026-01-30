// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXJSIInstaller.h>
#import <ExpoModulesCore/SharedObject.h>
#import <ExpoModulesCore/SharedRef.h>
#import <ExpoModulesCore/EventEmitter.h>
#import <ExpoModulesCore/NativeModule.h>
#import <ExpoModulesCore/Swift.h>

namespace jsi = facebook::jsi;

/**
 Property name of the core object in the global scope of the Expo JS runtime.
 */
NSString *const EXGlobalCoreObjectPropertyName = @"expo";

/**
 Property name used to define the modules host object in the main object of the Expo JS runtime.
 */
static NSString *modulesHostObjectPropertyName = @"modules";

@implementation EXJavaScriptRuntimeManager {
  std::shared_ptr<jsi::Runtime> _runtime;
}

- (nonnull instancetype)initWithRuntime:(nonnull void *)runtime
{
  if (self = [super init]) {
    // Make shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
    _runtime = std::shared_ptr<jsi::Runtime>(std::shared_ptr<jsi::Runtime>(), reinterpret_cast<jsi::Runtime *>(runtime));
  }
  return self;
}

#pragma mark - Installing JSI bindings

- (void)installSharedObjectClass:(void(^)(long))releaser
{
  expo::SharedObject::installBaseClass(*_runtime, [releaser](expo::SharedObject::ObjectId objectId) {
    releaser(objectId);
  });
}

- (void)installSharedRefClass
{
  expo::SharedRef::installBaseClass(*_runtime);
}

- (void)installEventEmitterClass
{
  expo::EventEmitter::installClass(*_runtime);
}

- (void)installNativeModuleClass
{
  expo::NativeModule::installClass(*_runtime);
}

@end
