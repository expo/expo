// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAbstractLoader.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "ExpoKit.h"
#import "EXReactAppManager.h"

#import <CocoaLumberjack/CocoaLumberjack.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>

NSString *kEXExpoDeepLinkSeparator = @"--/";
NSString *kEXExpoLegacyDeepLinkSeparator = @"+";

@interface EXKernelLinkingManager ()

@property (nonatomic, weak) EXReactAppManager *appManagerToRefresh;
@property int priority;
@end


@implementation EXKernelLinkingManager

EX_REGISTER_SINGLETON_MODULE(KernelLinkingManager);

- (void)openUrl:(NSString *)urlString isUniversalLink:(BOOL)isUniversalLink
{
  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    DDLogInfo(@"Tried to route invalid url: %@", urlString);
    return;
  }
  EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  EXKernelAppRecord *destinationApp = nil;
  NSURL *urlToRoute = [[self class] uriTransformedForLinking:url isUniversalLink:isUniversalLink];

  for (NSString *recordId in [appRegistry appEnumerator]) {
    EXKernelAppRecord *appRecord = [appRegistry recordForId:recordId];
    if (!appRecord || appRecord.status != kEXKernelAppRecordStatusRunning) {
      continue;
    }
    if (appRecord.appLoader.manifestUrl && [[self class] _isUrl:urlToRoute deepLinkIntoAppWithManifestUrl:appRecord.appLoader.manifestUrl]) {
      // this is a link into a bridge we already have running.
      // use this bridge as the link's destination instead of the kernel.
      destinationApp = appRecord;
      break;
    }
  }

  if (destinationApp) {
    [[EXKernel sharedInstance] sendUrl:urlToRoute.absoluteString toAppRecord:destinationApp];
  } else {
    if ([EXKernel sharedInstance].appRegistry.homeAppRecord
        && [EXKernel sharedInstance].appRegistry.homeAppRecord.appManager.status == kEXReactAppManagerStatusRunning) {
      // if Home is present and running, open a new app with this url.
      // if home isn't running yet, we'll handle the LaunchOptions url after home finishes launching.

      if (@available(iOS 14, *)) {
        // Try to detect if we're trying to open a local network URL so we can preemptively show the
        // Local Network permission prompt -- otherwise the network request will fail before the user
        // has time to accept or reject the permission.
        NSString *host = urlToRoute.host;
        if ([host hasPrefix:@"192.168."] || [host hasPrefix:@"172."] || [host hasPrefix:@"10."]) {
          // We want to trigger the local network permission dialog. However, the iOS API doesn't expose a way to do it.
          // But we can use system functionality that needs this permission to trigger prompt.
          // See https://stackoverflow.com/questions/63940427/ios-14-how-to-trigger-local-network-dialog-and-check-user-answer
          static dispatch_once_t once;
          dispatch_once(&once, ^{
            [[NSProcessInfo processInfo] hostName];
          });
        }
      }

      // Since this method might have been called on any thread,
      // let's make sure we create a new app on the main queue.
      RCTExecuteOnMainQueue(^{
        [[EXKernel sharedInstance] createNewAppWithUrl:urlToRoute initialProps:nil];
      });
    }
  }
}

#pragma mark - scoped module delegate

- (void)linkingModule:(__unused id)linkingModule didOpenUrl:(NSString *)url
{
  [self openUrl:url isUniversalLink:NO];
}

- (BOOL)linkingModule:(__unused id)linkingModule shouldOpenExpoUrl:(NSURL *)url
{
  // we don't need to explicitly include a standalone app custom URL scheme here
  // because the default iOS linking behavior will still hand those links back to Exponent.
  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:YES];
  if (components) {
    return ([components.scheme isEqualToString:@"exp"] ||
            [components.scheme isEqualToString:@"exps"] ||
            [[self class] _isExpoHostedUrlComponents:components]
            );
  }
  return NO;
}

#pragma mark - internal

#pragma mark - static link transforming logic

