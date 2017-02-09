// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTUtils.h>
#import <SafariServices/SafariServices.h>
#import "EXWebBrowser.h"
#import "EXUnversioned.h"

@interface EXWebBrowser () <SFSafariViewControllerDelegate>

@end

NSString *EXWebBrowserErrorCode = @"EXWebBrowser";


@implementation EXWebBrowser
{
  RCTPromiseResolveBlock _redirectResolve;
  RCTPromiseRejectBlock _redirectReject;
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
  [RCTSharedApplication() setStatusBarStyle:UIStatusBarStyleDefault animated: YES];
  
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
  [RCTPresentedViewController() dismissViewControllerAnimated:true completion:^{
    _redirectResolve(@{
                       @"type": @"dismissed",
                       });
    [self flowDidFinish];
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
  [RCTSharedApplication() setStatusBarStyle:_initialStatusBarStyle animated:YES];
  _redirectResolve = nil;
  _redirectReject = nil;
}

@end
