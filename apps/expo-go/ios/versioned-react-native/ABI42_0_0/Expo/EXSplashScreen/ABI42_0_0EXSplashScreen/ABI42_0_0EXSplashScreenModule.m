// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXSplashScreen/ABI42_0_0EXSplashScreenModule.h>
#import <ABI42_0_0EXSplashScreen/ABI42_0_0EXSplashScreenService.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMAppLifecycleService.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMUtilities.h>

@interface ABI42_0_0EXSplashScreenModule ()

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI42_0_0UMUtilitiesInterface> utilities;

@end

@implementation ABI42_0_0EXSplashScreenModule

ABI42_0_0UM_EXPORT_MODULE(ExpoSplashScreen);

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMUtilitiesInterface)];
  [[moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0UMAppLifecycleService)] registerAppLifecycleListener:self];
}

ABI42_0_0UM_EXPORT_METHOD_AS(hideAsync,
                    hideWithResolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController *currentViewController = self.utilities.currentViewController;
    [[self splashScreenService] hideSplashScreenFor:currentViewController
                                    successCallback:^(BOOL hasEffect){ resolve(@(hasEffect)); }
                                    failureCallback:^(NSString *message){ reject(@"ERR_SPLASH_SCREEN_CANNOT_HIDE", message, nil); }];
  });
}

ABI42_0_0UM_EXPORT_METHOD_AS(preventAutoHideAsync,
                    preventAutoHideWithResolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController *currentViewController = self.utilities.currentViewController;
    [[self splashScreenService] preventSplashScreenAutoHideFor:currentViewController
                                               successCallback:^(BOOL hasEffect){ resolve(@(hasEffect)); }
                                               failureCallback:^(NSString *message){ reject(@"ERR_SPLASH_SCREEN_CANNOT_PREVENT_AUTOHIDE", message, nil); }];
  });
}

# pragma mark - ABI42_0_0UMAppLifecycleListener

- (void)onAppBackgrounded {}

- (void)onAppForegrounded {}

- (void)onAppContentDidAppear
{
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController* currentViewController = self.utilities.currentViewController;
    [[self splashScreenService] onAppContentDidAppear:currentViewController];
  });
}

- (void)onAppContentWillReload
{
  ABI42_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI42_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController* currentViewController = self.utilities.currentViewController;
    [[self splashScreenService] onAppContentWillReload:currentViewController];
  });
}

# pragma mark - internals

/**
 * Tries to obtain singleton module that is registered as "SplashScreen".
 * Silent agreement is that registered module conforms to "ABI42_0_0EXSplashScreenService" protocol.
 */
- (id<ABI42_0_0EXSplashScreenService>)splashScreenService
{
  return [self.moduleRegistry getSingletonModuleForName:@"SplashScreen"];
}

@end
