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

#import "FBSDKApplicationDelegate.h"
#import "FBSDKApplicationDelegate+Internal.h"

#import <objc/runtime.h>

#if !TARGET_OS_TV
#import <SafariServices/SafariServices.h>
#endif

#import "FBSDKAppEvents+Internal.h"
#import "FBSDKConstants.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKError.h"
#import "FBSDKGateKeeperManager.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKServerConfiguration.h"
#import "FBSDKServerConfigurationManager.h"
#import "FBSDKSettings+Internal.h"
#import "FBSDKTimeSpentData.h"
#import "FBSDKUtility.h"

#if !TARGET_OS_TV
#import "FBSDKBoltsMeasurementEventListener.h"
#import "FBSDKBridgeAPIRequest.h"
#import "FBSDKBridgeAPIResponse.h"
#import "FBSDKContainerViewController.h"
#import "FBSDKProfile+Internal.h"
#endif

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

NSNotificationName const FBSDKApplicationDidBecomeActiveNotification = @"com.facebook.sdk.FBSDKApplicationDidBecomeActiveNotification";

#else

NSString *const FBSDKApplicationDidBecomeActiveNotification = @"com.facebook.sdk.FBSDKApplicationDidBecomeActiveNotification";

#endif

static NSString *const FBSDKAppLinkInboundEvent = @"fb_al_inbound";

typedef void (^FBSDKAuthenticationCompletionHandler)(NSURL *_Nullable callbackURL, NSError *_Nullable error);

@protocol FBSDKAuthenticationSession <NSObject>

- (instancetype)initWithURL:(NSURL *)URL callbackURLScheme:(nullable NSString *)callbackURLScheme completionHandler:(FBSDKAuthenticationCompletionHandler)completionHandler;
- (BOOL)start;
- (void)cancel;

@end

@implementation FBSDKApplicationDelegate
{
#if !TARGET_OS_TV
    FBSDKBridgeAPIRequest *_pendingRequest;
    FBSDKBridgeAPICallbackBlock _pendingRequestCompletionBlock;
    id<FBSDKURLOpening> _pendingURLOpen;
    id<FBSDKAuthenticationSession> _authenticationSession NS_AVAILABLE_IOS(11_0);
    FBSDKAuthenticationCompletionHandler _authenticationSessionCompletionHandler NS_AVAILABLE_IOS(11_0);
#endif
    BOOL _expectingBackground;
    BOOL _isRequestingSFAuthenticationSession;
    UIViewController *_safariViewController;
    BOOL _isDismissingSafariViewController;
    BOOL _isAppLaunched;
}

#pragma mark - Class Methods

+ (void)load
{
    // when the app becomes active by any means,  kick off the initialization.
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(initializeWithLaunchData:)
                                                 name:UIApplicationDidFinishLaunchingNotification
                                               object:nil];
}

// Initialize SDK listeners
// Don't call this function in any place else. It should only be called when the class is loaded.
+ (void)initializeWithLaunchData:(NSNotification *)note
{
    NSDictionary *launchData = note.userInfo;

    [[self sharedInstance] application:[UIApplication sharedApplication] didFinishLaunchingWithOptions:launchData];

#if !TARGET_OS_TV
    // Register Listener for Bolts measurement events
    [FBSDKBoltsMeasurementEventListener defaultListener];
#endif
    // Set the SourceApplication for time spent data. This is not going to update the value if the app has already launched.
    [FBSDKTimeSpentData setSourceApplication:launchData[UIApplicationLaunchOptionsSourceApplicationKey]
                                     openURL:launchData[UIApplicationLaunchOptionsURLKey]];
    // Register on UIApplicationDidEnterBackgroundNotification events to reset source application data when app backgrounds.
    [FBSDKTimeSpentData registerAutoResetSourceApplication];

    [FBSDKInternalUtility validateFacebookReservedURLSchemes];
    // Remove the observer
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (instancetype)sharedInstance
{
    static FBSDKApplicationDelegate *_sharedInstance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        _sharedInstance = [[self alloc] _init];
    });
    return _sharedInstance;
}

#pragma mark - Object Lifecycle

