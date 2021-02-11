// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKBridgeAPI.h"

 #import "FBSDKCoreKit+Internal.h"

/**
 Specifies state of FBSDKAuthenticationSession (SFAuthenticationSession (iOS 11) and ASWebAuthenticationSession (iOS 12+))
 */
typedef NS_ENUM(NSUInteger, FBSDKAuthenticationSession) {
  /** There is no active authentication session*/
  FBSDKAuthenticationSessionNone,
  /** The authentication session has started*/
  FBSDKAuthenticationSessionStarted,
  /** System dialog ("app wants to use facebook.com  to sign in")  to access facebook.com was presented to the user*/
  FBSDKAuthenticationSessionShowAlert,
  /** Web browser with log in to authentication was presented to the user*/
  FBSDKAuthenticationSessionShowWebBrowser,
  /** Authentication session was canceled by system. It happens when app goes to background while alert requesting access to facebook.com is presented*/
  FBSDKAuthenticationSessionCanceledBySystem,
};

@protocol FBSDKAuthenticationSession <NSObject>

- (instancetype)initWithURL:(NSURL *)URL callbackURLScheme:(nullable NSString *)callbackURLScheme completionHandler:(FBSDKAuthenticationCompletionHandler)completionHandler;
- (BOOL)start;
- (void)cancel;
@optional
- (void)setPresentationContextProvider:(id)presentationContextProvider;

@end

 #if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  #import <AuthenticationServices/AuthenticationServices.h>
@interface FBSDKBridgeAPI () <FBSDKApplicationObserving, FBSDKContainerViewControllerDelegate, ASWebAuthenticationPresentationContextProviding>
 #else
@interface FBSDKBridgeAPI () <FBSDKApplicationObserving, FBSDKContainerViewControllerDelegate>
 #endif

@end

@implementation FBSDKBridgeAPI
{
  NSObject<FBSDKBridgeAPIRequestProtocol> *_pendingRequest;
  FBSDKBridgeAPIResponseBlock _pendingRequestCompletionBlock;
  id<FBSDKURLOpening> _pendingURLOpen;
  id<FBSDKAuthenticationSession> _authenticationSession NS_AVAILABLE_IOS(11_0);
  FBSDKAuthenticationCompletionHandler _authenticationSessionCompletionHandler NS_AVAILABLE_IOS(11_0);

  BOOL _expectingBackground;
  UIViewController *_safariViewController;
  BOOL _isDismissingSafariViewController;
  BOOL _isAppLaunched;
  FBSDKAuthenticationSession _authenticationSessionState;
}

+ (void)load
{
  [[FBSDKApplicationDelegate sharedInstance] addObserver:[FBSDKBridgeAPI sharedInstance]];
}

+ (FBSDKBridgeAPI *)sharedInstance
{
  static FBSDKBridgeAPI *_sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _sharedInstance = [[self alloc] init];
  });
  return _sharedInstance;
}

