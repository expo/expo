#import "ABI26_0_0EXScopedBridgeModule.h"

extern NSString * const ABI26_0_0RNBranchLinkOpenedNotification;
extern NSString * const ABI26_0_0RNBranchLinkOpenedNotificationErrorKey;
extern NSString * const ABI26_0_0RNBranchLinkOpenedNotificationParamsKey;
extern NSString * const ABI26_0_0RNBranchLinkOpenedNotificationUriKey;
extern NSString * const ABI26_0_0RNBranchLinkOpenedNotificationBranchUniversalObjectKey;
extern NSString * const ABI26_0_0RNBranchLinkOpenedNotificationLinkPropertiesKey;

@protocol ABI26_0_0EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id)branchModule;

@end

@interface ABI26_0_0RNBranch : ABI26_0_0EXScopedBridgeModule

+ (void)initSessionWithLaunchOptions:(NSDictionary *)launchOptions isReferrable:(BOOL)isReferrable;
+ (BOOL)handleDeepLink:(NSURL *)url;
+ (BOOL)continueUserActivity:(NSUserActivity *)userActivity;
+ (void)useTestInstance;

@end