- (instancetype)_init
{
    if ((self = [super init]) != nil) {
        NSNotificationCenter *defaultCenter = [NSNotificationCenter defaultCenter];
        [defaultCenter addObserver:self selector:@selector(applicationDidEnterBackground:) name:UIApplicationDidEnterBackgroundNotification object:nil];
        [defaultCenter addObserver:self selector:@selector(applicationDidBecomeActive:) name:UIApplicationDidBecomeActiveNotification object:nil];

        [[FBSDKAppEvents singleton] registerNotifications];
    }
    return self;
}

- (instancetype)init
{
    return nil;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - UIApplicationDelegate

#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_9_0
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
    if (@available(iOS 9.0, *)) {
        return [self application:application
                         openURL:url
               sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]
                      annotation:options[UIApplicationOpenURLOptionsAnnotationKey]];
    }

    return NO;
}
#endif

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
    if (sourceApplication != nil && ![sourceApplication isKindOfClass:[NSString class]]) {
        @throw [NSException exceptionWithName:NSInvalidArgumentException
                                       reason:@"Expected 'sourceApplication' to be NSString. Please verify you are passing in 'sourceApplication' from your app delegate (not the UIApplication* parameter). If your app delegate implements iOS 9's application:openURL:options:, you should pass in options[UIApplicationOpenURLOptionsSourceApplicationKey]. "
                                     userInfo:nil];
    }
    [FBSDKTimeSpentData setSourceApplication:sourceApplication openURL:url];

#if !TARGET_OS_TV
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
    } else if (@available(iOS 11.0, *)) {
        if (_authenticationSession != nil) {
            [_authenticationSession cancel];
            _authenticationSession = nil;
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
#endif
    [self _logIfAppLinkEvent:url];

    return NO;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    if (_isAppLaunched) {
        return NO;
    }

    _isAppLaunched = YES;
    FBSDKAccessToken *cachedToken = [FBSDKSettings accessTokenCache].accessToken;
    [FBSDKAccessToken setCurrentAccessToken:cachedToken];
    // fetch app settings
    [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:NULL];
    // fetch gate keepers
    [FBSDKGateKeeperManager loadGateKeepers];

    if ([FBSDKSettings autoLogAppEventsEnabled].boolValue) {
        [self _logSDKInitialize];
    }
#if !TARGET_OS_TV
    FBSDKProfile *cachedProfile = [FBSDKProfile fetchCachedProfile];
    [FBSDKProfile setCurrentProfile:cachedProfile];

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
#endif
    return NO;
}

- (void)applicationDidEnterBackground:(NSNotification *)notification
{
    _isRequestingSFAuthenticationSession = NO;
    _active = NO;
    _expectingBackground = NO;
}

- (void)applicationDidBecomeActive:(NSNotification *)notification
{
    // Auto log basic events in case autoLogAppEventsEnabled is set
    if ([FBSDKSettings autoLogAppEventsEnabled].boolValue) {
        [FBSDKAppEvents activateApp];
    }
    //  _expectingBackground can be YES if the caller started doing work (like login)
    // within the app delegate's lifecycle like openURL, in which case there
    // might have been a "didBecomeActive" event pending that we want to ignore.
    BOOL notExpectingBackground = !_expectingBackground && !_safariViewController && !_isDismissingSafariViewController && !_isRequestingSFAuthenticationSession;
#if !TARGET_OS_TV
    if (@available(iOS 11.0, *)) {
        if (notExpectingBackground && _authenticationSessionCompletionHandler != nil) {
            _authenticationSessionCompletionHandler(nil, nil);
        }

        notExpectingBackground = notExpectingBackground && !_authenticationSession;
    }
#endif
    if (notExpectingBackground) {
        _active = YES;
#if !TARGET_OS_TV
        [_pendingURLOpen applicationDidBecomeActive:notification.object];
        [self _cancelBridgeRequest];
#endif
        [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKApplicationDidBecomeActiveNotification object:self];
    }
}

#pragma mark - Internal Methods

#pragma mark -- (non-tvos)

#if !TARGET_OS_TV

- (void)openURL:(NSURL *)url sender:(id<FBSDKURLOpening>)sender handler:(void(^)(BOOL, NSError *))handler
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
             completionBlock:(FBSDKBridgeAPICallbackBlock)completionBlock
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
                openedURLError = [NSError fbErrorWithCode:FBSDKErrorBrowserUnavailable
                                                  message:@"the app switch failed because the browser is unavailable"];
            } else {
                openedURLError = [NSError fbErrorWithCode:FBSDKErrorAppVersionUnsupported
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
                                handler:(void(^)(BOOL, NSError *))handler
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
        _isRequestingSFAuthenticationSession = YES;
        [_authenticationSession start];
    }
}

