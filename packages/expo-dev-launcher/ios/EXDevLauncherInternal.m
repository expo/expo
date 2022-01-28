#import "EXDevLauncherInternal.h"

#import "EXDevLauncherController.h"
#import <React/RCTBridge.h>
#import <SafariServices/SafariServices.h>

#if __has_include(<EXDevLauncher/EXDevLauncher-Swift.h>)
// For cocoapods framework, the generated swift header will be inside EXDevLauncher module
#import <EXDevLauncher/EXDevLauncher-Swift.h>
#else
#import <EXDevLauncher-Swift.h>
#endif

@import EXDevMenu;

NSString *ON_NEW_DEEP_LINK_EVENT = @"expo.modules.devlauncher.onnewdeeplink";
NSString *DEV_LAUNCHER_DEFAULT_SCHEME = @"expo-dev-launcher";

@interface EXDevLauncherInternal()

@property (nonatomic, copy) RCTPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock redirectReject;
@property (nonatomic, strong) SFAuthenticationSession *authSession;

@end

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
  BOOL isDevice = YES;
#if TARGET_IPHONE_SIMULATOR
  isDevice = NO;
#endif
  return @{
    @"clientUrlScheme": self.findClientUrlScheme ?: [NSNull null],
    @"installationID": [EXDevLauncherController.sharedInstance.installationIDHelper getOrCreateInstallationID] ?: [NSNull null],
    @"isDevice": @(isDevice)
  };
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


RCT_EXPORT_METHOD(openAuthSessionAsync:(NSString *)authURL
                           redirectURL:(NSString *)redirectURL
                              resolver:(RCTPromiseResolveBlock)resolve
                              rejecter:(RCTPromiseRejectBlock)reject)
{
  if (![self initializeWebBrowserWithResolver:resolve andRejecter:reject]) {
    return;
  }
  
  if (@available(iOS 11, *)) {
    NSURL *url = [[NSURL alloc] initWithString: authURL];
    __weak typeof(self) weakSelf = self;
    void (^completionHandler)(NSURL * _Nullable, NSError *_Nullable) = ^(NSURL* _Nullable callbackURL, NSError* _Nullable error) {
      __strong typeof(weakSelf) strongSelf = weakSelf;
      //check if flow didn't already finish
      if (strongSelf && strongSelf.redirectResolve) {
        if (!error) {
          NSString *url = callbackURL.absoluteString;
          strongSelf.redirectResolve(@{
                                         @"type" : @"success",
                                         @"url" : url,
                                         });
        } else {
          strongSelf.redirectResolve(@{
                                         @"type" : @"cancel",
                                         });
        }
        [strongSelf flowDidFinish];
      }
    };
    self.authSession = [[SFAuthenticationSession alloc] initWithURL:url
                                                  callbackURLScheme:redirectURL
                                                  completionHandler:completionHandler];
    [self.authSession start];
  } else {
    resolve(@{
              @"type" : @"cancel",
              @"message" : @"openAuthSessionAsync requires iOS 11 or greater"
              });
    [self flowDidFinish];
  }
}

- (void)flowDidFinish
{
  self.redirectResolve = nil;
  self.redirectReject = nil;
}


/**
 * Helper that is used in openBrowserAsync and openAuthSessionAsync
 */
- (BOOL)initializeWebBrowserWithResolver:(RCTPromiseResolveBlock)resolve andRejecter:(RCTPromiseRejectBlock)reject {
  
  if (self.redirectResolve) {
    reject(@"ERR_DEV_MENU_WEB_BROWSER", @"Another WebBrowser is already being presented.", nil);
    return NO;
  }
  self.redirectReject = reject;
  self.redirectResolve = resolve;
  return YES;
}

RCT_EXPORT_METHOD(getAuthSchemeAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSArray<NSDictionary*> *urlTypes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleURLTypes"];
  
  if (urlTypes != nil) {
    for (int i = 1; i <= urlTypes.count; i++) {
      NSDictionary *urlType = urlTypes[i];
      NSArray<NSString*> *schemes = urlType[@"CFBundleURLSchemes"];
      
      if (schemes != nil && schemes.count > 0) {
        resolve(schemes[0]);
        break;
        return;
      }
    }
  } else {
    resolve(DEV_LAUNCHER_DEFAULT_SCHEME);
  }
}

RCT_EXPORT_METHOD(setSessionAsync:(NSString *)session
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [[NSUserDefaults standardUserDefaults] setObject:session forKey:@"expo-session-secret"];
  [DevMenuManager.shared.expoApiClient setSessionSecret:session];
  resolve(nil);
}

RCT_EXPORT_METHOD(restoreSessionAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *session = [[NSUserDefaults standardUserDefaults] objectForKey:@"expo-session-secret"];
  
  if (session != nil) {
    [DevMenuManager.shared.expoApiClient setSessionSecret:session];
  }
  
  resolve(session);
}

@end
