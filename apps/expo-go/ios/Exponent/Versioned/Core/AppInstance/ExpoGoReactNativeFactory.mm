
#import "ExpoGoReactNativeFactory.h"
#import "ExpoAppInstance.h"
#import <RCTAppSetupUtils.h>
#import <React/CoreModulesPlugins.h>
#import <ExpoModulesCore/EXHostWrapper.h>
#import <ExpoModulesCore/EXReactSchedulerDispatch.h>
#import <ExpoModulesCore-Swift.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>


@implementation ExpoGoReactNativeFactory

- (Class)getModuleClassFromName:(const char *)name
{
  if([self.delegate respondsToSelector:@selector(getModuleClassFromName:)]) {
    return [self.delegate getModuleClassFromName:name];
  }
  return RCTCoreModulesClassProvider(name);
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  if ([self.delegate respondsToSelector:@selector(getModuleInstanceFromClass:)]) {
    return [self.delegate getModuleInstanceFromClass:moduleClass];
  }
  return RCTAppSetupDefaultModuleFromClass(moduleClass, self.delegate.dependencyProvider);
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge {
  if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    return [self.delegate extraModulesForBridge:bridge];
  }
  return @[];
}

- (void)loadBundleAtURL:(NSURL *)sourceURL onProgress:(RCTSourceLoadProgressBlock)onProgress onComplete:(RCTSourceLoadBlock)loadCallback {
  if ([self.delegate respondsToSelector:@selector(loadBundleAtURL:onProgress:onComplete:)]) {
    [self.delegate loadBundleAtURL:sourceURL onProgress:onProgress onComplete:loadCallback];
  }
}

- (void)hostDidStart:(nonnull RCTHost *)host {
  if ([self.delegate respondsToSelector:@selector(hostDidStart:)]) {
    [self.delegate hostDidStart:host];
  }
}

- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime
{
  ExpoAppInstance *appInstance = (ExpoAppInstance *)self.delegate;
  EXAppContext *appContext = [appInstance createExpoGoAppContext];

  // See ExpoReactNativeFactory.mm for the rationale behind passing the React
  // runtime scheduler + dispatch trampoline alongside the runtime pointer.
  auto binding = facebook::react::RuntimeSchedulerBinding::getBinding(runtime);
  auto scheduler = binding ? binding->getRuntimeScheduler() : nullptr;

  [appContext setRuntime:&runtime
               scheduler:scheduler.get()
                dispatch:scheduler ? reinterpret_cast<const void *>(&expo::dispatchOnReactScheduler) : nullptr];
  [appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];

  [appContext registerNativeModules];
}

@end
