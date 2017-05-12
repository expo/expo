#import <Foundation/Foundation.h>
#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>

extern NSString * const ABI17_0_0RNBranchLinkOpenedNotification;
extern NSString * const ABI17_0_0RNBranchLinkOpenedNotificationErrorKey;
extern NSString * const ABI17_0_0RNBranchLinkOpenedNotificationParamsKey;
extern NSString * const ABI17_0_0RNBranchLinkOpenedNotificationUriKey;
extern NSString * const ABI17_0_0RNBranchLinkOpenedNotificationBranchUniversalObjectKey;
extern NSString * const ABI17_0_0RNBranchLinkOpenedNotificationLinkPropertiesKey;

@interface ABI17_0_0RNBranch : NSObject <ABI17_0_0RCTBridgeModule>

+ (void)initSessionWithLaunchOptions:(NSDictionary *)launchOptions isReferrable:(BOOL)isReferrable;
+ (BOOL)handleDeepLink:(NSURL *)url;
+ (BOOL)continueUserActivity:(NSUserActivity *)userActivity;
+ (void)useTestInstance;

@end
