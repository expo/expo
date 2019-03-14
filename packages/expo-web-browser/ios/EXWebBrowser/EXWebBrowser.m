// Copyright 2015-present 650 Industries. All rights reserved.

#import <SafariServices/SafariServices.h>
#import <EXWebBrowser/EXWebBrowser.h>

#import <UMCore/UMUtilities.h>
#import "UIColor+Expanded.h"


@interface EXWebBrowser () <SFSafariViewControllerDelegate>

@property (nonatomic, copy) UMPromiseResolveBlock redirectResolve;
@property (nonatomic, copy) UMPromiseRejectBlock redirectReject;
@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

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

UM_EXPORT_MODULE(ExpoWebBrowser)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

UM_EXPORT_METHOD_AS(openAuthSessionAsync,
                    openAuthSessionAsync:(NSString *)authURL
                    redirectURL:(NSString *)redirectURL
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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


UM_EXPORT_METHOD_AS(openBrowserAsync,
                    openBrowserAsync:(NSString *)authURL
                    withArguments:(NSDictionary *)arguments
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (![self initializeWebBrowserWithResolver:resolve andRejecter:reject]) {
    return;
  }

  NSURL *url = [[NSURL alloc] initWithString:authURL];
  SFSafariViewController *safariVC = nil;
  if (@available(iOS 11, *)) {
    SFSafariViewControllerConfiguration *config = [[SFSafariViewControllerConfiguration alloc] init];
    config.barCollapsingEnabled = [arguments[@"enableBarCollapsing"] boolValue];
    safariVC = [[SFSafariViewController alloc] initWithURL:url configuration:config];
  } else {
    safariVC = [[SFSafariViewController alloc] initWithURL:url];
  }
  
  NSString *toolbarColorKey = @"toolbarColor";
  if([[arguments allKeys] containsObject:toolbarColorKey]) {
    safariVC.preferredBarTintColor = [UIColor LOT_colorWithHexString:arguments[toolbarColorKey]];
  }
  NSString *controlsColorKey = @"controlsColor";
  if([[arguments allKeys] containsObject:controlsColorKey]) {
    safariVC.preferredControlTintColor = [UIColor LOT_colorWithHexString:arguments[controlsColorKey]];
  }
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

UM_EXPORT_METHOD_AS(dismissBrowser,
                    dismissBrowserWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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
      strongSelf.redirectResolve(@{
                                   @"type": @"dismiss",
                                   });
      [strongSelf flowDidFinish];
    }
  }];
}

UM_EXPORT_METHOD_AS(dismissAuthSession,
                    dismissAuthSessionWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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
- (BOOL)initializeWebBrowserWithResolver:(UMPromiseResolveBlock)resolve andRejecter:(UMPromiseRejectBlock)reject {
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

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
