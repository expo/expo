
#import "ExpoGoReactNativeFactory.h"
#import "EXGoReactNativeFeatureFlags.h"
#import <RCTAppSetupUtils.h>
#import <React/CoreModulesPlugins.h>

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

- (BOOL)newArchEnabled
{
  if ([self.delegate respondsToSelector:@selector(newArchEnabled)]) {
    return self.delegate.newArchEnabled;
  }
  
#if RCT_NEW_ARCH_ENABLED
  return YES;
#else
  return NO;
#endif
}

- (BOOL)bridgelessEnabled
{
  if ([self.delegate respondsToSelector:@selector(bridgelessEnabled)]) {
    return self.delegate.bridgelessEnabled;
  }
  
  return [self newArchEnabled];
}

-(void)_setUpFeatureFlags {
  static dispatch_once_t setupFeatureFlagsToken;
  dispatch_once(&setupFeatureFlagsToken, ^{
    if ([self bridgelessEnabled]) {
      [EXGoReactNativeFeatureFlags setup];
    }
  });
}

@end
