#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeDelegate.h>

#import <UIKit/UIKit.h>

#import <EXManifests/EXManifestsManifest.h>
#import <EXUpdatesInterface/EXUpdatesExternalInterface.h>

NS_ASSUME_NONNULL_BEGIN

@class EXDevLauncherInstallationIDHelper;
@class EXDevLauncherPendingDeepLinkRegistry;
@class EXDevLauncherController;
@class EXDevLauncherErrorManager;

@protocol EXDevLauncherControllerDelegate <NSObject>

- (void)devLauncherController:(EXDevLauncherController *)developmentClientController
                didStartWithSuccess:(BOOL)success;

@end

@interface EXDevLauncherController : NSObject <RCTBridgeDelegate>

@property (nonatomic, weak) RCTBridge * _Nullable appBridge;
@property (nonatomic, strong) RCTBridge *launcherBridge;
@property (nonatomic, strong) EXDevLauncherPendingDeepLinkRegistry *pendingDeepLinkRegistry;
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

- (NSDictionary *)recentlyOpenedApps;

- (void)clearRecentlyOpenedApps;

- (NSDictionary<UIApplicationLaunchOptionsKey, NSObject*> *)getLaunchOptions;

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

- (NSDictionary *)getUpdatesConfig;

@end

NS_ASSUME_NONNULL_END
