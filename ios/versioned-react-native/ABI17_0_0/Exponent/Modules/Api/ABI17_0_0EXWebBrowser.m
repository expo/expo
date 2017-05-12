// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>
#import <SafariServices/SafariServices.h>
#import "ABI17_0_0EXWebBrowser.h"
#import "ABI17_0_0EXUnversioned.h"

@interface ABI17_0_0EXWebBrowser () <SFSafariViewControllerDelegate>

@property (nonatomic, copy) ABI17_0_0RCTPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) ABI17_0_0RCTPromiseRejectBlock redirectReject;

@end

NSString *ABI17_0_0EXWebBrowserErrorCode = @"ABI17_0_0EXWebBrowser";


@implementation ABI17_0_0EXWebBrowser
{
  UIStatusBarStyle _initialStatusBarStyle;
}

ABI17_0_0RCT_EXPORT_MODULE(ExponentWebBrowser)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI17_0_0RCT_EXPORT_METHOD(openBrowserAsync:(NSString *)authURL
                          resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                          rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  if (_redirectResolve) {
    reject(ABI17_0_0EXWebBrowserErrorCode, @"Another WebBrowser is already being presented.", nil);
    return;
  }
  _redirectReject = reject;
  _redirectResolve = resolve;
  _initialStatusBarStyle = ABI17_0_0RCTSharedApplication().statusBarStyle;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [ABI17_0_0RCTSharedApplication() setStatusBarStyle:UIStatusBarStyleDefault animated: YES];
#pragma clang diagnostic pop
  
  if ([SFSafariViewController class]) {
    // Safari View Controller to authorize request
    NSURL *url = [[NSURL alloc] initWithString:authURL];
    SFSafariViewController *safariVC = [[SFSafariViewController alloc] initWithURL:url entersReaderIfAvailable:NO];
    safariVC.delegate = self;
    
    // By setting the modal presentation style to OverFullScreen, we disable the "Swipe to dismiss"
    // gesture that is causing a bug where sometimes `safariViewControllerDidFinish` is not called.
    // There are bugs filed already about it on OpenRadar.
    [safariVC setModalPresentationStyle: UIModalPresentationOverFullScreen];

    // This is a hack to present the SafariViewController modally
    UINavigationController *safariHackVC = [[UINavigationController alloc] initWithRootViewController:safariVC];
    [safariHackVC setNavigationBarHidden:true animated:false];
    [ABI17_0_0RCTPresentedViewController() presentViewController:safariHackVC animated:true completion:nil];
  } else {
    // Opens Safari Browser when SFSafariViewController is not available (iOS 8)
    [ABI17_0_0RCTSharedApplication() openURL:[NSURL URLWithString:authURL]];
  }
}

ABI17_0_0RCT_EXPORT_METHOD(dismissBrowser) {
  __weak typeof(self) weakSelf = self;
  [ABI17_0_0RCTPresentedViewController() dismissViewControllerAnimated:YES completion:^{
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
  [ABI17_0_0RCTSharedApplication() setStatusBarStyle:_initialStatusBarStyle animated:YES];
#pragma clang diagnostic pop
  _redirectResolve = nil;
  _redirectReject = nil;
}

@end
