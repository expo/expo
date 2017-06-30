// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelLinkingManager.h"
#import "EXFrame.h"
#import "EXFrameReactAppManager.h"
#import "EXKernel.h"
#import "EXKernelReactAppManager.h"
#import "EXReactAppManager.h"
#import "EXShellManager.h"

#import <CocoaLumberjack/CocoaLumberjack.h>

NSNotificationName kEXKernelOpenUrlNotification = @"EXKernelOpenUrlNotification";

@implementation EXKernelLinkingManager

+ (instancetype)sharedInstance
{
  static EXKernelLinkingManager *theManager;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theManager) {
      theManager = [[EXKernelLinkingManager alloc] init];
    }
  });
  return theManager;
}

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_onKernelOpenUrl:)
                                                 name:kEXKernelOpenUrlNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)openUrl:(NSString *)urlString
{
  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) {
    DDLogInfo(@"Tried to route invalid url: %@", urlString);
    return;
  }
  NSString *urlToRoute = [[self class] uriTransformedForLinking:url].absoluteString;
  EXKernelBridgeRegistry *bridgeRegistry = [EXKernel sharedInstance].bridgeRegistry;
  
  // kernel bridge is our default handler for this url
  // because it can open a new bridge if we don't already have one.
  EXReactAppManager *destinationAppManager = bridgeRegistry.kernelAppManager;
  
  for (id bridge in [bridgeRegistry bridgeEnumerator]) {
    EXKernelBridgeRecord *bridgeRecord = [bridgeRegistry recordForBridge:bridge];
    if ([urlToRoute hasPrefix:[[self class] linkingUriForExperienceUri:bridgeRecord.appManager.frame.initialUri]]) {
      // this is a link into a bridge we already have running.
      // use this bridge as the link's destination instead of the kernel.
      destinationAppManager = bridgeRecord.appManager;
      break;
    }
  }
  
  if (destinationAppManager) {
    [[EXKernel sharedInstance] openUrl:urlToRoute onAppManager:destinationAppManager];
  }
}

#pragma mark - internal

- (void)_onKernelOpenUrl: (NSNotification *)notif
{
  [self openUrl:notif.userInfo[@"url"]];
}

#pragma mark - static link transforming logic

+ (NSString *)linkingUriForExperienceUri:(NSURL *)uri
{
  uri = [self uriTransformedForLinking:uri];
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

+ (NSURL *)uriTransformedForLinking:(NSURL *)uri
{
  if (!uri) {
    return nil;
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
  [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:URL.absoluteString];
  return YES;
}

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray *))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    [[EXKernel sharedInstance].serviceRegistry.linkingManager openUrl:@"userActivity.webpageURL.absoluteString"];
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
