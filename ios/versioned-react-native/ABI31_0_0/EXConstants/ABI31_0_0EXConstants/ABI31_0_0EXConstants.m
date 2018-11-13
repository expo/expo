// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXConstants/ABI31_0_0EXConstants.h>
#import <ABI31_0_0EXConstantsInterface/ABI31_0_0EXConstantsInterface.h>

#import <UIKit/UIWebView.h>

@interface ABI31_0_0EXConstants ()

@property (nonatomic, strong) NSString *webViewUserAgent;
@property (nonatomic, weak) id<ABI31_0_0EXConstantsInterface> constantsService;

@end

@implementation ABI31_0_0EXConstants

ABI31_0_0EX_REGISTER_MODULE();

+ (const NSString *)exportedModuleName
{
  return @"ExponentConstants";
}

- (void)setModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry
{
  _constantsService = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI31_0_0EXConstantsInterface)];
}

- (NSDictionary *)constantsToExport
{
  return [_constantsService constants];
}

ABI31_0_0EX_EXPORT_METHOD_AS(getWebViewUserAgentAsync,
                    getWebViewUserAgentWithResolver:(ABI31_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI31_0_0EXPromiseRejectBlock)reject)
{
  __weak ABI31_0_0EXConstants *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong ABI31_0_0EXConstants *strongSelf = weakSelf;
    if (strongSelf) {
      if (!strongSelf.webViewUserAgent) {
        UIWebView *webView = [[UIWebView alloc] init];
        strongSelf.webViewUserAgent = [webView stringByEvaluatingJavaScriptFromString:@"navigator.userAgent"];
      }
      resolve(strongSelf.webViewUserAgent);
    }
  });
}

@end
