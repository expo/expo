// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXConstants/ABI29_0_0EXConstants.h>
#import <ABI29_0_0EXConstantsInterface/ABI29_0_0EXConstantsInterface.h>

#import <UIKit/UIWebView.h>

@interface ABI29_0_0EXConstants ()

@property (nonatomic, strong) NSString *webViewUserAgent;
@property (nonatomic, weak) id<ABI29_0_0EXConstantsInterface> constantsService;

@end

@implementation ABI29_0_0EXConstants

ABI29_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExponentConstants";
}

- (void)setModuleRegistry:(ABI29_0_0EXModuleRegistry *)moduleRegistry
{
  _constantsService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI29_0_0EXConstantsInterface)];
}

- (NSDictionary *)constantsToExport
{
  return [_constantsService constants];
}

ABI29_0_0EX_EXPORT_METHOD_AS(getWebViewUserAgentAsync,
                    getWebViewUserAgentWithResolver:(ABI29_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI29_0_0EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!_webViewUserAgent) {
      UIWebView *webView = [[UIWebView alloc] init];
      _webViewUserAgent = [webView stringByEvaluatingJavaScriptFromString:@"navigator.userAgent"];
    }
    resolve(_webViewUserAgent);
  });
}

@end
