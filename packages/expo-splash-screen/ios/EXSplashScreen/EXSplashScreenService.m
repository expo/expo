// Copyright © 2018 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenService.h>
#import <EXSplashScreen/EXSplashScreenViewNativeProvider.h>
#import <UMCore/UMDefines.h>

@interface EXSplashScreenService ()

@property (nonatomic, strong) NSMapTable<UIViewController *, EXSplashScreenController *> *splashScreenControllers;

@end

@implementation EXSplashScreenService

UM_REGISTER_SINGLETON_MODULE(SplashScreen);

- (instancetype)init
{
  if (self = [super init]) {
    _splashScreenControllers = [NSMapTable weakToStrongObjectsMapTable];
  }
  return self;
}

- (void)show:(UIViewController *)viewController resizeMode:(EXSplashScreenImageResizeMode)resizeMode
{
  id<EXSplashScreenViewProvider> splashScreenViewProvider = [EXSplashScreenViewNativeProvider new];
  return [self show:viewController resizeMode:resizeMode
                     splashScreenViewProvider:splashScreenViewProvider
                              successCallback:^{}
                              failureCallback:^(NSString *message){ UMLogWarn(@"%@", message); }];
}

- (void)show:(UIViewController *)viewController resizeMode:(EXSplashScreenImageResizeMode)resizeMode
                                  splashScreenViewProvider:(id<EXSplashScreenViewProvider>)splashScreenViewProvider
                                           successCallback:(void (^)(void))successCallback
                                           failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if ([_splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"'SplashScreen.show' has already been called for given ViewController.");
  }
  
  EXSplashScreenController *splashScreenController = [[EXSplashScreenController alloc] initWithViewController:viewController
                                                                                                   resizeMode:resizeMode
                                                                                     splashScreenViewProvider:splashScreenViewProvider];
  [_splashScreenControllers setObject:splashScreenController forKey:viewController];
  [[_splashScreenControllers objectForKey:viewController] showWithCallback:successCallback
                                                           failureCallback:failureCallback];
}

- (void)preventAutoHide:(UIViewController *)viewController
        successCallback:(void (^)(void))successCallback
        failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if (![_splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"No Native Splash Screen registered for given ViewController. First call 'SplashScreen.show' for given ViewController.");
  }
  
  return [[_splashScreenControllers objectForKey:viewController] preventAutoHideWithCallback:successCallback
                                                                             failureCallback:failureCallback];
}

- (void)hide:(UIViewController *)viewController successCallback:(void (^)(void))successCallback
                                                failureCallback:(void (^)(NSString * _Nonnull))failureCallback
{
  if (![_splashScreenControllers objectForKey:viewController]) {
    return failureCallback(@"No Native Splash Screen registered for given ViewController. First call 'SplashScreen.show' for given ViewController.");
  }
  return [[_splashScreenControllers objectForKey:viewController] hideWithCallback:successCallback
                                                                  failureCallback:failureCallback];
}

- (void)onAppContentDidAppear:(UIViewController *)viewController
{
  if (![_splashScreenControllers objectForKey:viewController]) {
    UMLogWarn(@"No Native Splash Screen registered for given ViewController. First call 'SplashScreen.show' for given ViewController.");
  }
  [[_splashScreenControllers objectForKey:viewController] onAppContentDidAppear];
}

- (void)onAppContentWillReload:(UIViewController *)viewController
{
  if (![_splashScreenControllers objectForKey:viewController]) {
    UMLogWarn(@"No Native Splash Screen registered for given ViewController. First call 'SplashScreen.show' for given ViewController.");
  }
  [[_splashScreenControllers objectForKey:viewController] onAppContentWillReload];
}

# pragma mark - UIApplicationDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Read SplashScreen.plist
  EXSplashScreenImageResizeMode resizeMode = EXSplashScreenImageResizeMode_CONTAIN;
  NSString *plistPath = [[NSBundle mainBundle] pathForResource:@"SplashScreen" ofType:@"plist"];
  if (plistPath) {
    NSDictionary *splashScreenSettings = [NSDictionary dictionaryWithContentsOfFile:plistPath];
    NSString *resizeModeString = splashScreenSettings[@"ResizeMode"];
    resizeMode = [EXSplashScreenService resizeModeFromString:resizeModeString];
  } else {
    UMLogWarn(@"Cannot locate SplashScreen.plist!. Please install 'expo-splash-screen' properly.");
  }
  
  UIViewController *rootViewController = [[UIApplication.sharedApplication keyWindow] rootViewController];
  
  [self show:rootViewController resizeMode:resizeMode];
  return YES;
}

# pragma mark - static helpers

+ (EXSplashScreenImageResizeMode)resizeModeFromString:(NSString *)resizeMode
{
  resizeMode = [resizeMode lowercaseString];
  if (resizeMode == nil || [resizeMode isEqualToString:@"contain"]) {
    return EXSplashScreenImageResizeMode_CONTAIN;
  } else if ([resizeMode isEqualToString:@"cover"]) {
    return EXSplashScreenImageResizeMode_COVER;
  }
  
  return EXSplashScreenImageResizeMode_CONTAIN;
}

@end
