// Copyright 2015-present 650 Industries. All rights reserved.

#import <SafariServices/SafariServices.h>
#import <EXWebBrowser/EXWebBrowserDelegate.h>

#import <UMCore/UMUtilities.h>

static NSString* const WebBrowserErrorCode = @"WebBrowser";
static NSString* const WebBrowserControlsColorKey = @"controlsColor";
static NSString* const WebBrowserToolbarColorKey = @"toolbarColor";

@interface EXWebBrowserDelegate () <SFSafariViewControllerDelegate>

@property (nonatomic, copy) UMPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) UMPromiseRejectBlock redirectReject;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"
@property (nonatomic, strong) SFAuthenticationSession *authSession;
#pragma clang diagnostic pop

@end

@implementation EXWebBrowserDelegate
{
  UIStatusBarStyle _initialStatusBarStyle;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void) openAuthSessionAsyncWithUrl:(NSString *)authURL
                    withRedirectURL:(NSString *)redirectURL
                    withResolver:(UMPromiseResolveBlock)resolve
                    withRejecter:(UMPromiseRejectBlock)reject
{
  [self initializeWebBrowserWithResolver:resolve andRejecter:reject];


  if (@available(iOS 11, *)) {
    NSURL *url = [[NSURL alloc] initWithString: authURL];
    __weak typeof(self) weakSelf = self;
    void (^completionHandler)(NSURL * _Nullable, NSError *_Nullable) = ^(NSURL* _Nullable callbackURL, NSError* _Nullable error) {
      __strong typeof(weakSelf) strongSelf = weakSelf;
      if (strongSelf) {
        if (!error) {
          NSString *url = callbackURL.absoluteString;
          strongSelf->_redirectResolve(@{
                                         @"type" : @"success",
                                         @"url" : url,
                                         });
        } else {
          strongSelf->_redirectResolve(@{
                                         @"type" : @"cancel",
                                         });
        }
        [strongSelf flowDidFinish];
      }
    };
    _authSession = [[SFAuthenticationSession alloc]
                    initWithURL:url
                    callbackURLScheme:redirectURL
                    completionHandler:completionHandler];
    [_authSession start];
  } else {
    resolve(@{
              @"type" : @"cancel",
              @"message" : @"openAuthSessionAsync requires iOS 11 or greater"
              });
    [self flowDidFinish];
  }
}


- (void) openBrowserAsyncWithUrl:(NSString *)authURL
                    withArguments:(NSDictionary *)arguments
                    withResolver:(UMPromiseResolveBlock)resolve
                    withRejecter:(UMPromiseRejectBlock)reject
{
  if (![self initializeWebBrowserWithResolver:resolve andRejecter:reject]) {
    return;
  }

  NSURL *url = [[NSURL alloc] initWithString:authURL];
  BOOL readerMode = [arguments[@"readerMode"] boolValue];
  BOOL enableBarCollapsing = [arguments[@"enableBarCollapsing"] boolValue];
  SFSafariViewController *safariVC = nil;
  if (@available(iOS 11, *)) {
    SFSafariViewControllerConfiguration *config = [[SFSafariViewControllerConfiguration alloc] init];
    config.barCollapsingEnabled = enableBarCollapsing;
    config.entersReaderIfAvailable = readerMode;
    safariVC = [[SFSafariViewController alloc] initWithURL:url configuration:config];
  } else {
    safariVC = [[SFSafariViewController alloc] initWithURL:url entersReaderIfAvailable:readerMode];
  }

  if (@available(iOS 11.0, *)) {
    NSString *dismissButtonStyle = [arguments valueForKey:@"dismissButtonStyle"];
    if ([@"done" isEqualToString:dismissButtonStyle]) {
      safariVC.dismissButtonStyle = SFSafariViewControllerDismissButtonStyleDone;
    }
    else if ([@"close" isEqualToString:dismissButtonStyle]) {
      safariVC.dismissButtonStyle = SFSafariViewControllerDismissButtonStyleClose;
    }
    else if ([@"cancel" isEqualToString:dismissButtonStyle]) {
      safariVC.dismissButtonStyle = SFSafariViewControllerDismissButtonStyleCancel;
    }
  }

  if([[arguments allKeys] containsObject:WebBrowserToolbarColorKey]) {
    safariVC.preferredBarTintColor = [EXWebBrowserDelegate convertHexColorString:arguments[WebBrowserToolbarColorKey]];
  }
  if([[arguments allKeys] containsObject:WebBrowserControlsColorKey]) {
    safariVC.preferredControlTintColor = [EXWebBrowserDelegate convertHexColorString:arguments[WebBrowserControlsColorKey]];
  }
  safariVC.delegate = self;
  // By setting the modal presentation style to OverFullScreen, we disable the "Swipe to dismiss"
  // gesture that is causing a bug where sometimes `safariViewControllerDidFinish` is not called.
  // There are bugs filed already about it on OpenRadar.
  [safariVC setModalPresentationStyle: UIModalPresentationOverFullScreen];

  // This is a hack to present the SafariViewController modally
  UINavigationController *safariHackVC = [[UINavigationController alloc] initWithRootViewController:safariVC];
  [safariHackVC setNavigationBarHidden:true animated:false];
  [safariHackVC setModalPresentationStyle: UIModalPresentationOverFullScreen];

  UIViewController *currentViewController = [UIApplication sharedApplication].keyWindow.rootViewController;
  while (currentViewController.presentedViewController) {
    currentViewController = currentViewController.presentedViewController;
  }
  [currentViewController presentViewController:safariHackVC animated:true completion:nil];
}

