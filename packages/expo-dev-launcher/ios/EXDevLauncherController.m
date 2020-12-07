#import "EXDevLauncherController+Private.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTDevMenu.h>
#import <React/RCTAsyncLocalStorage.h>
#import <React/RCTDevSettings.h>

#import "EXDevLauncherBundle.h"
#import "EXDevLauncherBundleSource.h"
#import "EXDevLauncherRCTBridge.h"
#import "EXDevLauncherManifestParser.h"
#import "EXDevLauncherLoadingView.h"

#import <expo_dev_launcher-Swift.h>

// Uncomment the below and set it to a React Native bundler URL to develop the launcher JS
//#define DEV_LAUNCHER_URL "http://10.0.0.176:8090/index.bundle?platform=ios&dev=true&minify=false"

NSString *fakeLauncherBundleUrl = @"embedded://EXDevLauncher/dummy";

@implementation EXDevLauncherController

+ (instancetype)sharedInstance
{
  static EXDevLauncherController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [[EXDevLauncherController alloc] init];
    }
  });
  return theController;
}

- (instancetype)init {
  if (self = [super init]) {
    self.recentlyOpenedAppsRegistry = [EXDevLauncherRecentlyOpenedAppsRegistry new];
    self.pendingDeepLinkRegistry = [EXDevLauncherPendingDeepLinkRegistry new];
  }
  return self;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  return @[
    [[RCTDevMenu alloc] init],
    [[RCTAsyncLocalStorage alloc] init],
    [[EXDevLauncherLoadingView alloc] init]
  ];
}

#ifdef DEV_LAUNCHER_URL

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  // LAN url for developing launcher JS
  return [NSURL URLWithString:@(DEV_LAUNCHER_URL)];
}

#else

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [NSURL URLWithString:fakeLauncherBundleUrl];
}

- (void)loadSourceForBridge:(RCTBridge *)bridge withBlock:(RCTSourceLoadBlock)loadCallback
{
  NSData *data = [NSData dataWithBytesNoCopy:EXDevLauncherBundle
                                      length:EXDevLauncherBundleLength
                                freeWhenDone:NO];
  loadCallback(nil, EXDevLauncherBundleSourceCreate([NSURL URLWithString:fakeLauncherBundleUrl],
                                                          data,
                                                          EXDevLauncherBundleLength));
}

#endif

- (NSDictionary *)recentlyOpenedApps
{
  return [_recentlyOpenedAppsRegistry recentlyOpenedApps];
}

- (NSDictionary<UIApplicationLaunchOptionsKey, NSObject*> *)getLaunchOptions;
{
  NSURL *deepLink = [self.pendingDeepLinkRegistry consumePendingDeepLink];
  if (!deepLink) {
    return nil;
  }
  
  return @{
    UIApplicationLaunchOptionsURLKey: deepLink
  };
}

- (void)startWithWindow:(UIWindow *)window delegate:(id<EXDevLauncherControllerDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  _delegate = delegate;
  _launchOptions = launchOptions;
  _window = window;

  [self navigateToLauncher];
}

- (void)navigateToLauncher {
  [_appBridge invalidate];

  _launcherBridge = [[EXDevLauncherRCTBridge alloc] initWithDelegate:self launchOptions:_launchOptions];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:_launcherBridge
                                                   moduleName:@"main"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  _window.rootViewController = rootViewController;

  [_window makeKeyAndVisible];
}

- (BOOL)onDeepLink:(NSURL *)url options:(NSDictionary *)options {
  if (![url.host isEqual:@"expo-development-client"]) {
    return [self _handleExternalDeepLink:url options:options];
  }
  
  NSURLComponents *urlComponets = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO];
  for (NSURLQueryItem *parameter in urlComponets.queryItems) {
    if ([parameter.name isEqual:@"url"]) {
      [self loadApp:[parameter.value stringByRemovingPercentEncoding] onSuccess:nil onError:^(NSError *error) {
        NSLog(error.description);
      }];
      return true;
    }
  }
  
  [self navigateToLauncher];
  return true;
}

- (BOOL)_handleExternalDeepLink:(NSURL *)url options:(NSDictionary *)options
{
  if ([self _isAppRunning]) {
    return false;
  }
  
  self.pendingDeepLinkRegistry.pendingDeepLink = url;
  return true;
}

- (void)loadApp:(NSString *)expoUrl onSuccess:(void (^)())onSuccess onError:(void (^)(NSError *error))onError
{
  __block NSString *url = [[expoUrl stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]] stringByReplacingOccurrencesOfString:@"exp" withString:@"http"];
  EXDevLauncherManifestParser *manifestParser = [[EXDevLauncherManifestParser alloc] initWithURL:url session:[NSURLSession sharedSession]];
  [manifestParser tryToParseManifest:^(EXDevLauncherManifest * _Nullable manifest) {
    NSURL *bundleUrl = [NSURL URLWithString:manifest.bundleUrl];
    
    [_recentlyOpenedAppsRegistry appWasOpened:url name:manifest.name];
    [self _initApp:bundleUrl manifest:manifest];
    if (onSuccess) {
      onSuccess();
    }
  } onInvalidManifestURL:^{
    [_recentlyOpenedAppsRegistry appWasOpened:url name:nil];
    NSURL *parsedUrl = [NSURL URLWithString:url];
    if ([parsedUrl.path isEqual:@"/"] || [parsedUrl.path isEqual:@""]) {
      [self _initApp:[NSURL URLWithString:@"index.bundle?platform=ios&dev=true&minify=false" relativeToURL:[NSURL URLWithString:url]] manifest:nil];
    } else {
      [self _initApp:[NSURL URLWithString:url] manifest:nil];
    }
    
    if (onSuccess) {
      onSuccess();
    }
  } onError:onError];
}

- (void)_initApp:(NSURL *)bundleUrl manifest:(EXDevLauncherManifest * _Nullable)manifest
{
  __block UIInterfaceOrientation orientation = manifest.orientation;
  __block UIColor *backgroundColor = manifest.backgroundColor;
  
  dispatch_async(dispatch_get_main_queue(), ^{
    self.sourceUrl = bundleUrl;
    [self.delegate devLauncherController:self didStartWithSuccess:YES];
    [[UIDevice currentDevice] setValue:@(orientation) forKey:@"orientation"];
    [UIViewController attemptRotationToDeviceOrientation];
    
    if (backgroundColor) {
      _window.rootViewController.view.backgroundColor = backgroundColor;
      _window.backgroundColor = backgroundColor;
    }
  });
}

- (BOOL)_isAppRunning
{
  return [_appBridge isValid];
}

@end

