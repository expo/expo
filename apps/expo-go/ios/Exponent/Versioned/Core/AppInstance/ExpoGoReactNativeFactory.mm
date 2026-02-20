
#import "ExpoGoReactNativeFactory.h"
#import "ExpoAppInstance.h"
#import <RCTAppSetupUtils.h>
#import <React/CoreModulesPlugins.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesCore-Swift.h>


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
  host.runtimeDelegate = self;
  if ([self.delegate respondsToSelector:@selector(hostDidStart:)]) {
    [self.delegate hostDidStart:host];
  }
}

- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(jsi::Runtime &)runtime
{
  ExpoAppInstance *appInstance = (ExpoAppInstance *)self.delegate;
  EXAppContext *appContext = [appInstance createExpoGoAppContext];

  // Inject and decorate the `global.expo` object
  appContext._runtime = [[EXRuntime alloc] initWithRuntime:runtime];
  [appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];

  [appContext registerNativeModules];
}

@end
