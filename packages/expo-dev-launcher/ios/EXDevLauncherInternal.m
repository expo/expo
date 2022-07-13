#import "EXDevLauncherInternal.h"

#import "EXDevLauncherController.h"
#import <React/RCTBridge.h>

#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)
// For cocoapods framework, the generated swift header will be inside EXDevLauncher module
#import <EXDevLauncher/EXDevLauncher-Swift.h>
#else
#import <EXDevLauncher-Swift.h>
#endif

@import EXDevMenu;

NSString *ON_NEW_DEEP_LINK_EVENT = @"expo.modules.devlauncher.onnewdeeplink";
NSString *LAUNCHER_NAVIGATION_STATE_KEY = @"expo.modules.devlauncher.navigation-state";

@implementation EXDevLauncherInternal

+ (NSString *)moduleName
{
  return @"EXDevLauncherInternal";
}

- (instancetype)init {
  if (self = [super init]) {
    [[EXDevLauncherController sharedInstance].pendingDeepLinkRegistry subscribe:self];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[ON_NEW_DEEP_LINK_EVENT];
}


- (void)invalidate
{
  [[EXDevLauncherController sharedInstance].pendingDeepLinkRegistry unsubscribe:self];
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSString *)findClientUrlScheme
{
  NSString *clientUrlScheme = nil;
  if ([[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"]) {
    NSArray *urlTypes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"];
    for (NSDictionary *urlType in urlTypes) {
      if (urlType[@"CFBundleURLSchemes"]) {
        NSArray *urlSchemes = urlType[@"CFBundleURLSchemes"];
        for (NSString *urlScheme in urlSchemes) {
          // Find a scheme with a prefix or fall back to the first scheme defined.
          if ([urlScheme hasPrefix:@"exp+"] || !clientUrlScheme) {
            clientUrlScheme = urlScheme;
          }
        }
      }
    }
  }
  return clientUrlScheme;
}

- (NSDictionary *)constantsToExport
{
//
  BOOL isDevice = YES;
#if TARGET_IPHONE_SIMULATOR
  isDevice = NO;
#endif
  return @{
    @"clientUrlScheme": self.findClientUrlScheme ?: [NSNull null],
    @"installationID": [EXDevLauncherController.sharedInstance.installationIDHelper getOrCreateInstallationID] ?: [NSNull null],
    @"isDevice": @(isDevice),
    @"updatesConfig": [[EXDevLauncherController sharedInstance] getUpdatesConfig],
  };
}

- (void)onNewPendingDeepLink:(NSURL *)deepLink
{
  [self sendEventWithName:ON_NEW_DEEP_LINK_EVENT body:deepLink.absoluteString];
}

- (NSURL *)sanitizeUrlString:(NSString *)urlString;
{
  NSString *sanitizedUrl = [urlString stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  
  NSURL *url = [NSURL URLWithString:sanitizedUrl];
  
  return url;
}

RCT_EXPORT_METHOD(getPendingDeepLink:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([EXDevLauncherController sharedInstance].pendingDeepLinkRegistry.pendingDeepLink.absoluteString);
}

RCT_EXPORT_METHOD(getCrashReport:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([[[EXDevLauncherErrorRegistry new] consumeException] toDict]);
}

RCT_EXPORT_METHOD(loadApp:(NSString *)urlString
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSURL *url = [self sanitizeUrlString:urlString];
  EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];

  if (!url) {
    return reject(@"ERR_DEV_LAUNCHER_INVALID_URL", @"Cannot parse the provided url.", nil);
  }
  
  [controller loadApp:url onSuccess:^{
    resolve(nil);
  } onError:^(NSError *error) {
    reject(@"ERR_DEV_LAUNCHER_CANNOT_LOAD_APP", error.localizedDescription, error);
  }];
}

RCT_EXPORT_METHOD(loadUpdate:(NSString *)updateUrlString
                  projectUrlString:(NSString *)projectUrlString
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];
  
  NSURL *updatesUrl = [self sanitizeUrlString:updateUrlString];
  NSURL *projectUrl = [self sanitizeUrlString:projectUrlString];
  
  if (!updatesUrl) {
    return reject(@"ERR_DEV_LAUNCHER_INVALID_URL", @"Cannot parse the provided url.", nil);
  }
  
  [controller loadApp:updatesUrl withProjectUrl:projectUrl onSuccess:^{
    resolve(nil);
  } onError:^(NSError *error) {
    reject(@"ERR_DEV_LAUNCHER_CANNOT_LOAD_APP", error.localizedDescription, error);
  }];
}

RCT_EXPORT_METHOD(getRecentlyOpenedApps:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([[EXDevLauncherController sharedInstance] recentlyOpenedApps]);
}

RCT_EXPORT_METHOD(clearRecentlyOpenedApps:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  [[EXDevLauncherController sharedInstance] clearRecentlyOpenedApps];
  resolve(nil);
}

RCT_EXPORT_METHOD(getBuildInfo:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *buildInfo = [[EXDevLauncherController sharedInstance] getBuildInfo];
  resolve(buildInfo);
}

RCT_EXPORT_METHOD(copyToClipboard:(NSString *)content
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  
  [[EXDevLauncherController sharedInstance] copyToClipboard:content];
  resolve(nil);
}

RCT_EXPORT_METHOD(loadFontsAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [[DevMenuManager shared] loadFonts];
  resolve(nil);
}

RCT_EXPORT_METHOD(saveNavigationState:(NSString *)serializedNavigationState
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [[NSUserDefaults standardUserDefaults] setObject:serializedNavigationState forKey:LAUNCHER_NAVIGATION_STATE_KEY];
   [[NSUserDefaults standardUserDefaults] synchronize];
  resolve(nil);
}

RCT_EXPORT_METHOD(getNavigationState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *serializedNavigationState = [[NSUserDefaults standardUserDefaults] objectForKey:LAUNCHER_NAVIGATION_STATE_KEY] ?: @"";
  resolve(serializedNavigationState);
}

RCT_EXPORT_METHOD(clearNavigationState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [[NSUserDefaults standardUserDefaults] removeObjectForKey:LAUNCHER_NAVIGATION_STATE_KEY];
  [[NSUserDefaults standardUserDefaults] synchronize];
  resolve(nil);
}

@end
