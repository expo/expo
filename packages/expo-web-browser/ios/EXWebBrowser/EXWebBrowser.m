// Copyright 2015-present 650 Industries. All rights reserved.

#import <SafariServices/SafariServices.h>
#import <EXWebBrowser/EXWebBrowser.h>
#import <EXCore/EXUtilities.h>

@interface EXWebBrowser () <SFSafariViewControllerDelegate>

@property (nonatomic, copy) EXPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) EXPromiseRejectBlock redirectReject;
@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"
@property (nonatomic, strong) SFAuthenticationSession *authSession;
#pragma clang diagnostic pop

@end

NSString *EXWebBrowserErrorCode = @"EXWebBrowser";


@implementation EXWebBrowser
{
  UIStatusBarStyle _initialStatusBarStyle;
}

EX_EXPORT_MODULE(ExpoWebBrowser)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

EX_EXPORT_METHOD_AS(openAuthSessionAsync,
                    openAuthSessionAsync:(NSString *)authURL
                    redirectURL:(NSString *)redirectURL
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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


EX_EXPORT_METHOD_AS(openBrowserAsync,
                    openBrowserAsync:(NSString *)authURL
                    withArguments:(NSDictionary *)arguments
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (![self initializeWebBrowserWithResolver:resolve andRejecter:reject]) {
    return;
  }

  NSURL *url = [[NSURL alloc] initWithString:authURL];
  SFSafariViewController *safariVC = NULL;
  if(@available(iOS 11, *)) {
    SFSafariViewControllerConfiguration *config = [[SFSafariViewControllerConfiguration alloc]init];
    bool enabled = false;
    NSString *collapseBarKey = @"enableBarCollapsing";
    if([[arguments allKeys] containsObject:collapseBarKey]) {
      enabled = [arguments[collapseBarKey] boolValue];
    }
    config.barCollapsingEnabled = enabled;
    safariVC = [[SFSafariViewController alloc] initWithURL:url configuration:config];
  }
  // Safari View Controller to authorize request
  safariVC = [[SFSafariViewController alloc] initWithURL:url];
  safariVC.delegate = self;

  // By setting the modal presentation style to OverFullScreen, we disable the "Swipe to dismiss"
  // gesture that is causing a bug where sometimes `safariViewControllerDidFinish` is not called.
  // There are bugs filed already about it on OpenRadar.
  [safariVC setModalPresentationStyle: UIModalPresentationOverFullScreen];

  // This is a hack to present the SafariViewController modally
  UINavigationController *safariHackVC = [[UINavigationController alloc] initWithRootViewController:safariVC];
  [safariHackVC setNavigationBarHidden:true animated:false];

  UIViewController *currentViewController = [UIApplication sharedApplication].keyWindow.rootViewController;
  while (currentViewController.presentedViewController) {
    currentViewController = currentViewController.presentedViewController;
  }
  [currentViewController presentViewController:safariHackVC animated:true completion:nil];
}

EX_EXPORT_METHOD_AS(dismissBrowser,
                    dismissBrowserWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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
      self.redirectResolve(@{
                                   @"type": @"dismiss",
                                   });
      [strongSelf flowDidFinish];
    }
  }];
}

EX_EXPORT_METHOD_AS(dismissAuthSession,
                    dismissAuthSessionWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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
    [self dismissAuthSessionWithResolver:resolve rejecter:reject];
  }
}

/**
 * Helper that is used in openBrowserAsync and openAuthSessionAsync
 */
- (BOOL)initializeWebBrowserWithResolver:(EXPromiseResolveBlock)resolve andRejecter:(EXPromiseRejectBlock)reject {
  if (_redirectResolve) {
    reject(EXWebBrowserErrorCode, @"Another WebBrowser is already being presented.", nil);
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

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
