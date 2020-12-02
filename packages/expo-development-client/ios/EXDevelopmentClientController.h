#import <React/RCTBridgeModule.h>
#import <React/RCTBridgeDelegate.h>

#import <UIKit/UIKit.h>

@class EXDevelopmentClientPendingDeepLinkRegistry;

@class EXDevelopmentClientController;

@protocol EXDevelopmentClientControllerDelegate <NSObject>

- (void)developmentClientController:(EXDevelopmentClientController *)developmentClientController
                didStartWithSuccess:(BOOL)success;

@end

@interface EXDevelopmentClientController : NSObject <RCTBridgeDelegate>

@property (nonatomic, weak) RCTBridge *appBridge;
@property (nonatomic, strong) EXDevelopmentClientPendingDeepLinkRegistry *pendingDeepLinkRegistry;

+ (instancetype)sharedInstance;

- (void)startWithWindow:(UIWindow *)window delegate:(id<EXDevelopmentClientControllerDelegate>)delegate launchOptions:(NSDictionary *)launchOptions;

- (NSURL *)sourceUrl;

- (void)navigateToLauncher;

- (BOOL)onDeepLink:(NSURL *)url options:(NSDictionary *)options;

- (void)loadApp:(NSString *)url onSuccess:(void (^)())onSuccess onError:(void (^)(NSError *error))onError;

- (NSDictionary *)recentlyOpenedApps;

- (NSDictionary<UIApplicationLaunchOptionsKey, NSObject*> *)getLaunchOptions;

@end
