#import "EXDevelopmentClientController+Private.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTDevMenu.h>
#import <React/RCTAsyncLocalStorage.h>
#import <React/RCTDevSettings.h>

#import "EXDevelopmentClientBundle.h"
#import "EXDevelopmentClientBundleSource.h"
#import "EXDevelopmentClientRCTBridge.m"
#import "EXDevelopmentClientManifestParser.h"
#import <expo_development_client-Swift.h>

#import <UIKit/UIKit.h>

// Uncomment the below and set it to a React Native bundler URL to develop the launcher JS
//#define DEV_LAUNCHER_URL "http://10.0.0.176:8090/index.bundle?platform=ios&dev=true&minify=false"

NSString *fakeLauncherBundleUrl = @"embedded://exdevelopmentclient/dummy";


@implementation EXDevelopmentClientController

+ (instancetype)sharedInstance
{
  static EXDevelopmentClientController *theController;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theController) {
      theController = [[EXDevelopmentClientController alloc] init];
    }
  });
  return theController;
}

- (instancetype)init {
  if (self = [super init]) {
    self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
  }
  return self;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  return [extraModules arrayByAddingObjectsFromArray:@[
    [[RCTDevMenu alloc] init],
    [[RCTAsyncLocalStorage alloc] init],
  ]];
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
  NSData *data = [NSData dataWithBytesNoCopy:EXDevelopmentClientBundle
                                      length:EXDevelopmentClientBundleLength
                                freeWhenDone:NO];
  loadCallback(nil, EXDevelopmentClientBundleSourceCreate([NSURL URLWithString:fakeLauncherBundleUrl],
                                                          data,
                                                          EXDevelopmentClientBundleLength));
}

#endif

- (void)startWithWindow:(UIWindow *)window delegate:(id<EXDevelopmentClientControllerDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  _delegate = delegate;
  _launchOptions = launchOptions;
  _window = window;

  [self navigateToLauncher];
}

- (void)navigateToLauncher {
  [_appBridge invalidate];

  _launcherBridge = [[EXDevelopmentClientRCTBridge alloc] initWithDelegate:self launchOptions:_launchOptions];

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
    return false;
  }
  
  [self loadApp:[url.path substringFromIndex:1] onSuccess:nil onError:^(NSError *error) {
    NSLog(error.description);
  }];
  
  return true;
}

- (void)loadApp:(NSString *)expoUrl onSuccess:(void (^)())onSuccess onError:(void (^)(NSError *error))onError
{
  __block NSString *url = [expoUrl stringByReplacingOccurrencesOfString:@"exp" withString:@"http"];
  EXDevelopmentClientManifestParser *manifestParser = [[EXDevelopmentClientManifestParser alloc] initWithURL:url session:[NSURLSession sharedSession]];
  [manifestParser tryToParseManifest:^(EXDevelopmentClientManifest * _Nonnull manifest) {
    NSURL *bundleUrl = [NSURL URLWithString:manifest.bundleUrl];
    [self _initApp:bundleUrl manifest:manifest];
    if (onSuccess) {
      onSuccess();
    }
  } onInalidURL:^{
    if (![[NSURL URLWithString:url].path isEqual:@"/"]) {
      [self _initApp:[NSURL URLWithString:url] manifest:nil];
    } else {
      [self _initApp:[NSURL URLWithString:url relativeToURL:@"index.bundle?platform=ios&dev=true&minify=false"] manifest:nil];
    }
    
    if (onSuccess) {
      onSuccess();
    }
  } onError:onError];
}

- (void)_initApp:(NSURL *)bundleUrl manifest:(EXDevelopmentClientManifest * _Nullable)manifest
{
  __block UIInterfaceOrientation orientation = manifest.orientation;
  __block UIColor *backgroundColor = manifest.backgroundColor;
  
  dispatch_async(dispatch_get_main_queue(), ^{
    self.sourceUrl = bundleUrl;
    [self.delegate developmentClientController:self didStartWithSuccess:YES];
    [[UIDevice currentDevice] setValue:@(orientation) forKey:@"orientation"];
    [UIViewController attemptRotationToDeviceOrientation];
    
    if (backgroundColor) {
      _window.rootViewController.view.backgroundColor = backgroundColor;
      _window.backgroundColor = backgroundColor;
    }
  });
}


@end
