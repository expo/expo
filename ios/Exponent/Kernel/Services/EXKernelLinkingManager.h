// Copyright 2015-present 650 Industries. All rights reserved.
//
// Contains logic for figuring out how to take care of deep links.

#import <UIKit/UIKit.h>

/**
 * Post this notification with to indicate that you want the kernel
 * to try and open that link. Parameters in the notification may include:
 *   url - the url to try and open.
 *   bridge - (optional) if this event came from a bridge, a pointer to that bridge.
 */
FOUNDATION_EXPORT NSNotificationName kEXKernelOpenUrlNotification;

@interface EXKernelLinkingManager : NSObject

+ (instancetype)sharedInstance;

/**
 *  Returns the deep link prefix for a given experience uri.
 */
+ (NSString *)linkingUriForExperienceUri:(NSURL *)uri;

/**
 *  Normalize a uri and (if needed) subtitute
 *  standalone-app-specific deep link formatting.
 */
+ (NSURL *)uriTransformedForLinking:(NSURL *)uri;

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
