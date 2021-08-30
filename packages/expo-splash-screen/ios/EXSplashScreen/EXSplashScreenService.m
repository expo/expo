// Copyright © 2018 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenService.h>
#import <EXSplashScreen/EXSplashScreenViewNativeProvider.h>
#import <ExpoModulesCore/EXDefines.h>

NSString * const kRootViewController = @"rootViewController";

@interface EXSplashScreenService ()

@property (nonatomic, strong) NSMapTable<UIViewController *, EXSplashScreenViewController *> *splashScreenControllers;
@property (nonatomic, assign) BOOL isObservingRootViewController;

@end

@implementation EXSplashScreenService

EX_REGISTER_SINGLETON_MODULE(SplashScreen);

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
  id<EXSplashScreenViewProvider> splashScreenViewProvider = [EXSplashScreenViewNativeProvider new];
  return [self showSplashScreenFor:viewController
          splashScreenViewProvider:splashScreenViewProvider
                   successCallback:^{}
                   failureCallback:^(NSString *message){ EXLogWarn(@"%@", message); }];
}


- (void)showSplashScreenFor:(UIViewController *)viewController
   splashScreenViewProvider:(id<EXSplashScreenViewProvider>)splashScreenViewProvider
            successCallback:(void (^)(void))successCallback
            failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if ([self.splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"'SplashScreen.show' has already been called for given view controller.");
  }
  
  
  UIView *rootView = viewController.view;
  UIView *splashScreenView = [splashScreenViewProvider createSplashScreenView];
  EXSplashScreenViewController *splashScreenController = [[EXSplashScreenViewController alloc] initWithRootView:rootView
                                                                                               splashScreenView:splashScreenView];
  
  [self showSplashScreenFor:viewController
     splashScreenController:splashScreenController
            successCallback:successCallback
            failureCallback:failureCallback];
}

- (void)showSplashScreenFor:(UIViewController *)viewController
     splashScreenController:(EXSplashScreenViewController *)splashScreenController
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

  EXSplashScreenViewController *splashScreenViewController = [self.splashScreenControllers objectForKey:viewController];
  EX_WEAKIFY(self);
  return [splashScreenViewController
      hideWithCallback:^(BOOL hasEffect) {
        EX_ENSURE_STRONGIFY(self);
        [self.splashScreenControllers removeObjectForKey:viewController];
        successCallback(hasEffect);
      }
      failureCallback:^(NSString *message) {
        EX_ENSURE_STRONGIFY(self);
        [self.splashScreenControllers removeObjectForKey:viewController];
        failureCallback(message);
      }];
}

- (void)onAppContentDidAppear:(UIViewController *)viewController
{
  if (![self.splashScreenControllers objectForKey:viewController]) {
    EXLogWarn(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
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
    EXLogWarn(@"No native splash screen registered for given view controller. Call 'SplashScreen.show' for given view controller first.");
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
