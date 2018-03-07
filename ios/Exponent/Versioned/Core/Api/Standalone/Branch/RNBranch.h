#import "EXScopedBridgeModule.h"

extern NSString * const RNBranchLinkOpenedNotification;
extern NSString * const RNBranchLinkOpenedNotificationErrorKey;
extern NSString * const RNBranchLinkOpenedNotificationParamsKey;
extern NSString * const RNBranchLinkOpenedNotificationUriKey;
extern NSString * const RNBranchLinkOpenedNotificationBranchUniversalObjectKey;
extern NSString * const RNBranchLinkOpenedNotificationLinkPropertiesKey;

@protocol EXBranchScopedModuleDelegate

- (void)branchModuleDidInit:(id)branchModule;

@end

@interface RNBranch : EXScopedBridgeModule

+ (void)initSessionWithLaunchOptions:(NSDictionary *)launchOptions isReferrable:(BOOL)isReferrable;
+ (BOOL)handleDeepLink:(NSURL *)url;
+ (BOOL)continueUserActivity:(NSUserActivity *)userActivity;
+ (void)useTestInstance;

@end
