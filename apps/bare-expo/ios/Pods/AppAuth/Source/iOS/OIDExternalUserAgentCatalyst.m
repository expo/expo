/*! @file OIDExternalUserAgentCatalyst.m
   @brief AppAuth iOS SDK
   @copyright
       Copyright 2019 The AppAuth Authors. All Rights Reserved.
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

#import "OIDExternalUserAgentCatalyst.h"

#import <SafariServices/SafariServices.h>
#import <AuthenticationServices/AuthenticationServices.h>

#import "OIDErrorUtilities.h"
#import "OIDExternalUserAgentSession.h"
#import "OIDExternalUserAgentRequest.h"

#if TARGET_OS_MACCATALYST

NS_ASSUME_NONNULL_BEGIN

@interface OIDExternalUserAgentCatalyst ()<ASWebAuthenticationPresentationContextProviding>
@end

@implementation OIDExternalUserAgentCatalyst {
  UIViewController *_presentingViewController;

  BOOL _externalUserAgentFlowInProgress;
  __weak id<OIDExternalUserAgentSession> _session;
  ASWebAuthenticationSession *_webAuthenticationVC;
}

- (nullable instancetype)initWithPresentingViewController:
    (UIViewController *)presentingViewController {
  self = [super init];
  if (self) {
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

  __weak OIDExternalUserAgentCatalyst *weakSelf = self;
  NSString *redirectScheme = request.redirectScheme;
  ASWebAuthenticationSession *authenticationVC =
      [[ASWebAuthenticationSession alloc] initWithURL:requestURL
                                    callbackURLScheme:redirectScheme
                                    completionHandler:^(NSURL * _Nullable callbackURL,
                                                        NSError * _Nullable error) {
    __strong OIDExternalUserAgentCatalyst *strongSelf = weakSelf;
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
      
  authenticationVC.presentationContextProvider = self;
  _webAuthenticationVC = authenticationVC;
  openedUserAgent = [authenticationVC start];

  if (!openedUserAgent) {
    [self cleanUp];
    NSError *safariError = [OIDErrorUtilities errorWithCode:OIDErrorCodeSafariOpenError
                                            underlyingError:nil
                                                description:@"Unable to open ASWebAuthenticationSession view controller."];
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
  
  ASWebAuthenticationSession *webAuthenticationVC = _webAuthenticationVC;
  
  [self cleanUp];
  
  if (webAuthenticationVC) {
    // dismiss the ASWebAuthenticationSession
    [webAuthenticationVC cancel];
    if (completion) completion();
  } else {
    if (completion) completion();
  }
}

- (void)cleanUp {
  // The weak reference to |_session| is set to nil to avoid accidentally using
  // it while not in an authorization flow.
  _webAuthenticationVC = nil;
  _session = nil;
  _externalUserAgentFlowInProgress = NO;
}

#pragma mark - ASWebAuthenticationPresentationContextProviding

- (ASPresentationAnchor)presentationAnchorForWebAuthenticationSession:(ASWebAuthenticationSession *)session {
  return _presentingViewController.view.window;
}

@end

NS_ASSUME_NONNULL_END

#endif // TARGET_OS_MACCATALYST
