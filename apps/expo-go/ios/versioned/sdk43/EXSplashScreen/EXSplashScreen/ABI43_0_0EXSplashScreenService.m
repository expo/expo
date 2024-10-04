// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI43_0_0EXSplashScreen/ABI43_0_0EXSplashScreenService.h>
#import <ABI43_0_0EXSplashScreen/ABI43_0_0EXSplashScreenViewNativeProvider.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXDefines.h>

static const NSString *kRootViewController = @"rootViewController";

@interface ABI43_0_0EXSplashScreenService ()

@property (nonatomic, strong) NSMapTable<UIViewController *, ABI43_0_0EXSplashScreenViewController *> *splashScreenControllers;
@property (nonatomic, assign) BOOL isObservingRootViewController;

@end

@implementation ABI43_0_0EXSplashScreenService

ABI43_0_0EX_REGISTER_SINGLETON_MODULE(SplashScreen);

- (instancetype)init
{
  if (self = [super init]) {
    _splashScreenControllers = [NSMapTable weakToStrongObjectsMapTable];
    _isObservingRootViewController = NO;
  }
  return self;
}

- (void)showSplashScreenFor:(UIViewController *)viewController
{
  id<ABI43_0_0EXSplashScreenViewProvider> splashScreenViewProvider = [ABI43_0_0EXSplashScreenViewNativeProvider new];
  return [self showSplashScreenFor:viewController
          splashScreenViewProvider:splashScreenViewProvider
                   successCallback:^{}
                   failureCallback:^(NSString *message){ ABI43_0_0EXLogWarn(@"%@", message); }];
}


- (void)showSplashScreenFor:(UIViewController *)viewController
   splashScreenViewProvider:(id<ABI43_0_0EXSplashScreenViewProvider>)splashScreenViewProvider
            successCallback:(void (^)(void))successCallback
            failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if ([self.splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"'SplashScreen.show' has already been called for given view controller.");
  }
  
  
  UIView *rootView = viewController.view;
  UIView *splashScreenView = [splashScreenViewProvider createSplashScreenView];
  ABI43_0_0EXSplashScreenViewController *splashScreenController = [[ABI43_0_0EXSplashScreenViewController alloc] initWithRootView:rootView
                                                                                               splashScreenView:splashScreenView];
  
  [self showSplashScreenFor:viewController
     splashScreenController:splashScreenController
            successCallback:successCallback
            failureCallback:failureCallback];
}

- (void)showSplashScreenFor:(UIViewController *)viewController
     splashScreenController:(ABI43_0_0EXSplashScreenViewController *)splashScreenController
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
    ABI43_0_0EXLogWarn(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
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
    ABI43_0_0EXLogWarn(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
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
  if (!_isObservingRootViewController) {
    [UIApplication.sharedApplication.keyWindow addObserver:self forKeyPath:kRootViewController options:NSKeyValueObservingOptionNew context:nil];
    _isObservingRootViewController = YES;
  }
}

- (void)removeRootViewControllerListener
{
  NSAssert([NSThread isMainThread], @"Method must be called on main thread");
  if (_isObservingRootViewController) {
    [UIApplication.sharedApplication.keyWindow removeObserver:self forKeyPath:kRootViewController context:nil];
    _isObservingRootViewController = NO;
  }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context
{
  if (object == UIApplication.sharedApplication.keyWindow && [keyPath isEqualToString:kRootViewController]) {
    UIViewController *newRootViewController = change[@"new"];
    if (newRootViewController != nil) {
      [self showSplashScreenFor:newRootViewController];
    }
  }
}

@end
