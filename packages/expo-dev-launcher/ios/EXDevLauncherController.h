#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeDelegate.h>

#import <UIKit/UIKit.h>

// When `use_frameworks!` is used, the generated Swift header is inside modules.
// Otherwise, it's available only locally with double-quoted imports.
#if __has_include(<EXUpdatesInterface/EXUpdatesInterface-Swift.h>)
#import <EXUpdatesInterface/EXUpdatesInterface-Swift.h>
#else
#import "EXUpdatesInterface-Swift.h"
#endif
#if __has_include(<EXManifests/EXManifests-Swift.h>)
#import <EXManifests/EXManifests-Swift.h>
#else
#import "EXManifests-Swift.h"
#endif

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@class EXAppContext;
@class EXDevLauncherInstallationIDHelper;
@class EXDevLauncherPendingDeepLinkRegistry;
@class EXDevLauncherRecentlyOpenedAppsRegistry;
@class EXDevLauncherController;
@class EXDevLauncherErrorManager;

@protocol EXDevLauncherControllerDelegate <NSObject>

- (void)devLauncherController:(EXDevLauncherController *)developmentClientController
                didStartWithSuccess:(BOOL)success;

@end

@interface EXDevLauncherController : RCTDefaultReactNativeFactoryDelegate <RCTBridgeDelegate, EXUpdatesExternalInterfaceDelegate>

@property (nonatomic, weak) RCTBridge * _Nullable appBridge;
@property (nonatomic, weak) EXAppContext * _Nullable appContext;
@property (nonatomic, strong) EXDevLauncherPendingDeepLinkRegistry *pendingDeepLinkRegistry;
@property (nonatomic, strong) EXDevLauncherRecentlyOpenedAppsRegistry *recentlyOpenedAppsRegistry;
@property (nonatomic, strong) id<EXUpdatesExternalInterface> updatesInterface;
@property (nonatomic, readonly, assign) BOOL isStarted;

+ (instancetype)sharedInstance;

- (void)startWithWindow:(UIWindow *)window delegate:(id<EXDevLauncherControllerDelegate>)delegate launchOptions:(NSDictionary * _Nullable)launchOptions;

- (void)autoSetupPrepare:(id<EXDevLauncherControllerDelegate>)delegate launchOptions:(NSDictionary * _Nullable)launchOptions;

- (void)autoSetupStart:(UIWindow *)window;

- (nullable NSURL *)sourceUrl;

- (void)navigateToLauncher;

- (BOOL)onDeepLink:(NSURL *)url options:(NSDictionary *)options;

- (void)loadApp:(NSURL *)url onSuccess:(void (^ _Nullable)(void))onSuccess onError:(void (^ _Nullable)(NSError *error))onError;

- (void)loadApp:(NSURL *)expoUrl withProjectUrl:(NSURL  * _Nullable)projectUrl onSuccess:(void (^ _Nullable)(void))onSuccess onError:(void (^ _Nullable)(NSError *error))onError;

- (void)clearRecentlyOpenedApps;

- (NSDictionary *)getLaunchOptions;

- (EXManifestsManifest * _Nullable)appManifest;

- (NSURL * _Nullable)appManifestURL;

- (nullable NSURL *)appManifestURLWithFallback;

- (BOOL)isAppRunning;

- (BOOL)isStarted;

- (UIWindow * _Nullable)currentWindow;

- (EXDevLauncherErrorManager *)errorManager;

- (EXDevLauncherInstallationIDHelper *)installationIDHelper;

+ (NSString * _Nullable)version;

- (NSDictionary *)getBuildInfo;

- (void)copyToClipboard:(NSString *)content;

- (NSDictionary *)getUpdatesConfig: (nullable NSDictionary *) constants;

@end

NS_ASSUME_NONNULL_END
