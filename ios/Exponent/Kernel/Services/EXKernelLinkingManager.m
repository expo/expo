// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelLinkingManager.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernel.h"
#import "EXKernelReactAppManager.h"
#import "EXReactAppManager.h"
#import "EXShellManager.h"
#import "EXVersions.h"

#import <CocoaLumberjack/CocoaLumberjack.h>
#import <React/RCTBridge+Private.h>

NSNotificationName kEXKernelOpenUrlNotification = @"EXKernelOpenUrlNotification";
NSNotificationName kEXKernelRefreshForegroundTaskNotification = @"EXKernelRefreshForegroundTaskNotification";

@interface EXKernelLinkingManager ()

@property (nonatomic, weak) EXReactAppManager *appManagerToRefresh;

@end

@implementation EXKernelLinkingManager

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_onKernelOpenUrl:)
                                                 name:kEXKernelOpenUrlNotification
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_onRefreshForegroundTaskNotif:)
                                                 name:kEXKernelRefreshForegroundTaskNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)openUrl:(NSString *)urlString isUniversalLink:(BOOL)isUniversalLink
{
  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    DDLogInfo(@"Tried to route invalid url: %@", urlString);
    return;
  }
  EXKernelBridgeRegistry *bridgeRegistry = [EXKernel sharedInstance].bridgeRegistry;

  // kernel bridge is our default handler for this url
  // because it can open a new bridge if we don't already have one.
  EXReactAppManager *destinationAppManager;
  NSString *urlToRoute;

  if (isUniversalLink && [EXShellManager sharedInstance].isShell) {
    // Find the app manager for the shell app.
    urlToRoute = url.absoluteString;
    for (id bridge in [bridgeRegistry bridgeEnumerator]) {
      EXKernelBridgeRecord *bridgeRecord = [bridgeRegistry recordForBridge:bridge];
      if ([bridgeRecord.appManager.frame.initialProps[@"shell"] boolValue]) {
        destinationAppManager = bridgeRecord.appManager;
        break;
      }
    }
  } else {
    urlToRoute = [[self class] uriTransformedForLinking:url isUniversalLink:isUniversalLink].absoluteString;
    destinationAppManager = bridgeRegistry.kernelAppManager;

    for (id bridge in [bridgeRegistry bridgeEnumerator]) {
      EXKernelBridgeRecord *bridgeRecord = [bridgeRegistry recordForBridge:bridge];
      if ([urlToRoute hasPrefix:[[self class] linkingUriForExperienceUri:bridgeRecord.appManager.frame.initialUri]]) {
        // this is a link into a bridge we already have running.
        // use this bridge as the link's destination instead of the kernel.
        destinationAppManager = bridgeRecord.appManager;
        break;
      }
    }

  }

  if (destinationAppManager) {
    [[EXKernel sharedInstance] openUrl:urlToRoute onAppManager:destinationAppManager];
  }
}

- (void)refreshForegroundTask
{
  _appManagerToRefresh = [EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundAppManager;
  [[EXKernel sharedInstance] dispatchKernelJSEvent:@"refresh" body:@{} onSuccess:nil onFailure:nil];
}

- (BOOL)isRefreshExpectedForAppManager:(id)manager
{
  EXKernelBridgeRegistry *bridgeRegistry = [EXKernel sharedInstance].bridgeRegistry;
  
  // consume this reference, don't reuse
  EXReactAppManager *appManagerToRefresh = _appManagerToRefresh;
  _appManagerToRefresh = nil;

  return ([EXShellManager sharedInstance].isShell
          && manager
          && manager == appManagerToRefresh
          && manager != bridgeRegistry.kernelAppManager
          && manager == bridgeRegistry.lastKnownForegroundAppManager);
}

#pragma mark - scoped module delegate

- (void)linkingModule:(__unused id)linkingModule didOpenUrl:(NSString *)url
{
  [self openUrl:url isUniversalLink:NO];
}

- (BOOL)linkingModule:(__unused id)linkingModule shouldOpenExpoUrl:(NSURL *)url
{
  // do not attempt to route internal exponent links at all if we're in a detached exponent app.
  NSDictionary *versionsConfig = [EXVersions sharedInstance].versions;
  if (versionsConfig && versionsConfig[@"detachedNativeVersions"]) {
    return NO;
  }
  
  // we don't need to explicitly include a shell app custom URL scheme here
  // because the default iOS linking behavior will still hand those links back to Exponent.
  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:YES];
  if (components) {
    return ([components.scheme isEqualToString:@"exp"] ||
            [components.scheme isEqualToString:@"exps"] ||
            [components.host isEqualToString:@"exp.host"] ||
            [components.host hasSuffix:@".exp.host"]
            );
  }
  return NO;
}

