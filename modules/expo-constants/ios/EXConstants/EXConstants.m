// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXConstants/EXConstants.h>
#import <EXConstantsInterface/EXConstantsInterface.h>

#import <UIKit/UIWebView.h>

@interface EXConstants ()

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
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!_webViewUserAgent) {
      UIWebView *webView = [[UIWebView alloc] init];
      _webViewUserAgent = [webView stringByEvaluatingJavaScriptFromString:@"navigator.userAgent"];
    }
    resolve(_webViewUserAgent);
  });
}

@end
