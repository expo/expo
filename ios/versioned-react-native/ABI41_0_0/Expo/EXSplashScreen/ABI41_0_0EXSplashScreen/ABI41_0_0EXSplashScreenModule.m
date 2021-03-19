// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXSplashScreen/ABI41_0_0EXSplashScreenModule.h>
#import <ABI41_0_0EXSplashScreen/ABI41_0_0EXSplashScreenService.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleService.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

@interface ABI41_0_0EXSplashScreenModule ()

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI41_0_0UMUtilitiesInterface> utilities;

@end

@implementation ABI41_0_0EXSplashScreenModule

ABI41_0_0UM_EXPORT_MODULE(ExpoSplashScreen);

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMUtilitiesInterface)];
  [[moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMAppLifecycleService)] registerAppLifecycleListener:self];
}

ABI41_0_0UM_EXPORT_METHOD_AS(hideAsync,
                    hideWithResolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController *currentViewController = self.utilities.currentViewController;
    [[self splashScreenService] hideSplashScreenFor:currentViewController
                                    successCallback:^(BOOL hasEffect){ resolve(@(hasEffect)); }
                                    failureCallback:^(NSString *message){ reject(@"ERR_SPLASH_SCREEN_CANNOT_HIDE", message, nil); }];
  });
}

ABI41_0_0UM_EXPORT_METHOD_AS(preventAutoHideAsync,
                    preventAutoHideWithResolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController *currentViewController = self.utilities.currentViewController;
    [[self splashScreenService] preventSplashScreenAutoHideFor:currentViewController
                                               successCallback:^(BOOL hasEffect){ resolve(@(hasEffect)); }
                                               failureCallback:^(NSString *message){ reject(@"ERR_SPLASH_SCREEN_CANNOT_PREVENT_AUTOHIDE", message, nil); }];
  });
}

# pragma mark - ABI41_0_0UMAppLifecycleListener

- (void)onAppBackgrounded {}

- (void)onAppForegrounded {}

- (void)onAppContentDidAppear
{
  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController* currentViewController = self.utilities.currentViewController;
    [[self splashScreenService] onAppContentDidAppear:currentViewController];
  });
}

- (void)onAppContentWillReload
{
  ABI41_0_0UM_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI41_0_0UM_ENSURE_STRONGIFY(self);
    UIViewController* currentViewController = self.utilities.currentViewController;
    [[self splashScreenService] onAppContentWillReload:currentViewController];
  });
}

# pragma mark - internals

/**
 * Tries to obtain singleton module that is registered as "SplashScreen".
 * Silent agreement is that registered module conforms to "ABI41_0_0EXSplashScreenService" protocol.
 */
- (id<ABI41_0_0EXSplashScreenService>)splashScreenService
{
  return [self.moduleRegistry getSingletonModuleForName:@"SplashScreen"];
}

@end