- (void)applicationWillResignActive:(UIApplication *)application
{
  [self _updateAuthStateIfSystemAlertToUseWebAuthFlowPresented];
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  BOOL isRequestingWebAuthenticationSession = NO;
  if (@available(iOS 11.0, *)) {
    if (_authenticationSession && _authenticationSessionState == FBSDKAuthenticationSessionShowAlert) {
      _authenticationSessionState = FBSDKAuthenticationSessionShowWebBrowser;
    } else if (_authenticationSession && _authenticationSessionState == FBSDKAuthenticationSessionCanceledBySystem) {
      [_authenticationSession cancel];
      _authenticationSession = nil;
      NSString *errorDomain;
      if (@available(iOS 12.0, *)) {
        errorDomain = @"com.apple.AuthenticationServices.WebAuthenticationSession";
      } else {
        errorDomain = @"com.apple.SafariServices.Authentication";
      }
      NSError *error = [FBSDKError errorWithDomain:errorDomain code:1 message:nil];
      if (_authenticationSessionCompletionHandler) {
        _authenticationSessionCompletionHandler(nil, error);
      }
      isRequestingWebAuthenticationSession = [self _isRequestingWebAuthenticationSession];
    }
  }
  // _expectingBackground can be YES if the caller started doing work (like login)
  // within the app delegate's lifecycle like openURL, in which case there
  // might have been a "didBecomeActive" event pending that we want to ignore.
  BOOL notExpectingBackground = !_expectingBackground && !_safariViewController && !_isDismissingSafariViewController && !isRequestingWebAuthenticationSession;
  if (notExpectingBackground) {
    _active = YES;

    [_pendingURLOpen applicationDidBecomeActive:application];
    [self _cancelBridgeRequest];

    [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKApplicationDidBecomeActiveNotification object:self];
  }
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
  _active = NO;
  _expectingBackground = NO;
  [self _updateAuthStateIfSystemCancelAuthSession];
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  id<FBSDKURLOpening> pendingURLOpen = _pendingURLOpen;

  if ([pendingURLOpen respondsToSelector:@selector(shouldStopPropagationOfURL:)]
      && [pendingURLOpen shouldStopPropagationOfURL:url]) {
    return YES;
  }

  BOOL canOpenURL = [pendingURLOpen canOpenURL:url
                                forApplication:application
                             sourceApplication:sourceApplication
                                    annotation:annotation];

  void (^completePendingOpenURLBlock)(void) = ^{
    self->_pendingURLOpen = nil;
    [pendingURLOpen application:application
                        openURL:url
              sourceApplication:sourceApplication
                     annotation:annotation];
    self->_isDismissingSafariViewController = NO;
  };
  // if they completed a SFVC flow, dismiss it.
  if (_safariViewController) {
    _isDismissingSafariViewController = YES;
    [_safariViewController.presentingViewController dismissViewControllerAnimated:YES
                                                                       completion:completePendingOpenURLBlock];
    _safariViewController = nil;
  } else {
    if (@available(iOS 11.0, *)) {
      if (_authenticationSession != nil) {
        [_authenticationSession cancel];
        _authenticationSession = nil;

        // This check is needed in case another sdk / message / ad etc... tries to open the app
        // during the login flow.
        // This dismisses the authentication browser without triggering any login callbacks.
        // Hence we need to explicitly call the authentication session's completion handler.
        if (!canOpenURL) {
          NSString *errorMessage = [[NSString alloc]
                                    initWithFormat:@"Login attempt cancelled by alternate call to openURL from: %@",
                                    url];
          NSError *loginError = [[NSError alloc]
                                 initWithDomain:FBSDKErrorDomain
                                 code:FBSDKErrorBridgeAPIInterruption
                                 userInfo:@{FBSDKErrorLocalizedDescriptionKey : errorMessage}];
          if (_authenticationSessionCompletionHandler) {
            _authenticationSessionCompletionHandler(url, loginError);
            _authenticationSessionCompletionHandler = nil;
          }
        }
      }
    }
    completePendingOpenURLBlock();
  }

  if (canOpenURL) {
    return YES;
  }

  if ([self _handleBridgeAPIResponseURL:url sourceApplication:sourceApplication]) {
    return YES;
  }

  return NO;
}

- (BOOL)            application:(UIApplication *)application
  didFinishLaunchingWithOptions:(NSDictionary<UIApplicationLaunchOptionsKey, id> *)launchOptions
{
  NSURL *launchedURL = launchOptions[UIApplicationLaunchOptionsURLKey];
  NSString *sourceApplication = launchOptions[UIApplicationLaunchOptionsSourceApplicationKey];

  if (launchedURL
      && sourceApplication) {
    Class loginManagerClass = NSClassFromString(@"FBSDKLoginManager");
    if (loginManagerClass) {
      id annotation = launchOptions[UIApplicationLaunchOptionsAnnotationKey];
      id<FBSDKURLOpening> loginManager = [[loginManagerClass alloc] init];
      return [loginManager application:application
                               openURL:launchedURL
                     sourceApplication:sourceApplication
                            annotation:annotation];
    }
  }

  return NO;
}