+ (NSString *)linkingUriForExperienceUri:(NSURL *)uri useLegacy:(BOOL)useLegacy
{
  uri = [self uriTransformedForLinking:uri isUniversalLink:NO];
  if (!uri) {
    return nil;
  }
  NSURLComponents *components = [NSURLComponents componentsWithURL:uri resolvingAgainstBaseURL:YES];

  NSMutableString* path = [NSMutableString stringWithString:components.path];

  // if the uri already contains a deep link, strip everything specific to that
  path = [[self stringByRemovingDeepLink:path] mutableCopy];

  if (path.length == 0 || [path characterAtIndex:path.length - 1] != '/') {
    [path appendString:@"/"];
  }
  // since this is used in a few places we need to keep the legacy option around for compat
  if (useLegacy) {
    [path appendString:kEXExpoLegacyDeepLinkSeparator];
  } else if ([[self class] _isExpoHostedUrlComponents:components]) {
    [path appendString:kEXExpoDeepLinkSeparator];
  }
  components.path = path;

  components.query = nil;

  return [components string];
}

+ (NSString *)stringByRemovingDeepLink:(NSString *)path
{
  NSRange deepLinkRange = [path rangeOfString:kEXExpoDeepLinkSeparator];
  // deprecated but we still need to support these links
  // TODO: remove this
  NSRange deepLinkRangeLegacy = [path rangeOfString:kEXExpoLegacyDeepLinkSeparator];
  if (deepLinkRange.length > 0) {
    path = [path substringToIndex:deepLinkRange.location];
  } else if (deepLinkRangeLegacy.length > 0) {
    path = [path substringToIndex:deepLinkRangeLegacy.location];
  }
  return path;
}

+ (NSURL *)uriTransformedForLinking:(NSURL *)uri isUniversalLink:(BOOL)isUniversalLink
{
  if (!uri) {
    return nil;
  }
  return [self _uriNormalizedForLinking:uri];
}

+ (NSURL *)initialUriWithManifestUrl:(NSURL *)manifestUrl
{
  NSURL *urlToTransform = manifestUrl;
  NSURLComponents *urlComponents = [NSURLComponents componentsWithURL:urlToTransform resolvingAgainstBaseURL:YES];
  return [[self class] uriTransformedForLinking:urlToTransform isUniversalLink:[urlComponents.scheme isEqualToString:@"https"]];
}

+ (NSURL *)_uriNormalizedForLinking: (NSURL *)uri
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:uri resolvingAgainstBaseURL:YES];

  if ([components.scheme isEqualToString:@"https"] || [components.scheme isEqualToString:@"exps"]) {
    components.scheme = @"exps";
  } else {
    components.scheme = @"exp";
  }

  if ([components.scheme isEqualToString:@"exp"] && [components.port integerValue] == 80) {
    components.port = nil;
  } else if ([components.scheme isEqualToString:@"exps"] && [components.port integerValue] == 443) {
    components.port = nil;
  }

  return [components URL];
}

+ (BOOL)isExpoHostedUrl: (NSURL *)url
{
  return [[self class] _isExpoHostedUrlComponents:[NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:YES]];
}

+ (BOOL)_isExpoHostedUrlComponents: (NSURLComponents *)components
{
  if (components.host) {
    return [components.host isEqualToString:@"exp.host"] ||
      [components.host isEqualToString:@"expo.io"] ||
      [components.host isEqualToString:@"exp.direct"] ||
      [components.host isEqualToString:@"expo.test"] ||
      [components.host hasSuffix:@".exp.host"] ||
      [components.host hasSuffix:@".exp.direct"] ||
      [components.host hasSuffix:@".expo.test"];
  }
  return NO;
}