- (void)utilModuleDidSelectReload:(id)scopedUtilModule
{
  [self _refreshForegroundTaskAndValidateBridge:((EXScopedBridgeModule *)scopedUtilModule).bridge];
}

#pragma mark - internal

- (void)_onRefreshForegroundTaskNotif: (NSNotification *)notif
{
  [self _refreshForegroundTaskAndValidateBridge:notif.userInfo[@"bridge"]];
}

- (void)_onKernelOpenUrl: (NSNotification *)notif
{
  [self openUrl:notif.userInfo[@"url"] isUniversalLink:NO];
}

- (void)_refreshForegroundTaskAndValidateBridge:(id)bridge
{
  if ([bridge respondsToSelector:@selector(parentBridge)]) {
    bridge = [bridge parentBridge];
  }
  if (bridge == [EXKernel sharedInstance].bridgeRegistry.kernelAppManager.reactBridge) {
    DDLogError(@"Can't use ExponentUtil.reload() on the kernel bridge. Use RN dev tools to reload the bundle.");
    return;
  }
  if (bridge == [EXKernel sharedInstance].bridgeRegistry.lastKnownForegroundBridge) {
    // only the foreground task is allowed to force a reload
    [self refreshForegroundTask];
  }
}

#pragma mark - static link transforming logic

+ (NSString *)linkingUriForExperienceUri:(NSURL *)uri
{
  uri = [self uriTransformedForLinking:uri isUniversalLink:NO];
  NSURLComponents *components = [NSURLComponents componentsWithURL:uri resolvingAgainstBaseURL:YES];

  // if the provided uri is the shell app manifest uri,
  // this should have been transformed into customscheme://+deep-link
  // and then all we do here is strip off the deep-link part, leaving +.
  if ([EXShellManager sharedInstance].isShell && [[EXShellManager sharedInstance] isShellUrlScheme:components.scheme]) {
    return [NSString stringWithFormat:@"%@://+", components.scheme];
  }

  NSMutableString* path = [NSMutableString stringWithString:components.path];

  // if the uri already contains a deep link, strip everything specific to that
  NSRange deepLinkRange = [path rangeOfString:@"+"];
  if (deepLinkRange.length > 0) {
    path = [[path substringToIndex:deepLinkRange.location] mutableCopy];
  }

  if (path.length == 0 || [path characterAtIndex:path.length - 1] != '/') {
    [path appendString:@"/"];
  }
  [path appendString:@"+"];
  components.path = path;

  components.query = nil;

  return [components string];
}

+ (NSURL *)uriTransformedForLinking:(NSURL *)uri isUniversalLink:(BOOL)isUniversalLink
{
  if (!uri) {
    return nil;
  }
  
  // If the initial uri is a universal link in a shell app don't touch it.
  if ([EXShellManager sharedInstance].isShell && isUniversalLink) {
    return uri;
  }

  NSURL *normalizedUri = [self _uriNormalizedForLinking:uri];

  if ([EXShellManager sharedInstance].isShell && [EXShellManager sharedInstance].hasUrlScheme) {
    // if the provided uri is the shell app manifest uri,
    // transform this into customscheme://+deep-link
    if ([self _isShellManifestUrl:normalizedUri]) {
      NSString *uriString = normalizedUri.absoluteString;
      NSRange deepLinkRange = [uriString rangeOfString:@"+"];
      NSString *deepLink = @"";
      if (deepLinkRange.length > 0) {
        deepLink = [uriString substringFromIndex:deepLinkRange.location];
      }
      NSString *result = [NSString stringWithFormat:@"%@://%@", [EXShellManager sharedInstance].urlScheme, deepLink];
      return [NSURL URLWithString:result];
    }
  }
  return normalizedUri;
}

+ (NSURL *)_uriNormalizedForLinking: (NSURL *)uri
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:uri resolvingAgainstBaseURL:YES];

  if ([EXShellManager sharedInstance].isShell && [[EXShellManager sharedInstance] isShellUrlScheme:components.scheme]) {
    // if we're a shell and this uri had the shell scheme, leave it alone.
  } else {
    if ([components.scheme isEqualToString:@"https"]) {
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

+ (BOOL)_isShellManifestUrl: (NSURL *)normalizedUri
{
  NSString *uriString = normalizedUri.absoluteString;
  for (NSString *shellManifestUrl in [EXShellManager sharedInstance].allManifestUrls) {
    NSURL *normalizedShellManifestURL = [self _uriNormalizedForLinking:[NSURL URLWithString:shellManifestUrl]];
    if ([normalizedShellManifestURL.absoluteString isEqualToString:uriString]) {
      return YES;
    }
  }
  return NO;
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
