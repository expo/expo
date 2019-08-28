// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppLoader.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXKernelLinkingManager.h"
#import "ExpoKit.h"
#import "EXReactAppManager.h"

#import <CocoaLumberjack/CocoaLumberjack.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>

NSString *kEXExpoDeepLinkSeparator = @"--/";
NSString *kEXExpoLegacyDeepLinkSeparator = @"+";

@interface EXKernelLinkingManager ()

@property (nonatomic, weak) EXReactAppManager *appManagerToRefresh;

@end

@implementation EXKernelLinkingManager

- (void)openUrl:(NSString *)urlString isUniversalLink:(BOOL)isUniversalLink
{
  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    DDLogInfo(@"Tried to route invalid url: %@", urlString);
    return;
  }
  EXKernelAppRegistry *appRegistry = [EXKernel sharedInstance].appRegistry;
  EXKernelAppRecord *destinationApp = nil;
  NSURL *urlToRoute = url;

  if (isUniversalLink && [EXEnvironment sharedEnvironment].isDetached) {
    destinationApp = [EXKernel sharedInstance].appRegistry.standaloneAppRecord;
  } else {
    urlToRoute = [[self class] uriTransformedForLinking:url isUniversalLink:isUniversalLink];

    if (appRegistry.standaloneAppRecord) {
      destinationApp = appRegistry.standaloneAppRecord;
    } else {
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
    }
  }

  if (destinationApp) {
    [[EXKernel sharedInstance] sendUrl:urlToRoute.absoluteString toAppRecord:destinationApp];
  } else {
    if (![EXEnvironment sharedEnvironment].isDetached
        && [EXKernel sharedInstance].appRegistry.homeAppRecord
        && [EXKernel sharedInstance].appRegistry.homeAppRecord.appManager.status == kEXReactAppManagerStatusRunning) {
      // if Home is present and running, open a new app with this url.
      // if home isn't running yet, we'll handle the LaunchOptions url after home finishes launching.

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
  // do not attempt to route internal exponent links at all if we're in a detached app.
  if ([EXEnvironment sharedEnvironment].isDetached) {
    return NO;
  }
  
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

  // if the provided uri is the standalone app manifest uri,
  // this should have been transformed into customscheme://deep-link
  // and then all we do here is strip off the deep-link part.
  if ([EXEnvironment sharedEnvironment].isDetached && [[EXEnvironment sharedEnvironment] isStandaloneUrlScheme:components.scheme]) {
    if (useLegacy) {
      return [NSString stringWithFormat:@"%@://%@", components.scheme, kEXExpoLegacyDeepLinkSeparator];
    } else {
      return [NSString stringWithFormat:@"%@://", components.scheme];
    }
  }

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
  
  // If the initial uri is a universal link in a standalone app don't touch it.
  if ([EXEnvironment sharedEnvironment].isDetached && isUniversalLink) {
    return uri;
  }

  NSURL *normalizedUri = [self _uriNormalizedForLinking:uri];

  if ([EXEnvironment sharedEnvironment].isDetached && [EXEnvironment sharedEnvironment].hasUrlScheme) {
    // if the provided uri is the standalone app manifest uri,
    // transform this into customscheme://deep-link
    if ([self _isStandaloneManifestUrl:normalizedUri]) {
      NSString *uriString = normalizedUri.absoluteString;
      NSRange deepLinkRange = [uriString rangeOfString:kEXExpoDeepLinkSeparator];
      // deprecated but we still need to support these links
      // TODO: remove this
      NSRange deepLinkRangeLegacy = [uriString rangeOfString:kEXExpoLegacyDeepLinkSeparator];
      NSString *deepLink = @"";
      if (deepLinkRange.length > 0 && [[self class] isExpoHostedUrl:normalizedUri]) {
        deepLink = [uriString substringFromIndex:deepLinkRange.location + kEXExpoDeepLinkSeparator.length];
      } else if (deepLinkRangeLegacy.length > 0) {
        deepLink = [uriString substringFromIndex:deepLinkRangeLegacy.location + kEXExpoLegacyDeepLinkSeparator.length];
      }
      NSString *result = [NSString stringWithFormat:@"%@://%@", [EXEnvironment sharedEnvironment].urlScheme, deepLink];
      return [NSURL URLWithString:result];
    }
  }
  return normalizedUri;
}

+ (NSURL *)initialUriWithManifestUrl:(NSURL *)manifestUrl
{
  NSURL *urlToTransform = manifestUrl;
  if ([EXEnvironment sharedEnvironment].isDetached) {
    NSDictionary *launchOptions = [ExpoKit sharedInstance].launchOptions;
    NSURL *launchOptionsUrl = [[self class] initialUrlFromLaunchOptions:launchOptions];
    if (launchOptionsUrl) {
      urlToTransform = launchOptionsUrl;
    }
  }
  return [[self class] uriTransformedForLinking:urlToTransform isUniversalLink:NO];
}

+ (NSURL *)_uriNormalizedForLinking: (NSURL *)uri
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:uri resolvingAgainstBaseURL:YES];

  if ([EXEnvironment sharedEnvironment].isDetached && [[EXEnvironment sharedEnvironment] isStandaloneUrlScheme:components.scheme]) {
    // if we're standalone and this uri had the standalone scheme, leave it alone.
  } else {
    if ([components.scheme isEqualToString:@"https"] || [components.scheme isEqualToString:@"exps"]) {
      components.scheme = @"exps";
    } else {
      components.scheme = @"exp";
    }
  }

  if ([components.scheme isEqualToString:@"exp"] && [components.port integerValue] == 80) {
    components.port = nil;
  } else if ([components.scheme isEqualToString:@"exps"] && [components.port integerValue] == 443) {
    components.port = nil;
  }

  return [components URL];
}

+ (BOOL)_isStandaloneManifestUrl: (NSURL *)normalizedUri
{
  NSString *uriString = normalizedUri.absoluteString;
  for (NSString *manifestUrl in [EXEnvironment sharedEnvironment].allManifestUrls) {
    NSURL *normalizedManifestURL = [self _uriNormalizedForLinking:[NSURL URLWithString:manifestUrl]];
    if ([normalizedManifestURL.absoluteString isEqualToString:uriString]) {
      return YES;
    }
  }
  return NO;
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
        NSString *manifestUrlReleaseChannel = [[self class] _releaseChannelWithUrlComponents:manifestUrlComponents];
        NSString *urlToRouteReleaseChannel = [[self class] _releaseChannelWithUrlComponents:urlToRouteComponents];
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

+ (NSString *)_releaseChannelWithUrlComponents:(NSURLComponents *)urlComponents
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

@end
