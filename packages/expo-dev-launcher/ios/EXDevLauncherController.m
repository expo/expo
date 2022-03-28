#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTDevLoadingViewSetEnabled.h>
#import <React/RCTDevMenu.h>
#import <React/RCTAsyncLocalStorage.h>
#import <React/RCTDevSettings.h>
#import <React/RCTRootContentView.h>
#import <React/RCTAppearance.h>
#import <React/RCTConstants.h>
#import <React/RCTKeyCommands.h>

#import "EXDevLauncherController.h"
#import "EXDevLauncherRCTBridge.h"
#import "EXDevLauncherManifestParser.h"
#import "EXDevLauncherLoadingView.h"
#import "EXDevLauncherInternal.h"
#import "EXDevLauncherUpdatesHelper.h"
#import "EXDevLauncherAuth.h"
#import "RCTPackagerConnection+EXDevLauncherPackagerConnectionInterceptor.h"

#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)
// For cocoapods framework, the generated swift header will be inside EXDevLauncher module
#import <EXDevLauncher/EXDevLauncher-Swift.h>
#else
#import <EXDevLauncher-Swift.h>
#endif

#import <EXManifests/EXManifestsManifestFactory.h>

@import EXDevMenu;

#ifdef EX_DEV_LAUNCHER_VERSION
#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)

#define VERSION @ STRINGIZE2(EX_DEV_LAUNCHER_VERSION)
#endif

// Uncomment the below and set it to a React Native bundler URL to develop the launcher JS
// #define DEV_LAUNCHER_URL "http://localhost:8090//index.bundle?platform=ios&dev=true&minify=false"

@interface EXDevLauncherController ()

@property (nonatomic, weak) UIWindow *window;
@property (nonatomic, weak) id<EXDevLauncherControllerDelegate> delegate;
@property (nonatomic, strong) NSDictionary *launchOptions;
@property (nonatomic, strong) NSURL *sourceUrl;
@property (nonatomic, assign) BOOL shouldPreferUpdatesInterfaceSourceUrl;
@property (nonatomic, strong) EXDevLauncherRecentlyOpenedAppsRegistry *recentlyOpenedAppsRegistry;
@property (nonatomic, strong) EXManifestsManifest *manifest;
@property (nonatomic, strong) NSURL *manifestURL;
@property (nonatomic, strong) EXDevLauncherErrorManager *errorManager;
@property (nonatomic, strong) EXDevLauncherInstallationIDHelper *installationIDHelper;
@property (nonatomic, assign) BOOL isStarted;

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
    self.installationIDHelper = [EXDevLauncherInstallationIDHelper new];
    self.shouldPreferUpdatesInterfaceSourceUrl = NO;
  }
  return self;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  
  NSMutableArray *modules = [[DevMenuVendoredModulesUtils vendoredModules] mutableCopy];
  
  [modules addObject:[RCTDevMenu new]];
  [modules addObject:[RCTAsyncLocalStorage new]];
  [modules addObject:[EXDevLauncherLoadingView new]];
  [modules addObject:[EXDevLauncherInternal new]];
  [modules addObject:[EXDevLauncherAuth new]];
  
  return modules;
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

- (EXManifestsManifest *)appManifest
{
  return self.manifest;
}

- (NSURL * _Nullable)appManifestURL
{
  return self.manifestURL;
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
  _isStarted = YES;
  _delegate = delegate;
  _launchOptions = launchOptions;
  _window = window;
  EXDevLauncherUncaughtExceptionHandler.isInstalled = true;

  if (!launchOptions[UIApplicationLaunchOptionsURLKey]) {
    [self navigateToLauncher];
  } else {
    // For deeplink launch, we need the keyWindow for expo-splash-screen to setup correctly.
    [_window makeKeyWindow];
  }
}

- (void)autoSetupPrepare:(id<EXDevLauncherControllerDelegate>)delegate launchOptions:(NSDictionary * _Nullable)launchOptions
{
  _delegate = delegate;
  _launchOptions = launchOptions;
  EXDevLauncherBundleURLProviderInterceptor.isInstalled = true;
}

- (void)autoSetupStart:(UIWindow *)window
{
  if (_delegate != nil) {
    [self startWithWindow:window delegate:_delegate launchOptions:_launchOptions];
  } else {
    @throw [NSException exceptionWithName:NSInternalInconsistencyException reason:@"[EXDevLauncherController autoSetupStart:] was called before autoSetupPrepare:. Make sure you've set up expo-modules correctly in AppDelegate and are using ReactDelegate to create a bridge before calling [super application:didFinishLaunchingWithOptions:]." userInfo:nil];
  }
}

