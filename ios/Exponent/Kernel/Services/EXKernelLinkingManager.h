// Copyright 2015-present 650 Industries. All rights reserved.
//
// Contains logic for figuring out how to take care of deep links.

#import "EXLinkingManager.h"
#import "EXReactAppManager.h"
#import "EXUtil.h"

FOUNDATION_EXPORT NSNotificationName kEXKernelRefreshForegroundTaskNotification DEPRECATED_ATTRIBUTE;

/**
 * Post this notification with to indicate that you want the kernel
 * to try and open that link. Parameters in the notification may include:
 *   url - the url to try and open.
 */
FOUNDATION_EXPORT NSNotificationName kEXKernelOpenUrlNotification DEPRECATED_MSG_ATTRIBUTE("Use `openUrl`");

@interface EXKernelLinkingManager : NSObject
  <EXLinkingManagerScopedModuleDelegate, EXUtilScopedModuleDelegate>

/**
 *  Either opens the url on an existing bridge, or sends it to the kernel
 *  for opening on a new bridge.
 */
- (void)openUrl:(NSString *)urlString isUniversalLink:(BOOL)isUniversalLink;

/**
 *  Called by Util.reload() to rerequest the foreground tasks's manifest
 *  and reload the bundle url it contains.
 */
- (void)refreshForegroundTask;

/**
 *  Flagged when `refreshForegroundTask` is called. After the manifest round trip is complete,
 *  the kernel may need to disambiguate loading a new app from refreshing the existing app.
 */
- (BOOL)isRefreshExpectedForAppManager:(EXReactAppManager *)manager;

/**
 *  Returns the deep link prefix for a given experience uri.
 */
+ (NSString *)linkingUriForExperienceUri:(NSURL *)uri;

/**
 *  Normalize a uri and (if needed) subtitute
 *  standalone-app-specific deep link formatting.
 */
+ (NSURL *)uriTransformedForLinking:(NSURL *)uri isUniversalLink:(BOOL)isUniversalLink;

# pragma mark - app-wide linking handlers

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation;

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray *))restorationHandler;

+ (NSURL *)initialUrlFromLaunchOptions: (NSDictionary *)launchOptions;

@end
