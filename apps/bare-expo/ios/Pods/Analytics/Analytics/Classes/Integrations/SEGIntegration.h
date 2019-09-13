#import <Foundation/Foundation.h>
#import "SEGIdentifyPayload.h"
#import "SEGTrackPayload.h"
#import "SEGScreenPayload.h"
#import "SEGAliasPayload.h"
#import "SEGIdentifyPayload.h"
#import "SEGGroupPayload.h"
#import "SEGContext.h"

NS_ASSUME_NONNULL_BEGIN

@protocol SEGIntegration <NSObject>

@optional
// Identify will be called when the user calls either of the following:
// 1. [[SEGAnalytics sharedInstance] identify:someUserId];
// 2. [[SEGAnalytics sharedInstance] identify:someUserId traits:someTraits];
// 3. [[SEGAnalytics sharedInstance] identify:someUserId traits:someTraits options:someOptions];
// @see https://segment.com/docs/spec/identify/
- (void)identify:(SEGIdentifyPayload *)payload;

// Track will be called when the user calls either of the following:
// 1. [[SEGAnalytics sharedInstance] track:someEvent];
// 2. [[SEGAnalytics sharedInstance] track:someEvent properties:someProperties];
// 3. [[SEGAnalytics sharedInstance] track:someEvent properties:someProperties options:someOptions];
// @see https://segment.com/docs/spec/track/
- (void)track:(SEGTrackPayload *)payload;

// Screen will be called when the user calls either of the following:
// 1. [[SEGAnalytics sharedInstance] screen:someEvent];
// 2. [[SEGAnalytics sharedInstance] screen:someEvent properties:someProperties];
// 3. [[SEGAnalytics sharedInstance] screen:someEvent properties:someProperties options:someOptions];
// @see https://segment.com/docs/spec/screen/
- (void)screen:(SEGScreenPayload *)payload;

// Group will be called when the user calls either of the following:
// 1. [[SEGAnalytics sharedInstance] group:someGroupId];
// 2. [[SEGAnalytics sharedInstance] group:someGroupId traits:];
// 3. [[SEGAnalytics sharedInstance] group:someGroupId traits:someGroupTraits options:someOptions];
// @see https://segment.com/docs/spec/group/
- (void)group:(SEGGroupPayload *)payload;

// Alias will be called when the user calls either of the following:
// 1. [[SEGAnalytics sharedInstance] alias:someNewId];
// 2. [[SEGAnalytics sharedInstance] alias:someNewId options:someOptions];
// @see https://segment.com/docs/spec/alias/
- (void)alias:(SEGAliasPayload *)payload;

// Reset is invoked when the user logs out, and any data saved about the user should be cleared.
- (void)reset;

// Flush is invoked when any queued events should be uploaded.
- (void)flush;

// App Delegate Callbacks

// Callbacks for notifications changes.
// ------------------------------------
- (void)receivedRemoteNotification:(NSDictionary *)userInfo;
- (void)failedToRegisterForRemoteNotificationsWithError:(NSError *)error;
- (void)registeredForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
- (void)handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo;

// Callbacks for app state changes
// -------------------------------

- (void)applicationDidFinishLaunching:(NSNotification *)notification;
- (void)applicationDidEnterBackground;
- (void)applicationWillEnterForeground;
- (void)applicationWillTerminate;
- (void)applicationWillResignActive;
- (void)applicationDidBecomeActive;

- (void)continueUserActivity:(NSUserActivity *)activity;
- (void)openURL:(NSURL *)url options:(NSDictionary *)options;

@end

NS_ASSUME_NONNULL_END
