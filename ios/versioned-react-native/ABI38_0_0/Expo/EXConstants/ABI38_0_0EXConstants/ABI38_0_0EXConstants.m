// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXConstants/ABI38_0_0EXConstants.h>
#import <ABI38_0_0UMConstantsInterface/ABI38_0_0UMConstantsInterface.h>

#import <WebKit/WKWebView.h>

@interface ABI38_0_0EXConstants () {
  WKWebView *webView;
}

@property (nonatomic, strong) NSString *webViewUserAgent;
@property (nonatomic, weak) id<ABI38_0_0UMConstantsInterface> constantsService;

@end

@implementation ABI38_0_0EXConstants

ABI38_0_0UM_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExponentConstants";
}

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  _constantsService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI38_0_0UMConstantsInterface)];
}

- (NSDictionary *)constantsToExport
{
  return [_constantsService constants];
}

ABI38_0_0UM_EXPORT_METHOD_AS(getWebViewUserAgentAsync,
                    getWebViewUserAgentWithResolver:(ABI38_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  __weak ABI38_0_0EXConstants *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong ABI38_0_0EXConstants *strongSelf = weakSelf;
    if (strongSelf) {
      if (!strongSelf.webViewUserAgent) {
        // We need to retain the webview because it runs an async task.
        strongSelf->webView = [[WKWebView alloc] init];

        [strongSelf->webView evaluateJavaScript:@"window.navigator.userAgent;" completionHandler:^(id _Nullable result, NSError * _Nullable error) {
          if (error) {
            reject(@"ERR_CONSTANTS", error.localizedDescription, error);
            return;
          }
          
          strongSelf.webViewUserAgent = [NSString stringWithFormat:@"%@", result];
          resolve(ABI38_0_0UMNullIfNil(strongSelf.webViewUserAgent));
          // Destroy the webview now that it's task is complete.
          strongSelf->webView = nil;
        }];
      } else {
        resolve(ABI38_0_0UMNullIfNil(strongSelf.webViewUserAgent));
      }
    }
  });
}

@end