+ (BOOL)_isUrl:(NSURL *)urlToRoute deepLinkIntoAppWithManifestUrl:(NSURL *)manifestUrl
{
  NSURLComponents *urlToRouteComponents = [NSURLComponents componentsWithURL:urlToRoute resolvingAgainstBaseURL:YES];
  NSURLComponents *manifestUrlComponents = [NSURLComponents componentsWithURL:[self uriTransformedForLinking:manifestUrl isUniversalLink:NO] resolvingAgainstBaseURL:YES];

  if (urlToRouteComponents.host && manifestUrlComponents.host && [urlToRouteComponents.host isEqualToString:manifestUrlComponents.host]) {
    if ((!urlToRouteComponents.port && !manifestUrlComponents.port) || (urlToRouteComponents.port && [urlToRouteComponents.port isEqualToNumber:manifestUrlComponents.port])) {
      NSString *urlToRouteBasePath = [[self class] _normalizePath:urlToRouteComponents.path];
      NSString *manifestUrlBasePath = [[self class] _normalizePath:manifestUrlComponents.path];

      if ([urlToRouteBasePath isEqualToString:manifestUrlBasePath]) {
        // release-channel is a special query parameter that we treat as a separate app, so we need to check that here
        NSString *manifestUrlReleaseChannel = [[self class] releaseChannelWithUrlComponents:manifestUrlComponents];
        NSString *urlToRouteReleaseChannel = [[self class] releaseChannelWithUrlComponents:urlToRouteComponents];
        if ([manifestUrlReleaseChannel isEqualToString:urlToRouteReleaseChannel]) {
          return YES;
        }
      }
    }
  }
  return NO;
}

+ (NSString *)_normalizePath:(NSString *)path
{
  if (!path) {
    return @"/";
  }
  NSString *basePath = [[self class] stringByRemovingDeepLink:path];
  NSMutableString *mutablePath = [basePath mutableCopy];
  if (mutablePath.length == 0 || [mutablePath characterAtIndex:mutablePath.length - 1] != '/') {
    [mutablePath appendString:@"/"];
  }
  return mutablePath;
}

+ (NSString *)releaseChannelWithUrlComponents:(NSURLComponents *)urlComponents
{
  NSString *releaseChannel = @"default";
  NSArray<NSURLQueryItem *> *queryItems = urlComponents.queryItems;
  if (queryItems) {
    for (NSURLQueryItem *item in queryItems) {
      if ([item.name isEqualToString:@"release-channel"]) {
        releaseChannel = item.value;
      }
    }
  }
  return releaseChannel;
}

#pragma mark - UIApplication hooks

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
            options:options
{
  [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:URL.absoluteString isUniversalLink:NO];
  return YES;
}

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:URL.absoluteString isUniversalLink:NO];
  return YES;
}

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray *))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:userActivity.webpageURL.absoluteString isUniversalLink:YES];

  }
  return YES;
}

+ (NSURL *)initialUrlFromLaunchOptions:(NSDictionary *)launchOptions
{
  NSURL *initialUrl;

  // Gets the `initialUrl` from `argv` passed to the process.
  // If `initialUrl` is found in both the process information and the launch options, we will use the one from the launch options.
  // However, it doesn't appear to be possible to pass it twice.
  initialUrl = [self initialUrlFromProcessInfo];
  
  if (launchOptions) {
    if (launchOptions[UIApplicationLaunchOptionsURLKey]) {
      initialUrl = launchOptions[UIApplicationLaunchOptionsURLKey];
    } else if (launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey]) {
      NSDictionary *userActivityDictionary = launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];

      if ([userActivityDictionary[UIApplicationLaunchOptionsUserActivityTypeKey] isEqual:NSUserActivityTypeBrowsingWeb]) {
        initialUrl = ((NSUserActivity *)userActivityDictionary[@"UIApplicationLaunchOptionsUserActivityKey"]).webpageURL;
      }
    }
  }

  return initialUrl;
}

+ (NSURL *)initialUrlFromProcessInfo
{
  NSProcessInfo *processInfo = [NSProcessInfo processInfo];
  NSArray *arguments = [processInfo arguments];
  BOOL nextIsUrl = NO;
  
  for (NSString *arg in arguments) {
    if (nextIsUrl) {
      NSURL *url = [NSURL URLWithString:arg];
      if (url) {
        return url;
      }
    }
    if ([arg isEqualToString:@"--initialUrl"]) {
      nextIsUrl = YES;
    }
  }
  return nil;
}

@end
