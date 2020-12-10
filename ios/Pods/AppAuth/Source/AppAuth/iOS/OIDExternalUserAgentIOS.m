/*! @file OIDExternalUserAgentIOS.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2016 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import <TargetConditionals.h>

#if TARGET_OS_IOS || TARGET_OS_MACCATALYST

#import "OIDExternalUserAgentIOS.h"

#import <SafariServices/SafariServices.h>
#import <AuthenticationServices/AuthenticationServices.h>

#import "OIDErrorUtilities.h"
#import "OIDExternalUserAgentSession.h"
#import "OIDExternalUserAgentRequest.h"

#if !TARGET_OS_MACCATALYST

NS_ASSUME_NONNULL_BEGIN

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
@interface OIDExternalUserAgentIOS ()<SFSafariViewControllerDelegate, ASWebAuthenticationPresentationContextProviding>
@end
#else
@interface OIDExternalUserAgentIOS ()<SFSafariViewControllerDelegate>
@end
#endif

@implementation OIDExternalUserAgentIOS {
  UIViewController *_presentingViewController;

  BOOL _externalUserAgentFlowInProgress;
  __weak id<OIDExternalUserAgentSession> _session;
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"
  __weak SFSafariViewController *_safariVC;
  SFAuthenticationSession *_authenticationVC;
  ASWebAuthenticationSession *_webAuthenticationVC;
#pragma clang diagnostic pop
}

- (nullable instancetype)init {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wnonnull"
  return [self initWithPresentingViewController:nil];
#pragma clang diagnostic pop
}

- (nullable instancetype)initWithPresentingViewController:
    (UIViewController *)presentingViewController {
  self = [super init];
  if (self) {
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
    NSAssert(presentingViewController != nil,
             @"presentingViewController cannot be nil on iOS 13");
#endif // __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
    
    _presentingViewController = presentingViewController;
  }
  return self;
}

- (BOOL)presentExternalUserAgentRequest:(id<OIDExternalUserAgentRequest>)request
                                session:(id<OIDExternalUserAgentSession>)session {
  if (_externalUserAgentFlowInProgress) {
    // TODO: Handle errors as authorization is already in progress.
    return NO;
  }

  _externalUserAgentFlowInProgress = YES;
  _session = session;
  BOOL openedUserAgent = NO;
  NSURL *requestURL = [request externalUserAgentRequestURL];

  // iOS 12 and later, use ASWebAuthenticationSession
  if (@available(iOS 12.0, *)) {
    // ASWebAuthenticationSession doesn't work with guided access (rdar://40809553)
    if (!UIAccessibilityIsGuidedAccessEnabled()) {
      __weak OIDExternalUserAgentIOS *weakSelf = self;
      NSString *redirectScheme = request.redirectScheme;
      ASWebAuthenticationSession *authenticationVC =
          [[ASWebAuthenticationSession alloc] initWithURL:requestURL
                                        callbackURLScheme:redirectScheme
                                        completionHandler:^(NSURL * _Nullable callbackURL,
                                                            NSError * _Nullable error) {
        __strong OIDExternalUserAgentIOS *strongSelf = weakSelf;
        if (!strongSelf) {
            return;
        }
        strongSelf->_webAuthenticationVC = nil;
        if (callbackURL) {
          [strongSelf->_session resumeExternalUserAgentFlowWithURL:callbackURL];
        } else {
          NSError *safariError =
              [OIDErrorUtilities errorWithCode:OIDErrorCodeUserCanceledAuthorizationFlow
                               underlyingError:error
                                   description:nil];
          [strongSelf->_session failExternalUserAgentFlowWithError:safariError];
        }
      }];
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
      if (@available(iOS 13.0, *)) {
          authenticationVC.presentationContextProvider = self;
      }
#endif
      _webAuthenticationVC = authenticationVC;
      openedUserAgent = [authenticationVC start];
    }
  }
  // iOS 11, use SFAuthenticationSession
  if (@available(iOS 11.0, *)) {
    // SFAuthenticationSession doesn't work with guided access (rdar://40809553)
    if (!openedUserAgent && !UIAccessibilityIsGuidedAccessEnabled()) {
      __weak OIDExternalUserAgentIOS *weakSelf = self;
      NSString *redirectScheme = request.redirectScheme;
      SFAuthenticationSession *authenticationVC =
          [[SFAuthenticationSession alloc] initWithURL:requestURL
                                     callbackURLScheme:redirectScheme
                                     completionHandler:^(NSURL * _Nullable callbackURL,
                                                         NSError * _Nullable error) {
        __strong OIDExternalUserAgentIOS *strongSelf = weakSelf;
        if (!strongSelf) {
            return;
        }
        strongSelf->_authenticationVC = nil;
        if (callbackURL) {
          [strongSelf->_session resumeExternalUserAgentFlowWithURL:callbackURL];
        } else {
          NSError *safariError =
              [OIDErrorUtilities errorWithCode:OIDErrorCodeUserCanceledAuthorizationFlow
                               underlyingError:error
                                   description:@"User cancelled."];
          [strongSelf->_session failExternalUserAgentFlowWithError:safariError];
        }
      }];
      _authenticationVC = authenticationVC;
      openedUserAgent = [authenticationVC start];
    }
  }
  // iOS 9 and 10, use SFSafariViewController
  if (@available(iOS 9.0, *)) {
    if (!openedUserAgent && _presentingViewController) {
      SFSafariViewController *safariVC =
          [[SFSafariViewController alloc] initWithURL:requestURL];
      safariVC.delegate = self;
      _safariVC = safariVC;
      [_presentingViewController presentViewController:safariVC animated:YES completion:nil];
      openedUserAgent = YES;
    }
  }
  // iOS 8 and earlier, use mobile Safari
  if (!openedUserAgent){
    openedUserAgent = [[UIApplication sharedApplication] openURL:requestURL];
  }

  if (!openedUserAgent) {
    [self cleanUp];
    NSError *safariError = [OIDErrorUtilities errorWithCode:OIDErrorCodeSafariOpenError
                                            underlyingError:nil
                                                description:@"Unable to open Safari."];
    [session failExternalUserAgentFlowWithError:safariError];
  }
  return openedUserAgent;
}

- (void)dismissExternalUserAgentAnimated:(BOOL)animated completion:(void (^)(void))completion {
  if (!_externalUserAgentFlowInProgress) {
    // Ignore this call if there is no authorization flow in progress.
    if (completion) completion();
    return;
  }
  
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wpartial-availability"
  SFSafariViewController *safariVC = _safariVC;
  SFAuthenticationSession *authenticationVC = _authenticationVC;
  ASWebAuthenticationSession *webAuthenticationVC = _webAuthenticationVC;
#pragma clang diagnostic pop
  
  [self cleanUp];
  
  if (webAuthenticationVC) {
    // dismiss the ASWebAuthenticationSession
    [webAuthenticationVC cancel];
    if (completion) completion();
  } else if (authenticationVC) {
    // dismiss the SFAuthenticationSession
    [authenticationVC cancel];
    if (completion) completion();
  } else if (safariVC) {
    // dismiss the SFSafariViewController
    [safariVC dismissViewControllerAnimated:YES completion:completion];
  } else {
    if (completion) completion();
  }
}

- (void)cleanUp {
  // The weak references to |_safariVC| and |_session| are set to nil to avoid accidentally using
  // them while not in an authorization flow.
  _safariVC = nil;
  _authenticationVC = nil;
  _webAuthenticationVC = nil;
  _session = nil;
  _externalUserAgentFlowInProgress = NO;
}

#pragma mark - SFSafariViewControllerDelegate

- (void)safariViewControllerDidFinish:(SFSafariViewController *)controller NS_AVAILABLE_IOS(9.0) {
  if (controller != _safariVC) {
    // Ignore this call if the safari view controller do not match.
    return;
  }
  if (!_externalUserAgentFlowInProgress) {
    // Ignore this call if there is no authorization flow in progress.
    return;
  }
  id<OIDExternalUserAgentSession> session = _session;
  [self cleanUp];
  NSError *error = [OIDErrorUtilities errorWithCode:OIDErrorCodeUserCanceledAuthorizationFlow
                                    underlyingError:nil
                                        description:@"No external user agent flow in progress."];
  [session failExternalUserAgentFlowWithError:error];
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
#pragma mark - ASWebAuthenticationPresentationContextProviding

- (ASPresentationAnchor)presentationAnchorForWebAuthenticationSession:(ASWebAuthenticationSession *)session API_AVAILABLE(ios(13.0)){
  return _presentingViewController.view.window;
}
#endif // __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000

@end

NS_ASSUME_NONNULL_END

#endif // !TARGET_OS_MACCATALYST

#endif // TARGET_OS_IOS || TARGET_OS_MACCATALYST