- (void)_updateAuthStateIfSystemAlertToUseWebAuthFlowPresented
{
  if (@available(iOS 11.0, *)) {
    if (_authenticationSession && _authenticationSessionState == FBSDKAuthenticationSessionStarted) {
      _authenticationSessionState = FBSDKAuthenticationSessionShowAlert;
    }
  }
}

- (void)_updateAuthStateIfSystemCancelAuthSession
{
  if (@available(iOS 11.0, *)) {
    if (_authenticationSession && _authenticationSessionState == FBSDKAuthenticationSessionShowAlert) {
      _authenticationSessionState = FBSDKAuthenticationSessionCanceledBySystem;
    }
  }
}

- (BOOL)_isRequestingWebAuthenticationSession
{
  return !(_authenticationSessionState == FBSDKAuthenticationSessionNone
    || _authenticationSessionState == FBSDKAuthenticationSessionCanceledBySystem);
}

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
- (void)openURL:(NSURL *)url sender:(id<FBSDKURLOpening>)sender handler:(FBSDKSuccessBlock)handler
{
  _expectingBackground = YES;
  _pendingURLOpen = sender;
  dispatch_async(dispatch_get_main_queue(), ^{
    // Dispatch openURL calls to prevent hangs if we're inside the current app delegate's openURL flow already
    NSOperatingSystemVersion iOS10Version = { .majorVersion = 10, .minorVersion = 0, .patchVersion = 0 };
    if ([NSProcessInfo.processInfo isOperatingSystemAtLeastVersion:iOS10Version]) {
      if (@available(iOS 10.0, *)) {
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:^(BOOL success) {
          handler(success, nil);
        }];
      }
    } else if (handler) {
      BOOL opened = [UIApplication.sharedApplication openURL:url];
      handler(opened, nil);
    }
  });
}

 #pragma clang diagnostic pop

- (void)openBridgeAPIRequest:(NSObject<FBSDKBridgeAPIRequestProtocol> *)request
     useSafariViewController:(BOOL)useSafariViewController
          fromViewController:(UIViewController *)fromViewController
             completionBlock:(FBSDKBridgeAPIResponseBlock)completionBlock
{
  if (!request) {
    return;
  }
  NSError *error;
  NSURL *requestURL = [request requestURL:&error];
  if (!requestURL) {
    FBSDKBridgeAPIResponse *response = [FBSDKBridgeAPIResponse bridgeAPIResponseWithRequest:request error:error];
    completionBlock(response);
    return;
  }
  _pendingRequest = request;
  _pendingRequestCompletionBlock = [completionBlock copy];
  FBSDKSuccessBlock handler = [self _bridgeAPIRequestCompletionBlockWithRequest:request
                                                                     completion:completionBlock];
  if (useSafariViewController) {
    [self openURLWithSafariViewController:requestURL sender:nil fromViewController:fromViewController handler:handler];
  } else {
    [self openURL:requestURL sender:nil handler:handler];
  }
}

- (FBSDKSuccessBlock)_bridgeAPIRequestCompletionBlockWithRequest:(NSObject<FBSDKBridgeAPIRequestProtocol> *)request
                                                      completion:(FBSDKBridgeAPIResponseBlock)completionBlock
{
  return ^(BOOL openedURL, NSError *anError) {
    if (!openedURL) {
      self->_pendingRequest = nil;
      self->_pendingRequestCompletionBlock = nil;
      NSError *openedURLError;
      if ([request.scheme hasPrefix:@"http"]) {
        openedURLError = [FBSDKError errorWithCode:FBSDKErrorBrowserUnavailable
                                           message:@"the app switch failed because the browser is unavailable"];
      } else {
        openedURLError = [FBSDKError errorWithCode:FBSDKErrorAppVersionUnsupported
                                           message:@"the app switch failed because the destination app is out of date"];
      }
      FBSDKBridgeAPIResponse *response = [FBSDKBridgeAPIResponse bridgeAPIResponseWithRequest:request
                                                                                        error:openedURLError];
      completionBlock(response);
      return;
    }
  };
}

