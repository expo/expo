// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevLauncherAuth.h"
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

NSString *DEV_LAUNCHER_DEFAULT_SCHEME = @"expo-dev-launcher";

@interface EXDevLauncherAuth()

@property (nonatomic, copy) RCTPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock redirectReject;
@property (nonatomic, strong) SFAuthenticationSession *authSession;

@end

@implementation EXDevLauncherAuth

+ (NSString *)moduleName
{
  return @"EXDevLauncherAuth";
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
    for (int i = 0; i < urlTypes.count; i++) {
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
   resolve(nil);
 }

 RCT_EXPORT_METHOD(restoreSessionAsync:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
 {
   NSString *session = [[NSUserDefaults standardUserDefaults] objectForKey:@"expo-session-secret"];
   resolve(session);
 }

@end
