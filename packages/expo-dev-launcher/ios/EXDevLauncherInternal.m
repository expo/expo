#import "EXDevLauncherInternal.h"

#import "EXDevLauncherController.h"
#import <React/RCTBridge.h>

#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)
// For cocoapods framework, the generated swift header will be inside EXDevLauncher module
#import <EXDevLauncher/EXDevLauncher-Swift.h>
#else
#import <EXDevLauncher-Swift.h>
#endif

NSString *ON_NEW_DEEP_LINK_EVENT = @"expo.modules.devlauncher.onnewdeeplink";

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
  return @{ @"clientUrlScheme": self.findClientUrlScheme ?: [NSNull null] };
}

- (void)onNewPendingDeepLink:(NSURL *)deepLink
{
  [self sendEventWithName:ON_NEW_DEEP_LINK_EVENT body:deepLink.absoluteString];
}

RCT_EXPORT_METHOD(getPendingDeepLink:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve([EXDevLauncherController sharedInstance].pendingDeepLinkRegistry.pendingDeepLink.absoluteString);
}

RCT_EXPORT_METHOD(loadApp:(NSString *)urlString
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *sanitizedUrl = [urlString stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

  EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];
  NSURL *url = [NSURL URLWithString:sanitizedUrl];

  if ([EXDevLauncherURLHelper isDevLauncherURL:url]) {
    url = [EXDevLauncherURLHelper getAppURLFromDevLauncherURL:url];
  }

  if (!url) {
    return reject(@"ERR_DEV_LAUNCHER_INVALID_URL", @"Cannot parse the provided url.", nil);
  }
  
  [controller loadApp:url onSuccess:^{
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

@end
