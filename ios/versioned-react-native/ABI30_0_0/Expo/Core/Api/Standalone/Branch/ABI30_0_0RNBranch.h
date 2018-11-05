#import "ABI30_0_0EXScopedBridgeModule.h"
#import <Branch/Branch.h>

// ABI30_0_0EXPO CHANGES:
// - inherit from ABI30_0_0EXScopedBridgeModule
// - add ABI30_0_0EXBranchScopedModuleDelegate protocol

extern NSString * _Nonnull const ABI30_0_0RNBranchLinkOpenedNotification;
extern NSString * _Nonnull const ABI30_0_0RNBranchLinkOpenedNotificationErrorKey;
extern NSString * _Nonnull const ABI30_0_0RNBranchLinkOpenedNotificationParamsKey;
extern NSString * _Nonnull const ABI30_0_0RNBranchLinkOpenedNotificationUriKey;
extern NSString * _Nonnull const ABI30_0_0RNBranchLinkOpenedNotificationBranchUniversalObjectKey;
extern NSString * _Nonnull const ABI30_0_0RNBranchLinkOpenedNotificationLinkPropertiesKey;

@protocol ABI30_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id _Nonnull)branchModule;

@end

@interface ABI30_0_0RNBranch : ABI30_0_0EXScopedBridgeModule

@property (class, readonly, nonnull) Branch *branch;

+ (void)initSessionWithLaunchOptions:(NSDictionary * _Nullable)launchOptions isReferrable:(BOOL)isReferrable;
+ (BOOL)handleDeepLink:(NSURL * _Nonnull)url __deprecated_msg("Please use [ABI30_0_0RNBranch.branch application:openURL:options] or [ABI30_0_0RNBranch.branch application:openURL:sourceApplication:annotation:] instead.");
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"
+ (BOOL)continueUserActivity:(NSUserActivity * _Nonnull)userActivity;
#pragma clang diagnostic pop

// Must be called before any other static method below
+ (void)useTestInstance;

+ (void)setDebug;
+ (void)delayInitToCheckForSearchAds;
+ (void)setAppleSearchAdsDebugMode;
+ (void)setRequestMetadataKey:(NSString * _Nonnull)key value:(NSObject * _Nonnull)value;

@end
