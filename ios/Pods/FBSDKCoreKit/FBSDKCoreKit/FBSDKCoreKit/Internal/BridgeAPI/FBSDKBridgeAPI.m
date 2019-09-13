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

#import "FBSDKBridgeAPI.h"

#import "FBSDKCoreKit+Internal.h"

typedef void (^FBSDKAuthenticationCompletionHandler)(NSURL *_Nullable callbackURL, NSError *_Nullable error);

@protocol FBSDKAuthenticationSession <NSObject>

- (instancetype)initWithURL:(NSURL *)URL callbackURLScheme:(nullable NSString *)callbackURLScheme completionHandler:(FBSDKAuthenticationCompletionHandler)completionHandler;
- (BOOL)start;
- (void)cancel;
@optional
- (void)setPresentationContextProvider:(id)presentationContextProvider;

@end

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
#import <AuthenticationServices/AuthenticationServices.h>
@interface FBSDKBridgeAPI() <FBSDKApplicationObserving, FBSDKContainerViewControllerDelegate, ASWebAuthenticationPresentationContextProviding>
#else
@interface FBSDKBridgeAPI() <FBSDKApplicationObserving, FBSDKContainerViewControllerDelegate>
#endif

@end

@implementation FBSDKBridgeAPI {
  FBSDKBridgeAPIRequest *_pendingRequest;
  FBSDKBridgeAPIResponseBlock _pendingRequestCompletionBlock;
  id<FBSDKURLOpening> _pendingURLOpen;
  id<FBSDKAuthenticationSession> _authenticationSession NS_AVAILABLE_IOS(11_0);
  FBSDKAuthenticationCompletionHandler _authenticationSessionCompletionHandler NS_AVAILABLE_IOS(11_0);

  BOOL _expectingBackground;
  BOOL _isRequestingSFAuthenticationSession;
  UIViewController *_safariViewController;
  BOOL _isDismissingSafariViewController;
  BOOL _isAppLaunched;
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

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  //  _expectingBackground can be YES if the caller started doing work (like login)
  // within the app delegate's lifecycle like openURL, in which case there
  // might have been a "didBecomeActive" event pending that we want to ignore.
  BOOL notExpectingBackground = !_expectingBackground && !_safariViewController && !_isDismissingSafariViewController && !_isRequestingSFAuthenticationSession;
  if (notExpectingBackground) {
    _active = YES;

    [_pendingURLOpen applicationDidBecomeActive:application];
    [self _cancelBridgeRequest];

    [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKApplicationDidBecomeActiveNotification object:self];
  }
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
  _isRequestingSFAuthenticationSession = NO;
  _active = NO;
  _expectingBackground = NO;
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  id<FBSDKURLOpening> pendingURLOpen = _pendingURLOpen;

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
      }
    }
    completePendingOpenURLBlock();
  }

  if ([pendingURLOpen canOpenURL:url
                  forApplication:application
               sourceApplication:sourceApplication
                      annotation:annotation]) {
    return YES;
  }

  if ([self _handleBridgeAPIResponseURL:url sourceApplication:sourceApplication]) {
    return YES;
  }

  return NO;
}

- (BOOL)application:(UIApplication *)application
didFinishLaunchingWithOptions:(NSDictionary<UIApplicationLaunchOptionsKey, id> *)launchOptions
{
  NSURL *launchedURL = launchOptions[UIApplicationLaunchOptionsURLKey];
  NSString *sourceApplication = launchOptions[UIApplicationLaunchOptionsSourceApplicationKey];

  if (launchedURL &&
      sourceApplication) {
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

#pragma mark - Internal Methods

- (void)openURL:(NSURL *)url sender:(id<FBSDKURLOpening>)sender handler:(FBSDKSuccessBlock)handler
{
  _expectingBackground = YES;
  _pendingURLOpen = sender;
  dispatch_async(dispatch_get_main_queue(), ^{
    // Dispatch openURL calls to prevent hangs if we're inside the current app delegate's openURL flow already
    NSOperatingSystemVersion iOS10Version = { .majorVersion = 10, .minorVersion = 0, .patchVersion = 0 };
    if ([FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS10Version]) {
      if (@available(iOS 10.0, *)) {
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:^(BOOL success) {
          handler(success, nil);
        }];
      }
    } else {
      BOOL opened = [[UIApplication sharedApplication] openURL:url];

      if ([url.scheme hasPrefix:@"http"] && !opened) {
        NSOperatingSystemVersion iOS8Version = { .majorVersion = 8, .minorVersion = 0, .patchVersion = 0 };
        if (![FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS8Version]) {
          // Safari openURL calls can wrongly return NO on iOS 7 so manually overwrite that case to YES.
          // Otherwise we would rather trust in the actual result of openURL
          opened = YES;
        }
      }
      if (handler) {
        handler(opened, nil);
      }
    }
  });
}

- (void)openBridgeAPIRequest:(FBSDKBridgeAPIRequest *)request
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
  void (^handler)(BOOL, NSError *) = ^(BOOL openedURL, NSError *anError) {
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
  if (useSafariViewController) {
    [self openURLWithSafariViewController:requestURL sender:nil fromViewController:fromViewController handler:handler];
  } else {
    [self openURL:requestURL sender:nil handler:handler];
  }
}

- (void)openURLWithSafariViewController:(NSURL *)url
                                 sender:(id<FBSDKURLOpening>)sender
                     fromViewController:(UIViewController *)fromViewController
                                handler:(FBSDKSuccessBlock)handler
{
  if (![url.scheme hasPrefix:@"http"]) {
    [self openURL:url sender:sender handler:handler];
    return;
  }

  _expectingBackground = NO;
  _pendingURLOpen = sender;

  if (@available(iOS 11.0, *)) {
    if ([sender isAuthenticationURL:url]) {
      [self _setSessionCompletionHandlerFromHandler:handler];
      [self _openURLWithAuthenticationSession:url];
      return;
    }
  }

  // trying to dynamically load SFSafariViewController class
  // so for the cases when it is available we can send users through Safari View Controller flow
  // in cases it is not available regular flow will be selected
  Class SFSafariViewControllerClass = fbsdkdfl_SFSafariViewControllerClass();

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

- (void)_openURLWithAuthenticationSession:(NSURL *)url
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
    _isRequestingSFAuthenticationSession = YES;
    [_authenticationSession start];
  }
}

- (void)_setSessionCompletionHandlerFromHandler:(void(^)(BOOL, NSError *))handler
{
  __weak FBSDKBridgeAPI *weakSelf = self;
  _authenticationSessionCompletionHandler = ^ (NSURL *aURL, NSError *error) {
    FBSDKBridgeAPI *strongSelf = weakSelf;
    strongSelf->_isRequestingSFAuthenticationSession = NO;
    handler(error == nil, error);
    if (error == nil) {
      [strongSelf application:[UIApplication sharedApplication] openURL:aURL sourceApplication:@"com.apple" annotation:nil];
    }
    strongSelf->_authenticationSession = nil;
    strongSelf->_authenticationSessionCompletionHandler = nil;
  };
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
  FBSDKBridgeAPIRequest *request = _pendingRequest;
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

#pragma mark - ASWebAuthenticationPresentationContextProviding
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
- (ASPresentationAnchor)presentationAnchorForWebAuthenticationSession:(ASWebAuthenticationSession *)session API_AVAILABLE(ios(13.0)){
#else
- (UIWindow *)presentationAnchorForWebAuthenticationSession:(id<FBSDKAuthenticationSession>)session API_AVAILABLE(ios(11.0)) {
#endif
  return UIApplication.sharedApplication.keyWindow;
}

@end