- (void)openURLWithSafariViewController:(NSURL *)url
                                 sender:(id<FBSDKURLOpening>)sender
                     fromViewController:(UIViewController *)fromViewController
                                handler:(FBSDKSuccessBlock)handler
{
  [self _openURLWithSafariViewController:url
                                  sender:sender
                      fromViewController:fromViewController
                                 handler:handler
                           dylibResolver:FBSDKDynamicFrameworkLoader.shared];
}

- (void)_openURLWithSafariViewController:(NSURL *)url
                                  sender:(id<FBSDKURLOpening>)sender
                      fromViewController:(UIViewController *)fromViewController
                                 handler:(FBSDKSuccessBlock)handler
                           dylibResolver:(id<FBSDKDynamicFrameworkResolving>)dylibResolver
{
  if (![url.scheme hasPrefix:@"http"]) {
    [self openURL:url sender:sender handler:handler];
    return;
  }

  _expectingBackground = NO;
  _pendingURLOpen = sender;

  if (@available(iOS 11.0, *)) {
    if ([sender isAuthenticationURL:url]) {
      [self setSessionCompletionHandlerFromHandler:handler];
      [self openURLWithAuthenticationSession:url];
      return;
    }
  }

  // trying to dynamically load SFSafariViewController class
  // so for the cases when it is available we can send users through Safari View Controller flow
  // in cases it is not available regular flow will be selected
  Class SFSafariViewControllerClass = dylibResolver.safariViewControllerClass;

  if (SFSafariViewControllerClass) {
    UIViewController *parent = fromViewController ?: [FBSDKInternalUtility topMostViewController];
    if (parent == nil) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                         formatString:@"There are no valid ViewController to present SafariViewController with", nil];
      return;
    }

    NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:NO];
    NSURLQueryItem *sfvcQueryItem = [[NSURLQueryItem alloc] initWithName:@"sfvc" value:@"1"];
    components.queryItems = [components.queryItems arrayByAddingObject:sfvcQueryItem];
    url = components.URL;
    FBSDKContainerViewController *container = [[FBSDKContainerViewController alloc] init];
    container.delegate = self;
    if (parent.transitionCoordinator != nil) {
      // Wait until the transition is finished before presenting SafariVC to avoid a blank screen.
      [parent.transitionCoordinator animateAlongsideTransition:NULL completion:^(id<UIViewControllerTransitionCoordinatorContext> context) {
        // Note SFVC init must occur inside block to avoid blank screen.
        self->_safariViewController = [[SFSafariViewControllerClass alloc] initWithURL:url];
        // Disable dismissing with edge pan gesture
        self->_safariViewController.modalPresentationStyle = UIModalPresentationOverFullScreen;
        [self->_safariViewController performSelector:@selector(setDelegate:) withObject:self];
        [container displayChildController:self->_safariViewController];
        [parent presentViewController:container animated:YES completion:nil];
      }];
    } else {
      _safariViewController = [[SFSafariViewControllerClass alloc] initWithURL:url];
      // Disable dismissing with edge pan gesture
      _safariViewController.modalPresentationStyle = UIModalPresentationOverFullScreen;
      [_safariViewController performSelector:@selector(setDelegate:) withObject:self];
      [container displayChildController:_safariViewController];
      [parent presentViewController:container animated:YES completion:nil];
    }

    // Assuming Safari View Controller always opens
    if (handler) {
      handler(YES, nil);
    }
  } else {
    [self openURL:url sender:sender handler:handler];
  }
}

