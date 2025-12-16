
#import "ExpoGoReactNativeFactory.h"
#import "ExpoGoRootViewFactory.h"
#import <RCTAppSetupUtils.h>
#import <React/CoreModulesPlugins.h>

@implementation ExpoGoReactNativeFactory

- (RCTRootViewFactory *)createRCTRootViewFactory
{
  __weak __typeof(self) weakSelf = self;
  RCTBundleURLBlock bundleUrlBlock = ^{
    return [weakSelf.delegate bundleURL];
  };

  RCTRootViewFactoryConfiguration *configuration =
      [[RCTRootViewFactoryConfiguration alloc] initWithBundleURLBlock:bundleUrlBlock
                                                       newArchEnabled:YES
                                                   turboModuleEnabled:YES
                                                    bridgelessEnabled:YES];

  configuration.createRootViewWithBridge = ^UIView *(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps) {
    return [weakSelf.delegate createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions) {
    return [weakSelf.delegate createBridgeWithDelegate:delegate launchOptions:launchOptions];
  };

  configuration.customizeRootView = ^(UIView *_Nonnull rootView) {
    [weakSelf.delegate customizeRootView:(RCTRootView *)rootView];
  };

  configuration.sourceURLForBridge = ^NSURL *_Nullable(RCTBridge *_Nonnull bridge)
  {
    return [weakSelf.delegate bundleURL];
  };

  if ([self.delegate respondsToSelector:@selector(extraModulesForBridge:)]) {
    configuration.extraModulesForBridge = ^NSArray<id<RCTBridgeModule>> *_Nonnull(RCTBridge *_Nonnull bridge)
    {
      return [weakSelf.delegate extraModulesForBridge:bridge];
    };
  }

  if ([self.delegate respondsToSelector:@selector(loadBundleAtURL:onProgress:onComplete:)]) {
    configuration.loadSourceForBridgeWithProgress =
        ^(RCTBridge *_Nonnull bridge,
          RCTSourceLoadProgressBlock _Nonnull onProgress,
          RCTSourceLoadBlock _Nonnull loadCallback) {
          [weakSelf.delegate loadBundleAtURL:[weakSelf.delegate bundleURL] onProgress:onProgress onComplete:loadCallback];
        };
  }

  configuration.jsRuntimeConfiguratorDelegate = (id<RCTJSRuntimeConfiguratorProtocol>)self;

  // Use ExpoGoRootViewFactory instead of RCTRootViewFactory to inject builtins before main bundle
  // Cast self since RCTReactNativeFactory conforms to these protocols in a class extension
  return [[ExpoGoRootViewFactory alloc] initWithTurboModuleDelegate:(id<RCTTurboModuleManagerDelegate>)self
                                                       hostDelegate:(id<RCTHostDelegate>)self
                                                      configuration:configuration];
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

@end
