#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#import <Branch/Branch.h>

extern NSString * _Nonnull const RNBranchLinkOpenedNotification;
extern NSString * _Nonnull const RNBranchLinkOpenedNotificationErrorKey;
extern NSString * _Nonnull const RNBranchLinkOpenedNotificationParamsKey;
extern NSString * _Nonnull const RNBranchLinkOpenedNotificationUriKey;
extern NSString * _Nonnull const RNBranchLinkOpenedNotificationBranchUniversalObjectKey;
extern NSString * _Nonnull const RNBranchLinkOpenedNotificationLinkPropertiesKey;


@interface RNBranch : NSObject <RCTBridgeModule>

@property (class, readonly, nonnull) Branch *branch;

+ (void)initSessionWithLaunchOptions:(NSDictionary * _Nullable)launchOptions isReferrable:(BOOL)isReferrable;
+ (BOOL)application:(UIApplication * _Nullable)application openURL:(NSURL * _Nullable)url options:(NSDictionary<UIApplicationOpenURLOptionsKey, id> * _Nullable)options;
+ (BOOL)application:(UIApplication * _Nullable)application openURL:(NSURL * _Nullable)url sourceApplication:(NSString * _Nullable)sourceApplication annotation:(id _Nullable)annotation;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"
+ (BOOL)continueUserActivity:(NSUserActivity * _Nonnull)userActivity;
#pragma clang diagnostic pop

// Must be called before any other static method below
+ (void)useTestInstance;
+ (void)deferInitializationForJSLoad;

+ (void)setDebug;
+ (void)delayInitToCheckForSearchAds;
+ (void)setRequestMetadataKey:(NSString * _Nonnull)key value:(NSObject * _Nonnull)value;

@end