-(void) dismissBrowser:(UMPromiseResolveBlock)resolve
                    withRejecter:(UMPromiseRejectBlock)reject
{
  __weak typeof(self) weakSelf = self;
  UIViewController *currentViewController = [UIApplication sharedApplication].keyWindow.rootViewController;
  while (currentViewController.presentedViewController) {
    currentViewController = currentViewController.presentedViewController;
  }
  [currentViewController dismissViewControllerAnimated:YES completion:^{
    resolve(nil);
    __strong typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      if (strongSelf.redirectResolve) {
        strongSelf.redirectResolve(@{
          @"type": @"dismiss",
        });
      }
      [strongSelf flowDidFinish];
    }
  }];
}

-(void) dismissAuthSession:(UMPromiseResolveBlock)resolve
                    withRejecter:(UMPromiseRejectBlock)reject
{
  if (@available(iOS 11, *)) {
    [_authSession cancel];
    resolve(nil);
    if (_redirectResolve) {
      _redirectResolve(@{
                         @"type": @"dismiss"
                         });

      [self flowDidFinish];
    }
  } else {
    [self dismissAuthSession:resolve withRejecter:reject];
  }
}

/**
 * Helper that is used in openBrowserAsync and openAuthSessionAsync
 */
- (BOOL)initializeWebBrowserWithResolver:(UMPromiseResolveBlock)resolve andRejecter:(UMPromiseRejectBlock)reject {
  if (_redirectResolve) {
    reject(WebBrowserErrorCode, @"Another WebBrowser is already being presented.", nil);
    return NO;
  }
  _redirectReject = reject;
  _redirectResolve = resolve;

  _initialStatusBarStyle = [UIApplication sharedApplication].statusBarStyle;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleDefault
                                   animated:YES];
#pragma clang diagnostic pop
  return YES;
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
  [[UIApplication sharedApplication] setStatusBarStyle:_initialStatusBarStyle animated:YES];
#pragma clang diagnostic pop
  _redirectResolve = nil;
  _redirectReject = nil;
}

+ (UIColor *)convertHexColorString:(NSString *)stringToConvert {
  NSString *strippedString = [stringToConvert stringByReplacingOccurrencesOfString:@"#" withString:@""];
  NSScanner *scanner = [NSScanner scannerWithString:strippedString];
  unsigned hexNum;
  if (![scanner scanHexInt:&hexNum]) return nil;
  return [EXWebBrowserDelegate colorWithRGBHex:hexNum];
}

+ (UIColor *)colorWithRGBHex:(UInt32)hex {
  int r = (hex >> 16) & 0xFF;
  int g = (hex >> 8) & 0xFF;
  int b = (hex) & 0xFF;

  return [UIColor colorWithRed:r / 255.0f
                         green:g / 255.0f
                          blue:b / 255.0f
                         alpha:1.0f];
}

@end
