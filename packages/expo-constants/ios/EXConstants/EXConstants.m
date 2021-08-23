// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXConstants/EXConstants.h>
#import <ExpoModulesCore/EXConstantsInterface.h>

#import <WebKit/WKWebView.h>

@interface EXConstants () {
  WKWebView *webView;
}

@property (nonatomic, strong) NSString *webViewUserAgent;
@property (nonatomic, weak) id<EXConstantsInterface> constantsService;

@end

@implementation EXConstants

EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExponentConstants";
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _constantsService = [moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
}

- (NSDictionary *)constantsToExport
{
  return [_constantsService constants];
}

EX_EXPORT_METHOD_AS(getWebViewUserAgentAsync,
                    getWebViewUserAgentWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  __weak EXConstants *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong EXConstants *strongSelf = weakSelf;
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
          resolve(EXNullIfNil(strongSelf.webViewUserAgent));
          // Destroy the webview now that it's task is complete.
          strongSelf->webView = nil;
        }];
      } else {
        resolve(EXNullIfNil(strongSelf.webViewUserAgent));
      }
    }
  });
}

@end
