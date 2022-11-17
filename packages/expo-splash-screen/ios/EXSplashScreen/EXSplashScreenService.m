// Copyright © 2018 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenService.h>
#import <EXSplashScreen/EXSplashScreenViewNativeProvider.h>
#import <ExpoModulesCore/EXDefines.h>

static NSString * const kRootViewController = @"rootViewController";
static NSString * const kView = @"view";

@interface EXSplashScreenService ()

@property (nonatomic, strong) NSMapTable<UIViewController *, EXSplashScreenViewController *> *splashScreenControllers;
/**
 * This module holds a reference to rootViewController acting as a flag to indicate KVO is enabled.
 * When KVO is enabled, actually we are observing two targets and re-show splash screen if targets changed:
 *   - `keyWindow.rootViewController`: it is for expo-dev-client which replaced it in startup.
 *   - `rootViewController.rootView`: it is for expo-updates which replaced it in startup.
 *
 * If `rootViewController` is changed, we also need the old `rootViewController` to unregister rootView KVO.
 * That's why we keep a weak reference here but not a boolean flag.
 */
@property (nonatomic, weak) UIViewController *observingRootViewController;

@end

@implementation EXSplashScreenService

EX_REGISTER_SINGLETON_MODULE(SplashScreen);

- (instancetype)init
{
  if (self = [super init]) {
    _splashScreenControllers = [NSMapTable weakToStrongObjectsMapTable];
  }
  return self;
}

- (void)showSplashScreenFor:(UIViewController *)viewController
                    options:(EXSplashScreenOptions)options
{
  id<EXSplashScreenViewProvider> splashScreenViewProvider = [EXSplashScreenViewNativeProvider new];
  return [self showSplashScreenFor:viewController
                           options:options
          splashScreenViewProvider:splashScreenViewProvider
                   successCallback:^{}
                   failureCallback:^(NSString *message){ EXLogWarn(@"%@", message); }];
}


- (void)showSplashScreenFor:(UIViewController *)viewController
                    options:(EXSplashScreenOptions)options
   splashScreenViewProvider:(id<EXSplashScreenViewProvider>)splashScreenViewProvider
            successCallback:(void (^)(void))successCallback
            failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if ((options & EXSplashScreenForceShow) == 0 && [self.splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"'SplashScreen.show' has already been called for given view controller.");
  }
  
  
  UIView *rootView = viewController.view;
  UIView *splashScreenView = [splashScreenViewProvider createSplashScreenView];
  EXSplashScreenViewController *splashScreenController = [[EXSplashScreenViewController alloc] initWithRootView:rootView
                                                                                               splashScreenView:splashScreenView];
  
  [self showSplashScreenFor:viewController
                    options:options
     splashScreenController:splashScreenController
            successCallback:successCallback
            failureCallback:failureCallback];
}

- (void)showSplashScreenFor:(UIViewController *)viewController
                    options:(EXSplashScreenOptions)options
     splashScreenController:(EXSplashScreenViewController *)splashScreenController
            successCallback:(void (^)(void))successCallback
            failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if ((options & EXSplashScreenForceShow) == 0 && [self.splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"'SplashScreen.show' has already been called for given view controller.");
  }
  
  [self.splashScreenControllers setObject:splashScreenController forKey:viewController];
  [[self.splashScreenControllers objectForKey:viewController] showWithCallback:successCallback
                                                               failureCallback:failureCallback];
}

- (void)preventSplashScreenAutoHideFor:(UIViewController *)viewController
                               options:(EXSplashScreenOptions)options
                       successCallback:(void (^)(BOOL hasEffect))successCallback
                       failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if (![self.splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
  }
  
  return [[self.splashScreenControllers objectForKey:viewController] preventAutoHideWithCallback:successCallback
                                                                                 failureCallback:failureCallback];
}

- (void)hideSplashScreenFor:(UIViewController *)viewController
                    options:(EXSplashScreenOptions)options
            successCallback:(void (^)(BOOL hasEffect))successCallback
            failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if (![self.splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
  }
  [self removeRootViewControllerListener];

  return [[self.splashScreenControllers objectForKey:viewController] hideWithCallback:successCallback
                                                                      failureCallback:failureCallback];
}

