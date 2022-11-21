// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXSplashScreen/ABI47_0_0EXSplashScreenModule.h>
#import <ABI47_0_0EXSplashScreen/ABI47_0_0EXSplashScreenService.h>
#import <ABI47_0_0React/ABI47_0_0RCTRootView.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAppLifecycleService.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUtilities.h>

@protocol ABI47_0_0EXSplashScreenUtilService

- (UIViewController *)currentViewController;

@end

@interface ABI47_0_0EXSplashScreenModule ()

@property (nonatomic, weak) ABI47_0_0EXModuleRegistry *moduleRegistry;
@property (nonatomic, weak) id<ABI47_0_0EXUtilitiesInterface> utilities;

@end

@implementation ABI47_0_0EXSplashScreenModule

ABI47_0_0EX_EXPORT_MODULE(ExpoSplashScreen);

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
  _utilities = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXUtilitiesInterface)];
  [[moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXAppLifecycleService)] registerAppLifecycleListener:self];
}

ABI47_0_0EX_EXPORT_METHOD_AS(hideAsync,
                    hideWithResolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  ABI47_0_0EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    UIViewController *currentViewController = [self reactViewController];
    [[self splashScreenService] hideSplashScreenFor:currentViewController
                                            options:ABI47_0_0EXSplashScreenDefault
                                    successCallback:^(BOOL hasEffect){ resolve(@(hasEffect)); }
                                    failureCallback:^(NSString *message){ reject(@"ERR_SPLASH_SCREEN_CANNOT_HIDE", message, nil); }];
  });
}

ABI47_0_0EX_EXPORT_METHOD_AS(preventAutoHideAsync,
                    preventAutoHideWithResolve:(ABI47_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  ABI47_0_0EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    UIViewController *currentViewController = [self reactViewController];
    [[self splashScreenService] preventSplashScreenAutoHideFor:currentViewController
                                                       options:ABI47_0_0EXSplashScreenDefault
                                               successCallback:^(BOOL hasEffect){ resolve(@(hasEffect)); }
                                               failureCallback:^(NSString *message){ reject(@"ERR_SPLASH_SCREEN_CANNOT_PREVENT_AUTOHIDE", message, nil); }];
  });
}

# pragma mark - ABI47_0_0EXAppLifecycleListener

- (void)onAppBackgrounded {}

- (void)onAppForegrounded {}

- (void)onAppContentDidAppear
{
  ABI47_0_0EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    UIViewController* currentViewController = [self reactViewController];
    [[self splashScreenService] onAppContentDidAppear:currentViewController];
  });
}

- (void)onAppContentWillReload
{
  ABI47_0_0EX_WEAKIFY(self);
  dispatch_async(dispatch_get_main_queue(), ^{
    ABI47_0_0EX_ENSURE_STRONGIFY(self);
    UIViewController* currentViewController = [self reactViewController];
    [[self splashScreenService] onAppContentWillReload:currentViewController];
  });
}

# pragma mark - internals

/**
 * Tries to obtain singleton module that is registered as "SplashScreen".
 * Silent agreement is that registered module conforms to "ABI47_0_0EXSplashScreenService" protocol.
 */
- (id<ABI47_0_0EXSplashScreenService>)splashScreenService
{
  return [self.moduleRegistry getSingletonModuleForName:@"SplashScreen"];
}

/**
 * Tries to obtain a reference to the UIViewController for the main ABI47_0_0RCTRootView
 * by iterating through all of the application's windows and their viewControllers
 * until it finds one with a ABI47_0_0RCTRootView.
 */
- (UIViewController *)reactViewController
{
  dispatch_assert_queue(dispatch_get_main_queue());

  // first check to see if the host application has a module that provides the reference we want
  // (this is the case in Expo Go and in the ExpoKit pod used in `expo build` apps)
  id<ABI47_0_0EXSplashScreenUtilService> utilService = [_moduleRegistry getSingletonModuleForName:@"Util"];
  if (utilService != nil) {
    return [utilService currentViewController];
  }

  UIViewController *controller = [self viewControllerContainingRCTRootView];
  if (!controller) {
    // no ABI47_0_0RCTRootView was found, so just fall back to the key window's root view controller
    controller = self.utilities.currentViewController;
    while ([controller isKindOfClass:[UIAlertController class]] &&
           controller.presentingViewController != nil) {
      controller = controller.presentingViewController;
    }
    return controller;
  }

  UIViewController *presentedController = controller.presentedViewController;
  while (presentedController &&
         ![presentedController isBeingDismissed] &&
         ![presentedController isKindOfClass:[UIAlertController class]]) {
    controller = presentedController;
    presentedController = controller.presentedViewController;
  }
  return controller;
}

- (nullable UIViewController *)viewControllerContainingRCTRootView
{
  NSArray<UIWindow *> *allWindows;
  if (@available(iOS 13, *)) {
    NSSet<UIScene *> *allWindowScenes = UIApplication.sharedApplication.connectedScenes;
    NSMutableArray<UIWindow *> *allForegroundWindows = [NSMutableArray new];
    for (UIScene *scene in allWindowScenes.allObjects) {
      if ([scene isKindOfClass:[UIWindowScene class]] && scene.activationState == UISceneActivationStateForegroundActive) {
        [allForegroundWindows addObjectsFromArray:((UIWindowScene *)scene).windows];
      }
    }
    allWindows = allForegroundWindows;
  } else {
    allWindows = UIApplication.sharedApplication.windows;
  }

  for (UIWindow *window in allWindows) {
    UIViewController *controller = window.rootViewController;
    if ([controller.view isKindOfClass:[ABI47_0_0RCTRootView class]]) {
      return controller;
    }
    UIViewController *presentedController = controller.presentedViewController;
    while (presentedController && ![presentedController isBeingDismissed]) {
      if ([presentedController.view isKindOfClass:[ABI47_0_0RCTRootView class]]) {
        return presentedController;
      }
      controller = presentedController;
      presentedController = controller.presentedViewController;
    }
  }

  // no ABI47_0_0RCTRootView was found
  return nil;
}

@end
