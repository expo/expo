// Copyright 2015-present 650 Industries. All rights reserved.
//
// Contains logic for figuring out how to take care of deep links.

#import "EXLinkingManager.h"
#import "EXReactAppManager.h"
#import "EXUtil.h"

@interface EXKernelLinkingManager : NSObject <EXLinkingManagerScopedModuleDelegate, UIApplicationDelegate>

/**
 *  Either opens the url on an existing bridge, or sends it to the kernel
 *  for opening on a new bridge.
 */
- (void)openUrl:(NSString *)urlString isUniversalLink:(BOOL)isUniversalLink;

/**
 *  Returns the deep link prefix for a given experience uri.
 */
+ (NSString *)linkingUriForExperienceUri:(NSURL *)uri useLegacy:(BOOL)useLegacy;

/**
 *  Normalize a uri and (if needed) subtitute
 *  standalone-app-specific deep link formatting.
 */
+ (NSURL *)uriTransformedForLinking:(NSURL *)uri isUniversalLink:(BOOL)isUniversalLink;

/**
 *  Replace (if needed) initial uri with one from launch options,
 *  and transform for correct deep link formatting.
 */
+ (NSURL *)initialUriWithManifestUrl:(NSURL *)manifestUrl;

+ (NSString *)stringByRemovingDeepLink:(NSString *)path;

/**
 *  Grab the release channel from the query parameters of a uri
 */
+ (NSString *)releaseChannelWithUrlComponents:(NSURLComponents *)urlComponents;

# pragma mark - app-wide linking handlers

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation;

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray *))restorationHandler;

+ (NSURL *)initialUrlFromLaunchOptions: (NSDictionary *)launchOptions;

/**
 * Consumes the reserved `__expo_*` launch params of a URL the user gave us and returns the project URL to open:
 * the `__expo_url` target normalized like any other project URL, or the URL without its reserved params.
 * Call it once per URL. Params inside a `__expo_url` target belong to that project and must not be applied.
 */
+ (nonnull NSURL *)resolveLaunchUrl:(nonnull NSURL *)url NS_SWIFT_NAME(resolveLaunchUrl(_:));

@end
