// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <SafariServices/SafariServices.h>

// Normally we would use RCT_EXTERN_MODULE macro, but in case of this internal module
// we don't want it to be automatically registered for all bridges in the entire app.
@interface DevMenuInternalModule : NSObject

@property (nonatomic, copy) RCTPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock redirectReject;
@property (nonatomic, strong) SFAuthenticationSession *authSession;

@end

@implementation DevMenuInternalModule (RCTExternModule)

RCT_EXTERN_METHOD(dispatchCallableAsync:(NSString *)callableId args:(NSDictionary *)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(fetchDataSourceAsync:(NSString *)dataSourceId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(hideMenu)
RCT_EXTERN_METHOD(setOnboardingFinished:(BOOL)finished)
RCT_EXTERN_METHOD(getSettingsAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setSettingsAsync:(NSDictionary *)dict resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(loadFontsAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(openDevMenuFromReactNative)
RCT_EXTERN_METHOD(onScreenChangeAsync:(NSString *)currentScreen resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAuthSchemeAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setSessionAsync:(NSDictionary *)session resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(restoreSessionAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)


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

@end