- (void)openURLWithAuthenticationSession:(NSURL *)url
{
  Class AuthenticationSessionClass = fbsdkdfl_ASWebAuthenticationSessionClass();

  if (!AuthenticationSessionClass) {
    AuthenticationSessionClass = fbsdkdfl_SFAuthenticationSessionClass();
  }

  if (AuthenticationSessionClass != nil) {
    if (_authenticationSession != nil) {
      [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                         formatString:@"There is already a request for authenticated session. Cancelling active SFAuthenticationSession before starting the new one.", nil];
      [_authenticationSession cancel];
    }
    _authenticationSession = [[AuthenticationSessionClass alloc] initWithURL:url
                                                           callbackURLScheme:[FBSDKInternalUtility appURLScheme]
                                                           completionHandler:_authenticationSessionCompletionHandler];
    if (@available(iOS 13.0, *)) {
      if ([_authenticationSession respondsToSelector:@selector(setPresentationContextProvider:)]) {
        [_authenticationSession setPresentationContextProvider:self];
      }
    }
    _authenticationSessionState = FBSDKAuthenticationSessionStarted;
    [_authenticationSession start];
  }
}

- (void)setSessionCompletionHandlerFromHandler:(FBSDKSuccessBlock)handler
{
  __weak FBSDKBridgeAPI *weakSelf = self;
  _authenticationSessionCompletionHandler = ^(NSURL *aURL, NSError *error) {
    FBSDKBridgeAPI *strongSelf = weakSelf;
    BOOL didSucceed = (error == nil && aURL != nil);
    handler(didSucceed, error);
    if (didSucceed) {
      [strongSelf application:[UIApplication sharedApplication] openURL:aURL sourceApplication:@"com.apple" annotation:nil];
    }
    strongSelf->_authenticationSession = nil;
    strongSelf->_authenticationSessionCompletionHandler = nil;
    strongSelf->_authenticationSessionState = FBSDKAuthenticationSessionNone;
  };
}

- (FBSDKAuthenticationCompletionHandler)sessionCompletionHandler
{
  return _authenticationSessionCompletionHandler;
}

 #pragma mark -- SFSafariViewControllerDelegate

// This means the user tapped "Done" which we should treat as a cancellation.
- (void)safariViewControllerDidFinish:(UIViewController *)safariViewController
{
  if (_pendingURLOpen) {
    id<FBSDKURLOpening> pendingURLOpen = _pendingURLOpen;

    _pendingURLOpen = nil;

    [pendingURLOpen application:nil
                        openURL:nil
              sourceApplication:nil
                     annotation:nil];
  }
  [self _cancelBridgeRequest];
  _safariViewController = nil;
}

 #pragma mark -- FBSDKContainerViewControllerDelegate

- (void)viewControllerDidDisappear:(FBSDKContainerViewController *)viewController animated:(BOOL)animated
{
  if (_safariViewController) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                           logEntry:@"**ERROR**:\n The SFSafariViewController's parent view controller was dismissed.\n"
     "This can happen if you are triggering login from a UIAlertController. Instead, make sure your top most view "
     "controller will not be prematurely dismissed."];
    [self safariViewControllerDidFinish:_safariViewController];
  }
}

 #pragma mark - Helper Methods

- (BOOL)_handleBridgeAPIResponseURL:(NSURL *)responseURL sourceApplication:(NSString *)sourceApplication
{
  NSObject<FBSDKBridgeAPIRequestProtocol> *request = _pendingRequest;
  FBSDKBridgeAPIResponseBlock completionBlock = _pendingRequestCompletionBlock;
  _pendingRequest = nil;
  _pendingRequestCompletionBlock = NULL;
  if (![responseURL.scheme isEqualToString:[FBSDKInternalUtility appURLScheme]]) {
    return NO;
  }
  if (![responseURL.host isEqualToString:@"bridge"]) {
    return NO;
  }
  if (!request) {
    return NO;
  }
  if (!completionBlock) {
    return YES;
  }
  NSError *error;
  FBSDKBridgeAPIResponse *response = [FBSDKBridgeAPIResponse bridgeAPIResponseWithRequest:request
                                                                              responseURL:responseURL
                                                                        sourceApplication:sourceApplication
                                                                                    error:&error];
  if (response) {
    completionBlock(response);
    return YES;
  } else if (error) {
    completionBlock([FBSDKBridgeAPIResponse bridgeAPIResponseWithRequest:request error:error]);
    return YES;
  } else {
    return NO;
  }
}

