#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

extern NSString * const RNBranchLinkOpenedNotification;
extern NSString * const RNBranchLinkOpenedNotificationErrorKey;
extern NSString * const RNBranchLinkOpenedNotificationParamsKey;
extern NSString * const RNBranchLinkOpenedNotificationUriKey;
extern NSString * const RNBranchLinkOpenedNotificationBranchUniversalObjectKey;
extern NSString * const RNBranchLinkOpenedNotificationLinkPropertiesKey;

@interface RNBranch : NSObject <RCTBridgeModule>

+ (void)initSessionWithLaunchOptions:(NSDictionary *)launchOptions isReferrable:(BOOL)isReferrable;
+ (BOOL)handleDeepLink:(NSURL *)url;
+ (BOOL)continueUserActivity:(NSUserActivity *)userActivity;
+ (void)useTestInstance;

@end