- (void)_setSessionCompletionHandlerFromHandler:(void(^)(BOOL, NSError *))handler
{
    __weak typeof(self) weakSelf = self;
    _authenticationSessionCompletionHandler = ^ (NSURL *aURL, NSError *error) {
        typeof(self) strongSelf = weakSelf;
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

#endif

#pragma mark - Helper Methods

- (void)_logIfAppLinkEvent:(NSURL *)url
{
    if (!url) {
        return;
    }
    NSDictionary *params = [FBSDKUtility dictionaryWithQueryString:url.query];
    NSString *applinkDataString = params[@"al_applink_data"];
    if (!applinkDataString) {
        return;
    }

    NSDictionary *applinkData = [FBSDKInternalUtility objectForJSONString:applinkDataString error:NULL];
    if (!applinkData) {
        return;
    }

    NSString *targetURLString = applinkData[@"target_url"];
    NSURL *targetURL = [targetURLString isKindOfClass:[NSString class]] ? [NSURL URLWithString:targetURLString] : nil;

    NSMutableDictionary *logData = [[NSMutableDictionary alloc] init];
    [FBSDKInternalUtility dictionary:logData setObject:targetURL.absoluteString forKey:@"targetURL"];
    [FBSDKInternalUtility dictionary:logData setObject:targetURL.host forKey:@"targetURLHost"];

    NSDictionary *refererData = applinkData[@"referer_data"];
    if (refererData) {
        [FBSDKInternalUtility dictionary:logData setObject:refererData[@"target_url"] forKey:@"referralTargetURL"];
        [FBSDKInternalUtility dictionary:logData setObject:refererData[@"url"] forKey:@"referralURL"];
        [FBSDKInternalUtility dictionary:logData setObject:refererData[@"app_name"] forKey:@"referralAppName"];
    }
    [FBSDKInternalUtility dictionary:logData setObject:url.absoluteString forKey:@"inputURL"];
    [FBSDKInternalUtility dictionary:logData setObject:url.scheme forKey:@"inputURLScheme"];

    [FBSDKAppEvents logImplicitEvent:FBSDKAppLinkInboundEvent
                          valueToSum:nil
                          parameters:logData
                         accessToken:nil];
}

- (void)_logSDKInitialize
{
    NSMutableDictionary *params = [NSMutableDictionary new];
    params[@"core_lib_included"] = @1;
    if (objc_lookUpClass("FBSDKShareDialog") != nil) {
        params[@"share_lib_included"] = @1;
    }
    if (objc_lookUpClass("FBSDKLoginManager") != nil) {
        params[@"login_lib_included"] = @1;
    }
    if (objc_lookUpClass("FBSDKPlacesManager") != nil) {
        params[@"places_lib_included"] = @1;
    }
    if (objc_lookUpClass("FBSDKMessengerButton") != nil) {
        params[@"messenger_lib_included"] = @1;
    }
    if (objc_lookUpClass("FBSDKMessengerButton") != nil) {
        params[@"messenger_lib_included"] = @1;
    }
    if (objc_lookUpClass("FBSDKTVInterfaceFactory.m") != nil) {
        params[@"tv_lib_included"] = @1;
    }
    if (objc_lookUpClass("FBSDKAutoLog") != nil) {
        params[@"marketing_lib_included"] = @1;
    }
    [FBSDKAppEvents logEvent:@"fb_sdk_initialize" parameters:params];
}

#pragma mark -- (non-tvos)
#if !TARGET_OS_TV
- (BOOL)_handleBridgeAPIResponseURL:(NSURL *)responseURL sourceApplication:(NSString *)sourceApplication
{
    FBSDKBridgeAPIRequest *request = _pendingRequest;
    FBSDKBridgeAPICallbackBlock completionBlock = _pendingRequestCompletionBlock;
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
#endif

@end