- (void)_cancelBridgeRequest
{
  if (_pendingRequest && _pendingRequestCompletionBlock) {
    _pendingRequestCompletionBlock([FBSDKBridgeAPIResponse bridgeAPIResponseCancelledWithRequest:_pendingRequest]);
  }
  _pendingRequest = nil;
  _pendingRequestCompletionBlock = NULL;
}

 #pragma clang diagnostic push
 #pragma clang diagnostic ignored "-Wdeprecated-declarations"
 #pragma mark - ASWebAuthenticationPresentationContextProviding
 #if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
- (ASPresentationAnchor)presentationAnchorForWebAuthenticationSession:(ASWebAuthenticationSession *)session API_AVAILABLE(ios(13.0))
{
 #else
- (UIWindow *)presentationAnchorForWebAuthenticationSession:(id<FBSDKAuthenticationSession>)session API_AVAILABLE(ios(11.0)) {
#endif
  return UIApplication.sharedApplication.keyWindow;
}
 #pragma clang diagnostic pop

 #pragma mark - Testability

 #if DEBUG

- (id<FBSDKAuthenticationSession>)authenticationSession
{
  return _authenticationSession;
}

- (void)setAuthenticationSession:(id<FBSDKAuthenticationSession>)session
{
  _authenticationSession = session;
}

- (FBSDKAuthenticationSession)authenticationSessionState
{
  return _authenticationSessionState;
}

- (void)setAuthenticationSessionState:(FBSDKAuthenticationSession)state
{
  _authenticationSessionState = state;
}

- (FBSDKAuthenticationCompletionHandler)authenticationSessionCompletionHandler
{
  return _authenticationSessionCompletionHandler;
}

- (void)setAuthenticationSessionCompletionHandler:(FBSDKAuthenticationCompletionHandler)handler
{
  _authenticationSessionCompletionHandler = handler;
}

- (void)setActive:(BOOL)isActive
{
  _active = isActive;
}

- (BOOL)expectingBackground
{
  return _expectingBackground;
}

- (void)setExpectingBackground:(BOOL)isExpectingBackground
{
  _expectingBackground = isExpectingBackground;
}

- (id<FBSDKURLOpening>)pendingUrlOpen
{
  return _pendingURLOpen;
}

- (void)setPendingUrlOpen:(id<FBSDKURLOpening>)opening
{
  _pendingURLOpen = opening;
}

- (UIViewController *)safariViewController
{
  return _safariViewController;
}

- (void)setSafariViewController:(nullable UIViewController *)controller
{
  _safariViewController = controller;
}

- (BOOL)isDismissingSafariViewController
{
  return _isDismissingSafariViewController;
}

- (void)setIsDismissingSafariViewController:(BOOL)isDismissing
{
  _isDismissingSafariViewController = isDismissing;
}

- (NSObject<FBSDKBridgeAPIRequestProtocol> *)pendingRequest
{
  return _pendingRequest;
}

- (void)setPendingRequest:(NSObject<FBSDKBridgeAPIRequestProtocol> *)newValue
{
  _pendingRequest = newValue;
}

- (FBSDKBridgeAPIResponseBlock)pendingRequestCompletionBlock
{
  return _pendingRequestCompletionBlock;
}

- (void)setPendingRequestCompletionBlock:(FBSDKBridgeAPIResponseBlock)newValue
{
  _pendingRequestCompletionBlock = newValue;
}

 #endif

@end

#endif
