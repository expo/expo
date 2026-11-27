// Copyright 2018-present 650 Industries. All rights reserved.

#import <Expo/EXReactRootViewFactory.h>
#import <Expo/RCTAppDelegateUmbrella.h>
#import <React/RCTDevMenu.h>
#import <ExpoModulesCore/EXReactDelegateProtocol.h>

@implementation EXReactRootViewFactory

- (instancetype)initWithReactDelegate:(nullable EXReactDelegate *)reactDelegate
                        configuration:(RCTRootViewFactoryConfiguration *)configuration
           turboModuleManagerDelegate:(nullable id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
{
  if (self = [super initWithConfiguration:configuration andTurboModuleManagerDelegate:turboModuleManagerDelegate]) {
    self.reactDelegate = reactDelegate;
    _fallbackBundleURLBlock = configuration.bundleURLBlock;

    __weak __typeof(self) weakSelf = self;
    configuration.bundleURLBlock = ^NSURL *_Nullable {
      EXReactRootViewFactory *strongSelf = weakSelf;
      if (strongSelf == nil) {
        return nil;
      }
      return [((id<EXReactDelegateProtocol>)strongSelf.reactDelegate) bundleURL] ?: strongSelf.fallbackBundleURLBlock();
    };
  }
  return self;
}

#if TARGET_OS_IOS || TARGET_OS_TV
- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
                 launchOptions:(nullable NSDictionary *)launchOptions
           bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
          devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self.reactDelegate != nil) {
    return [((id<EXReactDelegateProtocol>)self.reactDelegate) createReactRootViewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
  }
  return [super viewWithModuleName:moduleName
                 initialProperties:initialProperties
                     launchOptions:launchOptions
               bundleConfiguration:bundleConfiguration
              devMenuConfiguration:devMenuConfiguration];
}

- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
                bundleConfiguration:(RCTBundleConfiguration *)bundleConfiguration
               devMenuConfiguration:(RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (bundleConfiguration == nil) {
    bundleConfiguration = [RCTBundleConfiguration defaultConfiguration];
  }
  if (devMenuConfiguration == nil) {
    devMenuConfiguration = [RCTDevMenuConfiguration defaultConfiguration];
  }

  return [super viewWithModuleName:moduleName
                 initialProperties:initialProperties
                     launchOptions:launchOptions
               bundleConfiguration:bundleConfiguration
              devMenuConfiguration:devMenuConfiguration];
}
#else
// react-native-macos routes every `viewWithModuleName:` variant, including the one called by
// `RCTReactNativeFactory`, through this one.
- (UIView *)viewWithModuleName:(NSString *)moduleName
             initialProperties:(nullable NSDictionary *)initialProperties
                 launchOptions:(nullable NSDictionary *)launchOptions
          devMenuConfiguration:(nullable RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (self.reactDelegate != nil) {
    return [((id<EXReactDelegateProtocol>)self.reactDelegate) createReactRootViewWithModuleName:moduleName initialProperties:initialProperties launchOptions:launchOptions];
  }
  return [super viewWithModuleName:moduleName
                 initialProperties:initialProperties
                     launchOptions:launchOptions
              devMenuConfiguration:devMenuConfiguration];
}

- (UIView *)superViewWithModuleName:(NSString *)moduleName
                  initialProperties:(nullable NSDictionary *)initialProperties
                      launchOptions:(nullable NSDictionary *)launchOptions
               devMenuConfiguration:(nullable RCTDevMenuConfiguration *)devMenuConfiguration
{
  if (devMenuConfiguration == nil) {
    devMenuConfiguration = [RCTDevMenuConfiguration defaultConfiguration];
  }

  return [super viewWithModuleName:moduleName
                 initialProperties:initialProperties
                     launchOptions:launchOptions
              devMenuConfiguration:devMenuConfiguration];
}
#endif

@end
