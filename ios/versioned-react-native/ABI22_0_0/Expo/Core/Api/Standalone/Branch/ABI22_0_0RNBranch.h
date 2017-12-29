#import <Foundation/Foundation.h>
#import <ReactABI22_0_0/ABI22_0_0RCTBridgeModule.h>

extern NSString * const ABI22_0_0RNBranchLinkOpenedNotification;
extern NSString * const ABI22_0_0RNBranchLinkOpenedNotificationErrorKey;
extern NSString * const ABI22_0_0RNBranchLinkOpenedNotificationParamsKey;
extern NSString * const ABI22_0_0RNBranchLinkOpenedNotificationUriKey;
extern NSString * const ABI22_0_0RNBranchLinkOpenedNotificationBranchUniversalObjectKey;
extern NSString * const ABI22_0_0RNBranchLinkOpenedNotificationLinkPropertiesKey;

@interface ABI22_0_0RNBranch : NSObject <ABI22_0_0RCTBridgeModule>

+ (void)initSessionWithLaunchOptions:(NSDictionary *)launchOptions isReferrable:(BOOL)isReferrable;
+ (BOOL)handleDeepLink:(NSURL *)url;
+ (BOOL)continueUserActivity:(NSUserActivity *)userActivity;
+ (void)useTestInstance;

@end
