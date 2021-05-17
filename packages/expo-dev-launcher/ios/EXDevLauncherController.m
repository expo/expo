#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTDevMenu.h>
#import <React/RCTAsyncLocalStorage.h>
#import <React/RCTDevSettings.h>
#import <React/RCTRootContentView.h>
#import <React/RCTAppearance.h>
#import <React/RCTConstants.h>

#import "EXDevLauncherController.h"
#import "EXDevLauncherRCTBridge.h"
#import "EXDevLauncherManifestParser.h"
#import "EXDevLauncherLoadingView.h"

#import <EXDevLauncher-Swift.h>

@import EXDevMenuInterface;

#ifdef EX_DEV_LAUNCHER_VERSION
#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)

#define VERSION @ STRINGIZE2(EX_DEV_LAUNCHER_VERSION)
#endif

// Uncomment the below and set it to a React Native bundler URL to develop the launcher JS
//#define DEV_LAUNCHER_URL "http://10.0.0.176:8090/index.bundle?platform=ios&dev=true&minify=false"

NSString *fakeLauncherBundleUrl = @"embedded://EXDevLauncher/dummy";

@interface EXDevLauncherController ()

@property (nonatomic, weak) UIWindow *window;
@property (nonatomic, weak) id<EXDevLauncherControllerDelegate> delegate;
@property (nonatomic, strong) NSDictionary *launchOptions;
@property (nonatomic, strong) NSURL *sourceUrl;
@property (nonatomic, strong) EXDevLauncherRecentlyOpenedAppsRegistry *recentlyOpenedAppsRegistry;
@property (nonatomic, strong) EXDevLauncherManifest *manifest;
@property (nonatomic, strong) EXDevLauncherErrorManager *errorManager;

@end


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
    self.errorManager = [[EXDevLauncherErrorManager alloc] initWithController:self];
  }
  return self;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  return @[
    (id<RCTBridgeModule>)[[RCTDevMenu alloc] init],
    [[RCTAsyncLocalStorage alloc] init],
    [[EXDevLauncherLoadingView alloc] init]
  ];
}

+ (NSString * _Nullable)version {
#ifdef VERSION
  return VERSION;
#endif
  return nil;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#ifdef DEV_LAUNCHER_URL
  // LAN url for developing launcher JS
  return [NSURL URLWithString:@(DEV_LAUNCHER_URL)];
#else
  NSURL *bundleURL = [[NSBundle mainBundle] URLForResource:@"EXDevLauncher" withExtension:@"bundle"];
  return [[NSBundle bundleWithURL:bundleURL] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

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

- (EXDevLauncherManifest *)appManifest
{
  return self.manifest;
}

- (UIWindow *)currentWindow
{
  return _window;
}

- (EXDevLauncherErrorManager *)errorManage
{
  return _errorManager;
}

- (void)startWithWindow:(UIWindow *)window delegate:(id<EXDevLauncherControllerDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  _delegate = delegate;
  _launchOptions = launchOptions;
  _window = window;

  if (!launchOptions[UIApplicationLaunchOptionsURLKey]) {
    [self navigateToLauncher];
  }
}

- (void)navigateToLauncher
{
  [_appBridge invalidate];
  self.manifest = nil;

  if (@available(iOS 12, *)) {
    [self _applyUserInterfaceStyle:UIUserInterfaceStyleUnspecified];
  }

  _launcherBridge = [[EXDevLauncherRCTBridge alloc] initWithDelegate:self launchOptions:_launchOptions];

  // Set up the `expo-dev-menu` delegate if menu is available
  [self _maybeInitDevMenuDelegate:_launcherBridge];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:_launcherBridge
                                                   moduleName:@"main"
                                            initialProperties:@{
                                              @"isSimulator":
                                                              #if TARGET_IPHONE_SIMULATOR
                                                              @YES
                                                              #else
                                                              @NO
                                                              #endif
                                            }];

  [self _ensureUserInterfaceStyleIsInSyncWithTraitEnv:rootView];
  
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(onAppContentDidAppear)
                                               name:RCTContentDidAppearNotification
                                             object:rootView];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  _window.rootViewController = rootViewController;

  [_window makeKeyAndVisible];
}

- (BOOL)onDeepLink:(NSURL *)url options:(NSDictionary *)options
{
  if (![EXDevLauncherURLHelper isDevLauncherURL:url]) {
    return [self _handleExternalDeepLink:url options:options];
  }
  
  NSURL *appUrl = [EXDevLauncherURLHelper getAppURLFromDevLauncherURL:url];
  if (appUrl) {
    [self loadApp:appUrl onSuccess:nil onError:^(NSError *error) {
      NSLog(@"%@", error.description);
      dispatch_async(dispatch_get_main_queue(), ^{
        [self navigateToLauncher];
      });
    }];
    return true;
  }
  
  [self navigateToLauncher];
  return true;
}

- (BOOL)_handleExternalDeepLink:(NSURL *)url options:(NSDictionary *)options
{
  if ([self isAppRunning]) {
    return false;
  }
  
  self.pendingDeepLinkRegistry.pendingDeepLink = url;
  return true;
}

