// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTUtils.h>
#import <SafariServices/SafariServices.h>
#import "EXWebBrowser.h"
#import "EXUnversioned.h"

@interface EXWebBrowser () <SFSafariViewControllerDelegate>

@property (nonatomic, copy) RCTPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) RCTPromiseRejectBlock redirectReject;

@end

NSString *EXWebBrowserErrorCode = @"EXWebBrowser";


@implementation EXWebBrowser
{
  UIStatusBarStyle _initialStatusBarStyle;
}

RCT_EXPORT_MODULE(ExponentWebBrowser)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(openBrowserAsync:(NSString *)authURL
                          resolver:(RCTPromiseResolveBlock)resolve
                          rejecter:(RCTPromiseRejectBlock)reject)
{
  if (_redirectResolve) {
    reject(EXWebBrowserErrorCode, @"Another WebBrowser is already being presented.", nil);
    return;
  }
  _redirectReject = reject;
  _redirectResolve = resolve;
  _initialStatusBarStyle = RCTSharedApplication().statusBarStyle;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [RCTSharedApplication() setStatusBarStyle:UIStatusBarStyleDefault animated: YES];
#pragma clang diagnostic pop
  
  if ([SFSafariViewController class]) {
    // Safari View Controller to authorize request
    NSURL *url = [[NSURL alloc] initWithString:authURL];
    SFSafariViewController *safariVC = [[SFSafariViewController alloc] initWithURL:url entersReaderIfAvailable:NO];
    safariVC.delegate = self;

    // This is a hack to present the SafariViewController modally
    UINavigationController *safariHackVC = [[UINavigationController alloc] initWithRootViewController:safariVC];
    [safariHackVC setNavigationBarHidden:true animated:false];
    [RCTPresentedViewController() presentViewController:safariHackVC animated:true completion:nil];
  } else {
    // Opens Safari Browser when SFSafariViewController is not available (iOS 8)
    [RCTSharedApplication() openURL:[NSURL URLWithString:authURL]];
  }
}

RCT_EXPORT_METHOD(dismissBrowser) {
  __weak typeof(self) weakSelf = self;
  [RCTPresentedViewController() dismissViewControllerAnimated:YES completion:^{
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      strongSelf.redirectResolve(@{
                         @"type": @"dismissed",
                         });
      [strongSelf flowDidFinish];
    }
  }];
}


/**
 * Called when the user dismisses the SFVC without logging in.
 */
- (void)safariViewControllerDidFinish:(SFSafariViewController *)controller
{
  _redirectResolve(@{
    @"type": @"cancel",
  });
  [self flowDidFinish];
}

-(void)flowDidFinish
{
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [RCTSharedApplication() setStatusBarStyle:_initialStatusBarStyle animated:YES];
#pragma clang diagnostic pop
  _redirectResolve = nil;
  _redirectReject = nil;
}

@end
