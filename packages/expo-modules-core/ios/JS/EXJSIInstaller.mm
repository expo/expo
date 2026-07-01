// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/BridgelessJSCallInvoker.h>
#import <ExpoModulesCore/EXAppContextProtocol.h>
#import <ExpoModulesCore/EXJSIInstaller.h>
#import <ExpoModulesCore/SharedObject.h>
#import <ExpoModulesCore/SharedRef.h>
#import <ExpoModulesCore/EventEmitter.h>
#import <ExpoModulesCore/NativeModule.h>

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

namespace jsi = facebook::jsi;

// EXPERIMENT: defined in ExpoViewEventEmitter.cpp. Forward-declared here to avoid a cross-directory
// C++ header include; the linker resolves it. Caches the RuntimeScheduler for synchronous events.
namespace expo {
void setSyncEventScheduler(std::shared_ptr<facebook::react::RuntimeScheduler> scheduler);
}

/**
 Property name used to define the modules host object in the main object of the
 Expo JS runtime.
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

    // EXPERIMENT: cache the RuntimeScheduler so synchronous events (dispatchSync) can run a tick on
    // the main thread. Done here because we're on the JS thread with a valid runtime.
    if (auto binding = facebook::react::RuntimeSchedulerBinding::getBinding(*_runtime)) {
      expo::setSyncEventScheduler(binding->getRuntimeScheduler());
    }
  }
  return self;
}

#pragma mark - Installing JSI bindings

- (void)installSharedObjectClass:(void (^_Nonnull)(long))releaser
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