- (void)loadApp:(NSURL *)expoUrl
      onSuccess:(void (^ _Nullable)(void))onSuccess
        onError:(void (^ _Nullable)(NSError *error))onError
{
  NSURL *url = [EXDevLauncherURLHelper changeURLScheme:expoUrl to:@"http"];
    
  EXDevLauncherManifestParser *manifestParser = [[EXDevLauncherManifestParser alloc] initWithURL:url
                                                                                         session:[NSURLSession sharedSession]];
  __weak __typeof(self) weakSelf = self;
  [manifestParser tryToParseManifest:^(EXDevLauncherManifest * _Nullable manifest) {
    if (!weakSelf) {
      return;
    }
    __typeof(self) self = weakSelf;
    
    NSURL *bundleUrl = [NSURL URLWithString:manifest.bundleUrl];
    
    [self.recentlyOpenedAppsRegistry appWasOpened:[expoUrl absoluteString] name:manifest.name];
    [self _initApp:bundleUrl manifest:manifest];
    if (onSuccess) {
      onSuccess();
    }
  } onInvalidManifestURL:^{
    [self.recentlyOpenedAppsRegistry appWasOpened:[expoUrl absoluteString] name:nil];
    if ([url.path isEqual:@"/"] || [url.path isEqual:@""]) {
      [self _initApp:[NSURL URLWithString:@"index.bundle?platform=ios&dev=true&minify=false" relativeToURL:url] manifest:nil];
    } else {
      [self _initApp:url manifest:nil];
    }
    
    if (onSuccess) {
      onSuccess();
    }
  } onError:onError];
}

- (void)_initApp:(NSURL *)bundleUrl manifest:(EXDevLauncherManifest * _Nullable)manifest
{
  self.manifest = manifest;
  __block UIInterfaceOrientation orientation = manifest.orientation;
  __block UIColor *backgroundColor = manifest.backgroundColor;
  
  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!weakSelf) {
      return;
    }
    __typeof(self) self = weakSelf;
    
    self.sourceUrl = bundleUrl;
    
    if (@available(iOS 12, *)) {
      [self _applyUserInterfaceStyle:manifest.userInterfaceStyle];
      
      // Fix for the community react-native-appearance.
      // RNC appearance checks the global trait collection and doesn't have another way to override the user interface.
      // So we swap `currentTraitCollection` with one from the root view controller.
      // Note that the root view controller will have the correct value of `userInterfaceStyle`.
      if (@available(iOS 13.0, *)) {
        if (manifest.userInterfaceStyle != UIUserInterfaceStyleUnspecified) {
          UITraitCollection.currentTraitCollection = [self.window.rootViewController.traitCollection copy];
        }
      }
    }
    
    [self.delegate devLauncherController:self didStartWithSuccess:YES];
    [self _maybeInitDevMenuDelegate:self.appBridge];

    [self _ensureUserInterfaceStyleIsInSyncWithTraitEnv:self.window.rootViewController];

    [[UIDevice currentDevice] setValue:@(orientation) forKey:@"orientation"];
    [UIViewController attemptRotationToDeviceOrientation];
    
    if (backgroundColor) {
      self.window.rootViewController.view.backgroundColor = backgroundColor;
      self.window.backgroundColor = backgroundColor;
    }
  });
}

- (BOOL)isAppRunning
{
  return [_appBridge isValid];
}

/**
 * Temporary `expo-splash-screen` fix.
 *
 * The dev-launcher's bridge doesn't contain unimodules. So the module shows a splash screen but never hides.
 * For now, we just remove the splash screen view when the launcher is loaded.
 */
- (void)onAppContentDidAppear
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  dispatch_async(dispatch_get_main_queue(), ^{
    NSArray<UIView *> *views = [[[self->_window rootViewController] view] subviews];
    for (UIView *view in views) {
      if (![view isKindOfClass:[RCTRootContentView class]]) {
        [view removeFromSuperview];
      }
    }
  });
}

/**
 * We need that function to sync the dev-menu user interface with the main application.
 */
- (void)_ensureUserInterfaceStyleIsInSyncWithTraitEnv:(id<UITraitEnvironment>)env
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTUserInterfaceStyleDidChangeNotification
                                                      object:env
                                                    userInfo:@{
                                                      RCTUserInterfaceStyleDidChangeNotificationTraitCollectionKey : env.traitCollection
                                                    }];
}

- (void)_applyUserInterfaceStyle:(UIUserInterfaceStyle)userInterfaceStyle API_AVAILABLE(ios(12.0))
{
  NSString *colorSchema = nil;
  if (userInterfaceStyle == UIUserInterfaceStyleDark) {
    colorSchema = @"dark";
  } else if (userInterfaceStyle == UIUserInterfaceStyleLight) {
    colorSchema = @"light";
  }
  
  // change RN appearance
  RCTOverrideAppearancePreference(colorSchema);
}

- (void)_maybeInitDevMenuDelegate:(RCTBridge *)bridge
{
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    id<DevMenuManagerProviderProtocol> devMenuManagerProvider = [bridge modulesConformingToProtocol:@protocol(DevMenuManagerProviderProtocol)].firstObject;
    
    if (devMenuManagerProvider) {
      id<DevMenuManagerProtocol> devMenuManager = [devMenuManagerProvider getDevMenuManager];
      devMenuManager.delegate = [[EXDevLauncherMenuDelegate alloc] initWithLauncherController:self];
    }
  });
}

@end