- (void)onAppContentDidAppear:(UIViewController *)viewController
{
  if ([self isAppActive] && ![self.splashScreenControllers objectForKey:viewController]) {
    EXLogWarn(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
  }
  BOOL needsHide = [[self.splashScreenControllers objectForKey:viewController] needsHideOnAppContentDidAppear];
  if (needsHide) {
    [self hideSplashScreenFor:viewController
                      options:EXSplashScreenDefault
              successCallback:^(BOOL hasEffect){}
              failureCallback:^(NSString *message){}];
  }
}

- (void)onAppContentWillReload:(UIViewController *)viewController
{
  if ([self isAppActive] && ![self.splashScreenControllers objectForKey:viewController]) {
    EXLogWarn(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
  }
  BOOL needsShow = [[self.splashScreenControllers objectForKey:viewController] needsShowOnAppContentWillReload];
  if (needsShow) {
    // For reloading apps, specify `EXSplashScreenForceShow` to show splash screen again
    [self showSplashScreenFor:viewController
                      options:EXSplashScreenForceShow
       splashScreenController:[self.splashScreenControllers objectForKey:viewController]
              successCallback:^{}
              failureCallback:^(NSString *message){}];
  }
}

- (BOOL)isAppActive {
    return UIApplication.sharedApplication.applicationState == UIApplicationStateActive;
}

# pragma mark - UIApplicationDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  UIViewController *rootViewController = [[application keyWindow] rootViewController];
  if (rootViewController) {
    [self showSplashScreenFor:rootViewController options:EXSplashScreenDefault];
  }

  [self addRootViewControllerListener];
  return YES;
}

# pragma mark - RootViewController KVO

- (void)addRootViewControllerListener
{
  NSAssert([NSThread isMainThread], @"Method must be called on main thread");
  if (self.observingRootViewController == nil) {
    UIViewController *rootViewController = UIApplication.sharedApplication.keyWindow.rootViewController;

    [UIApplication.sharedApplication.keyWindow addObserver:self
                                                forKeyPath:kRootViewController
                                                   options:NSKeyValueObservingOptionNew
                                                   context:nil];

    [rootViewController addObserver:self forKeyPath:kView options:NSKeyValueObservingOptionNew context:nil];
    self.observingRootViewController = rootViewController;
  }
}

- (void)removeRootViewControllerListener
{
  NSAssert([NSThread isMainThread], @"Method must be called on main thread");
  if (self.observingRootViewController != nil) {
    UIWindow *window = self.observingRootViewController.view.window;
    [window removeObserver:self forKeyPath:kRootViewController context:nil];
    [self.observingRootViewController removeObserver:self forKeyPath:kView context:nil];
    self.observingRootViewController = nil;
  }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context
{
  if (object == UIApplication.sharedApplication.keyWindow && [keyPath isEqualToString:kRootViewController]) {
    UIViewController *newRootViewController = change[@"new"];
    // For unknown reasons, this function may be sometimes called twice with the same changes.
    // What leads to warnings like this one: `'SplashScreen.show' has already been called for given view controller`.
    // To prevent this weird behaviour, we check if the value was really changed.
    if (newRootViewController != nil && newRootViewController != self.observingRootViewController) {
      [self removeRootViewControllerListener];
      [self showSplashScreenFor:newRootViewController options:EXSplashScreenDefault];
      [self addRootViewControllerListener];
    }
  }
  if (object == UIApplication.sharedApplication.keyWindow.rootViewController && [keyPath isEqualToString:kView]) {
    UIView *newView = change[@"new"];
    if (newView != nil && [newView.nextResponder isKindOfClass:[UIViewController class]]) {
      UIViewController *viewController = (UIViewController *)newView.nextResponder;
      // To show splash screen as soon as possible, we do not wait for hiding callback and call showSplashScreen immediately.
      // GCD main queue should keep the calls in sequence.
      [self hideSplashScreenFor:viewController options:EXSplashScreenDefault successCallback:^(BOOL hasEffect){} failureCallback:^(NSString *message){}];
      [self.splashScreenControllers removeObjectForKey:viewController];
      [self showSplashScreenFor:viewController options:EXSplashScreenDefault];
    }
  }
}

@end