- (void)navigateToLauncher
{
  [_appBridge invalidate];
  [self invalidateDevMenuApp];
  
  self.manifest = nil;
  self.manifestURL = nil;

  if (@available(iOS 12, *)) {
    [self _applyUserInterfaceStyle:UIUserInterfaceStyleUnspecified];
  }
  
  [self _removeInitModuleObserver];

  _launcherBridge = [[EXDevLauncherRCTBridge alloc] initWithDelegate:self launchOptions:_launchOptions];

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

#if RCT_DEV && defined(DEV_LAUNCHER_URL)
    // Connect to the websocket
    [[RCTPackagerConnection sharedPackagerConnection] setSocketConnectionURL:[NSURL URLWithString:@DEV_LAUNCHER_URL]];
#endif
  
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
      __weak typeof(self) weakSelf = self;
      dispatch_async(dispatch_get_main_queue(), ^{
        typeof(self) self = weakSelf;
        if (!self) {
          return;
        }
        
        EXDevLauncherAppError *appError = [[EXDevLauncherAppError alloc] initWithMessage:error.description stack:nil];
        [self.errorManager showError:appError];
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

- (NSURL *)sourceUrl
{
  if (_shouldPreferUpdatesInterfaceSourceUrl && _updatesInterface && _updatesInterface.launchAssetURL) {
    return _updatesInterface.launchAssetURL;
  }
  return _sourceUrl;
}

- (void)loadApp:(NSURL *)expoUrl onSuccess:(void (^ _Nullable)(void))onSuccess onError:(void (^ _Nullable)(NSError *error))onError
{
  NSString *installationID = [_installationIDHelper getOrCreateInstallationID];
  expoUrl = [EXDevLauncherURLHelper replaceEXPScheme:expoUrl to:@"http"];

  NSDictionary *updatesConfiguration = [EXDevLauncherUpdatesHelper createUpdatesConfigurationWithURL:expoUrl
                                                                                      installationID:installationID];

  void (^launchReactNativeApp)(void) = ^{
    self->_shouldPreferUpdatesInterfaceSourceUrl = NO;
    RCTDevLoadingViewSetEnabled(NO);
    [self.recentlyOpenedAppsRegistry appWasOpened:expoUrl.absoluteString name:nil];
    if ([expoUrl.path isEqual:@"/"] || [expoUrl.path isEqual:@""]) {
      [self _initAppWithUrl:expoUrl bundleUrl:[NSURL URLWithString:@"index.bundle?platform=ios&dev=true&minify=false" relativeToURL:expoUrl] manifest:nil];
    } else {
      [self _initAppWithUrl:expoUrl bundleUrl:expoUrl manifest:nil];
    }
    if (onSuccess) {
      onSuccess();
    }
  };

  void (^launchExpoApp)(NSURL *, EXManifestsManifest *) = ^(NSURL *bundleURL, EXManifestsManifest *manifest) {
    self->_shouldPreferUpdatesInterfaceSourceUrl = !manifest.isUsingDeveloperTool;
    RCTDevLoadingViewSetEnabled(manifest.isUsingDeveloperTool);
    [self.recentlyOpenedAppsRegistry appWasOpened:expoUrl.absoluteString name:manifest.name];
    [self _initAppWithUrl:expoUrl bundleUrl:bundleURL manifest:manifest];
    if (onSuccess) {
      onSuccess();
    }
  };

  if (_updatesInterface) {
    [_updatesInterface reset];
  }

  EXDevLauncherManifestParser *manifestParser = [[EXDevLauncherManifestParser alloc] initWithURL:expoUrl installationID:installationID session:[NSURLSession sharedSession]];
  
  void (^onIsManifestURL)(BOOL) = ^(BOOL isManifestURL) {
    if (!isManifestURL) {
      // assume this is a direct URL to a bundle hosted by metro
      launchReactNativeApp();
      return;
    }

    if (!self->_updatesInterface) {
      [manifestParser tryToParseManifest:^(EXManifestsManifest *manifest) {
        if (!manifest.isUsingDeveloperTool) {
          onError([NSError errorWithDomain:@"DevelopmentClient" code:1 userInfo:@{NSLocalizedDescriptionKey: @"expo-updates is not properly installed or integrated. In order to load published projects with this development client, follow all installation and setup instructions for both the expo-dev-client and expo-updates packages."}]);
          return;
        }
        launchExpoApp([NSURL URLWithString:manifest.bundleUrl], manifest);
      } onError:onError];
      return;
    }

    [self->_updatesInterface fetchUpdateWithConfiguration:updatesConfiguration onManifest:^BOOL(NSDictionary *manifest) {
      EXManifestsManifest *devLauncherManifest = [EXManifestsManifestFactory manifestForManifestJSON:manifest];
      if (devLauncherManifest.isUsingDeveloperTool) {
        // launch right away rather than continuing to load through EXUpdates
        launchExpoApp([NSURL URLWithString:devLauncherManifest.bundleUrl], devLauncherManifest);
        return NO;
      }
      return YES;
    } progress:^(NSUInteger successfulAssetCount, NSUInteger failedAssetCount, NSUInteger totalAssetCount) {
      // do nothing for now
    } success:^(NSDictionary * _Nullable manifest) {
      if (manifest) {
        launchExpoApp(self->_updatesInterface.launchAssetURL, [EXManifestsManifestFactory manifestForManifestJSON:manifest]);
      }
    } error:^(NSError * _Nonnull error) {
      if (@available(iOS 14, *)) {
        // Try to retry if the network connection was rejected because of the luck of the lan network permission.
        static BOOL shouldRetry = true;
        NSString *host = expoUrl.host;

        if (shouldRetry && ([host hasPrefix:@"192.168."] || [host hasPrefix:@"172."] || [host hasPrefix:@"10."])) {
          shouldRetry = false;
          [manifestParser isManifestURLWithCompletion:onIsManifestURL onError:onError];
          return;
        }
      }
      
      onError(error);
    }];
  };
  
  [manifestParser isManifestURLWithCompletion:onIsManifestURL onError:onError];
}

- (void)_initAppWithUrl:(NSURL *)appUrl bundleUrl:(NSURL *)bundleUrl manifest:(EXManifestsManifest * _Nullable)manifest
{
  self.manifest = manifest;
  self.manifestURL = appUrl;
  __block UIInterfaceOrientation orientation = [EXDevLauncherManifestHelper exportManifestOrientation:manifest.orientation];
  __block UIColor *backgroundColor = [EXDevLauncherManifestHelper hexStringToColor:manifest.iosOrRootBackgroundColor];
  
  __weak __typeof(self) weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!weakSelf) {
      return;
    }
    __typeof(self) self = weakSelf;
    
    self.sourceUrl = bundleUrl;
    
#if RCT_DEV
    // Connect to the websocket
    [[RCTPackagerConnection sharedPackagerConnection] setSocketConnectionURL:bundleUrl];
#endif
    
    if (@available(iOS 12, *)) {
      UIUserInterfaceStyle userInterfaceStyle = [EXDevLauncherManifestHelper exportManifestUserInterfaceStyle:manifest.userInterfaceStyle];
      [self _applyUserInterfaceStyle:userInterfaceStyle];
      
      // Fix for the community react-native-appearance.
      // RNC appearance checks the global trait collection and doesn't have another way to override the user interface.
      // So we swap `currentTraitCollection` with one from the root view controller.
      // Note that the root view controller will have the correct value of `userInterfaceStyle`.
      if (@available(iOS 13.0, *)) {
        if (userInterfaceStyle != UIUserInterfaceStyleUnspecified) {
          UITraitCollection.currentTraitCollection = [self.window.rootViewController.traitCollection copy];
        }
      }
    }

    [self _addInitModuleObserver];
    
    [self.delegate devLauncherController:self didStartWithSuccess:YES];
    
    [self setDevMenuAppBridge];
    
    [self _ensureUserInterfaceStyleIsInSyncWithTraitEnv:self.window.rootViewController];

    [[UIDevice currentDevice] setValue:@(orientation) forKey:@"orientation"];
    [UIViewController attemptRotationToDeviceOrientation];
    
    if (backgroundColor) {
      self.window.rootViewController.view.backgroundColor = backgroundColor;
      self.window.backgroundColor = backgroundColor;
    }

    if (self.updatesInterface) {
      self.updatesInterface.bridge = self.appBridge;
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
  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTContentDidAppearNotification object:nil];

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

- (void)_addInitModuleObserver {
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didInitializeModule:) name:RCTDidInitializeModuleNotification object:nil];
}

- (void)_removeInitModuleObserver {
  [[NSNotificationCenter defaultCenter] removeObserver:self name:RCTDidInitializeModuleNotification object:nil];
}

- (void)didInitializeModule:(NSNotification *)note {
  id<RCTBridgeModule> module = note.userInfo[@"module"];
  if ([module isKindOfClass:[RCTDevMenu class]]) {
    // RCTDevMenu registers its global keyboard commands at init.
    // To avoid clashes with keyboard commands registered by expo-dev-client, we unregister some of them
    // and this needs to happen after the module has been initialized.
    // RCTDevMenu registers its commands here: https://github.com/facebook/react-native/blob/f3e8ea9c2910b33db17001e98b96720b07dce0b3/React/CoreModules/RCTDevMenu.mm#L130-L135
    // expo-dev-menu registers its commands here: https://github.com/expo/expo/blob/6da15324ff0b4a9cb24055e9815b8aa11f0ac3af/packages/expo-dev-menu/ios/Interceptors/DevMenuKeyCommandsInterceptor.swift#L27-L29
    [[RCTKeyCommands sharedInstance] unregisterKeyCommandWithInput:@"d"
                                                     modifierFlags:UIKeyModifierCommand];
  }
}

-(NSDictionary *)getBuildInfo
{ 
  NSMutableDictionary *buildInfo = [NSMutableDictionary new];

  NSString *appIcon = [self getAppIcon];
  NSString *runtimeVersion = [self getUpdatesConfigForKey:@"EXUpdatesRuntimeVersion"];
  NSString *sdkVersion = [self getUpdatesConfigForKey:@"EXUpdatesSDKVersion"];
  NSString *appVersion = [self getFormattedAppVersion];
  NSString *appName = [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleDisplayName"] ?: [[NSBundle mainBundle] objectForInfoDictionaryKey: @"CFBundleExecutable"];

  [buildInfo setObject:appName forKey:@"appName"];
  [buildInfo setObject:appIcon forKey:@"appIcon"];
  [buildInfo setObject:appVersion forKey:@"appVersion"];
  [buildInfo setObject:runtimeVersion forKey:@"runtimeVersion"];
  [buildInfo setObject:sdkVersion forKey:@"sdkVersion"];

  return buildInfo;
}

-(NSString *)getAppIcon 
{
  NSString *appIcon = @"";
  NSString *appIconName = [[[[[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleIcons"] objectForKey:@"CFBundlePrimaryIcon"] objectForKey:@"CFBundleIconFiles"]  lastObject];
  
  if (appIconName != nil) {
    NSString *resourcePath = [[NSBundle mainBundle] resourcePath];
    NSString *appIconPath = [[resourcePath stringByAppendingString:appIconName] stringByAppendingString:@".png"];
    appIcon = [@"file://" stringByAppendingString:appIconPath];
  }
  
  return appIcon;
}

-(NSString *)getUpdatesConfigForKey:(NSString *)key
{
  NSString *value = @"";
  NSString *path = [[NSBundle mainBundle] pathForResource:@"Expo" ofType:@"plist"];
  
  if (path != nil) {
    NSDictionary *expoConfig = [NSDictionary dictionaryWithContentsOfFile:path];
    
    if (expoConfig != nil) {
      value = [expoConfig objectForKey:key] ?: @"";
    }
  }

  return value;
}

-(NSString *)getFormattedAppVersion 
{
  NSString *shortVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"];
  NSString *buildVersion = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"];
  NSString *appVersion = [NSString stringWithFormat:@"%@ (%@)", shortVersion, buildVersion];
  return appVersion;
}

-(void)copyToClipboard:(NSString *)content {
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ? : @"");
}

- (void)setDevMenuAppBridge
{
  DevMenuManager *manager = [DevMenuManager shared];
  manager.currentBridge = self.appBridge;
  
  if (self.manifest != nil) {
    manager.currentManifest = self.manifest;
    manager.currentManifestURL = self.manifestURL;
  }
}

- (void)invalidateDevMenuApp
{
  DevMenuManager *manager = [DevMenuManager shared];
  manager.currentBridge = nil;
  manager.currentManifest = nil;
  manager.currentManifestURL = nil;
}

@end
