// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI45_0_0EXSplashScreen/ABI45_0_0EXSplashScreenService.h>
#import <ABI45_0_0EXSplashScreen/ABI45_0_0EXSplashScreenViewNativeProvider.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXDefines.h>

static NSString * const kRootViewController = @"rootViewController";
static NSString * const kView = @"view";

@interface ABI45_0_0EXSplashScreenService ()

@property (nonatomic, strong) NSMapTable<UIViewController *, ABI45_0_0EXSplashScreenViewController *> *splashScreenControllers;
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

@implementation ABI45_0_0EXSplashScreenService

ABI45_0_0EX_REGISTER_SINGLETON_MODULE(SplashScreen);

- (instancetype)init
{
  if (self = [super init]) {
    _splashScreenControllers = [NSMapTable weakToStrongObjectsMapTable];
  }
  return self;
}

- (void)showSplashScreenFor:(UIViewController *)viewController
{
  id<ABI45_0_0EXSplashScreenViewProvider> splashScreenViewProvider = [ABI45_0_0EXSplashScreenViewNativeProvider new];
  return [self showSplashScreenFor:viewController
          splashScreenViewProvider:splashScreenViewProvider
                   successCallback:^{}
                   failureCallback:^(NSString *message){ ABI45_0_0EXLogWarn(@"%@", message); }];
}


- (void)showSplashScreenFor:(UIViewController *)viewController
   splashScreenViewProvider:(id<ABI45_0_0EXSplashScreenViewProvider>)splashScreenViewProvider
            successCallback:(void (^)(void))successCallback
            failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if ([self.splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"'SplashScreen.show' has already been called for given view controller.");
  }
  
  
  UIView *rootView = viewController.view;
  UIView *splashScreenView = [splashScreenViewProvider createSplashScreenView];
  ABI45_0_0EXSplashScreenViewController *splashScreenController = [[ABI45_0_0EXSplashScreenViewController alloc] initWithRootView:rootView
                                                                                               splashScreenView:splashScreenView];
  
  [self showSplashScreenFor:viewController
     splashScreenController:splashScreenController
            successCallback:successCallback
            failureCallback:failureCallback];
}

- (void)showSplashScreenFor:(UIViewController *)viewController
     splashScreenController:(ABI45_0_0EXSplashScreenViewController *)splashScreenController
            successCallback:(void (^)(void))successCallback
            failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if ([self.splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"'SplashScreen.show' has already been called for given view controller.");
  }
  
  [self.splashScreenControllers setObject:splashScreenController forKey:viewController];
  [[self.splashScreenControllers objectForKey:viewController] showWithCallback:successCallback
                                                               failureCallback:failureCallback];
}

- (void)preventSplashScreenAutoHideFor:(UIViewController *)viewController
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
  if (![self.splashScreenControllers objectForKey:viewController]) {
    ABI45_0_0EXLogWarn(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
  }
  BOOL needsHide = [[self.splashScreenControllers objectForKey:viewController] needsHideOnAppContentDidAppear];
  if (needsHide) {
    [self hideSplashScreenFor:viewController
              successCallback:^(BOOL hasEffect){}
              failureCallback:^(NSString *message){}];
  }
}

- (void)onAppContentWillReload:(UIViewController *)viewController
{
  if (![self.splashScreenControllers objectForKey:viewController]) {
    ABI45_0_0EXLogWarn(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
  }
  BOOL needsShow = [[self.splashScreenControllers objectForKey:viewController] needsShowOnAppContentWillReload];
  if (needsShow) {
    [self showSplashScreenFor:viewController
       splashScreenController:[self.splashScreenControllers objectForKey:viewController]
              successCallback:^{}
              failureCallback:^(NSString *message){}];
  }
}

# pragma mark - UIApplicationDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  UIViewController *rootViewController = [[application keyWindow] rootViewController];
  if (rootViewController) {
    [self showSplashScreenFor:rootViewController];
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
    if (newRootViewController != nil) {
      [self removeRootViewControllerListener];
      [self showSplashScreenFor:newRootViewController];
      [self addRootViewControllerListener];
    }
  }
  if (object == UIApplication.sharedApplication.keyWindow.rootViewController && [keyPath isEqualToString:kView]) {
    UIView *newView = change[@"new"];
    if (newView != nil && [newView.nextResponder isKindOfClass:[UIViewController class]]) {
      UIViewController *viewController = (UIViewController *)newView.nextResponder;
      // To show splash screen as soon as possible, we do not wait for hiding callback and call showSplashScreen immediately.
      // GCD main queue should keep the calls in sequence.
      [self hideSplashScreenFor:viewController successCallback:^(BOOL hasEffect){} failureCallback:^(NSString *message){}];
      [self.splashScreenControllers removeObjectForKey:viewController];
      [self showSplashScreenFor:viewController];
    }
  }
}

@end
