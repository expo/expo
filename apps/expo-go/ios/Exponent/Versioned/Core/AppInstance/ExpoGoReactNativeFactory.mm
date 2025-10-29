
#import "ExpoGoReactNativeFactory.h"
#import <RCTAppSetupUtils.h>
#import <React/CoreModulesPlugins.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesCore-Swift.h>


@implementation ExpoGoReactNativeFactory {
  EXAppContext *_appContext;
}

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
}

- (void)host:(nonnull RCTHost *)host didInitializeRuntime:(jsi::Runtime &)runtime
{
  _appContext = [[EXAppContext alloc] init];
  
  // Inject and decorate the `global.expo` object
  _appContext._runtime = [[EXRuntime alloc] initWithRuntime:runtime];
  [_appContext setHostWrapper:[[EXHostWrapper alloc] initWithHost:host]];
  
  [_appContext registerNativeModules];
}

@end
