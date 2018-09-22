/*
 * GIDSignIn.h
 * Google Sign-In iOS SDK
 *
 * Copyright 2012 Google Inc.
 *
 * Use of this SDK is subject to the Google APIs Terms of Service:
 * https://developers.google.com/terms/
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@class GIDGoogleUser;
@class GIDSignIn;

// The error domain for NSErrors returned by the Google Identity SDK.
extern NSString *const kGIDSignInErrorDomain;

// A list of potential error codes returned from the Google Identity SDK.
typedef NS_ENUM(NSInteger, GIDSignInErrorCode) {
  // Indicates an unknown error has occured.
  kGIDSignInErrorCodeUnknown = -1,
  // Indicates a problem reading or writing to the application keychain.
  kGIDSignInErrorCodeKeychain = -2,
  // Indicates no appropriate applications are installed on the user's device which can handle
  // sign-in. This code will only ever be returned if using webview and switching to browser have
  // both been disabled.
  kGIDSignInErrorCodeNoSignInHandlersInstalled = -3,
  // Indicates there are no auth tokens in the keychain. This error code will be returned by
  // signInSilently if the user has never signed in before with the given scopes, or if they have
  // since signed out.
  kGIDSignInErrorCodeHasNoAuthInKeychain = -4,
  // Indicates the user canceled the sign in request.
  kGIDSignInErrorCodeCanceled = -5,
};

// A protocol implemented by the delegate of |GIDSignIn| to receive a refresh token or an error.
@protocol GIDSignInDelegate <NSObject>

// The sign-in flow has finished and was successful if |error| is |nil|.
- (void)signIn:(GIDSignIn *)signIn
    didSignInForUser:(GIDGoogleUser *)user
           withError:(NSError *)error;

@optional

// Finished disconnecting |user| from the app successfully if |error| is |nil|.
- (void)signIn:(GIDSignIn *)signIn
    didDisconnectWithUser:(GIDGoogleUser *)user
                withError:(NSError *)error;

@end

// A protocol which may be implemented by consumers of |GIDSignIn| to be notified of when
// GIDSignIn has finished dispatching the sign-in request.
//
// This protocol is useful for developers who implement their own "Sign In with Google" button.
// Because there may be a brief delay between when the call to |signIn| is made, and when the
// app switch occurs, it is best practice to have the UI react to the user's input by displaying
// a spinner or other UI element. The |signInWillDispatch| method should be used to
// stop or hide the spinner.
@protocol GIDSignInUIDelegate <NSObject>

@optional

// The sign-in flow has finished selecting how to proceed, and the UI should no longer display
// a spinner or other "please wait" element.
- (void)signInWillDispatch:(GIDSignIn *)signIn error:(NSError *)error;

// If implemented, this method will be invoked when sign in needs to display a view controller.
// The view controller should be displayed modally (via UIViewController's |presentViewController|
// method, and not pushed unto a navigation controller's stack.
- (void)signIn:(GIDSignIn *)signIn presentViewController:(UIViewController *)viewController;

// If implemented, this method will be invoked when sign in needs to dismiss a view controller.
// Typically, this should be implemented by calling |dismissViewController| on the passed
// view controller.
- (void)signIn:(GIDSignIn *)signIn dismissViewController:(UIViewController *)viewController;

@end

// This class signs the user in with Google. It also provides single sign-on via a capable Google
// app if one is installed.
//
// For reference, please see "Google Sign-In for iOS" at
// https://developers.google.com/identity/sign-in/ios
// Here is sample code to use |GIDSignIn|:
// 1. Get a reference to the |GIDSignIn| shared instance:
//    GIDSignIn *signIn = [GIDSignIn sharedInstance];
// 2. Set the OAuth 2.0 scopes you want to request:
//    [signIn setScopes:[NSArray arrayWithObject:@"https://www.googleapis.com/auth/plus.login"]];
// 3. Call [signIn setDelegate:self];
// 4. Set up delegate method |signIn:didSignInForUser:withError:|.
// 5. Call |handleURL| on the shared instance from |application:openUrl:...| in your app delegate.
// 6. Call |signIn| on the shared instance;
@interface GIDSignIn : NSObject

// The authentication object for the current user, or |nil| if there is currently no logged in user.
@property(nonatomic, readonly) GIDGoogleUser *currentUser;

// The object to be notified when authentication is finished.
@property(nonatomic, weak) id<GIDSignInDelegate> delegate;

// The object to be notified when sign in dispatch selection is finished.
@property(nonatomic, weak) id<GIDSignInUIDelegate> uiDelegate;

// The client ID of the app from the Google APIs console.  Must set for sign-in to work.
@property(nonatomic, copy) NSString *clientID;

// The API scopes requested by the app in an array of |NSString|s.  The default value is |@[]|.
//
// This property is optional. If you set it, set it before calling |signIn|.
@property(nonatomic, copy) NSArray *scopes;

// Whether or not to fetch basic profile data after signing in. The data is saved in the
// |GIDGoogleUser.profileData| object.
//
// Setting the flag will add "email" and "profile" to scopes.
// Defaults to |YES|.
@property(nonatomic, assign) BOOL shouldFetchBasicProfile;

// Whether or not to switch to Chrome or Safari if no suitable Google apps are installed.
// Defaults to |YES|.
@property(nonatomic, assign) BOOL allowsSignInWithBrowser;

// Whether or not to support sign-in via a web view.
// Defaults to |YES|.
@property(nonatomic, assign) BOOL allowsSignInWithWebView;

// The language for sign-in, in the form of ISO 639-1 language code optionally followed by a dash
// and ISO 3166-1 alpha-2 region code, such as |@"it"| or |@"pt-PT"|. Only set if different from
// system default.
//
// This property is optional. If you set it, set it before calling |signIn|.
@property(nonatomic, copy) NSString *language;

// The login hint to the authorization server, for example the user's ID, or email address,
// to be prefilled if possible.
//
// This property is optional. If you set it, set it before calling |signIn|.
@property(nonatomic, copy) NSString *loginHint;

// The client ID of the home web server.  This will be returned as the |audience| property of the
// OpenID Connect ID token.  For more info on the ID token:
// https://developers.google.com/identity/sign-in/ios/backend-auth
//
// This property is optional. If you set it, set it before calling |signIn|.
@property(nonatomic, copy) NSString *serverClientID;

// The OpenID2 realm of the home web server. This allows Google to include the user's OpenID
// Identifier in the OpenID Connect ID token.
//
// This property is optional. If you set it, set it before calling |signIn|.
@property(nonatomic, copy) NSString *openIDRealm;

// The Google Apps domain to which users must belong to sign in.  To verify, check |GIDGoogleUser|'s
// |hostedDomain| property.
//
// This property is optional. If you set it, set it before calling |signIn|.
@property(nonatomic, copy) NSString *hostedDomain;

// Returns a shared |GIDSignIn| instance.
+ (GIDSignIn *)sharedInstance;

// This method should be called from your |UIApplicationDelegate|'s
// |application:openURL:sourceApplication:annotation|.  Returns |YES| if |GIDSignIn| handled this
// URL.
- (BOOL)handleURL:(NSURL *)url
    sourceApplication:(NSString *)sourceApplication
           annotation:(id)annotation;

// Checks whether the user has either currently signed in or has previous authentication saved in
// keychain.
- (BOOL)hasAuthInKeychain;

// Attempts to sign in a previously authenticated user without interaction.  The delegate will be
// called at the end of this process indicating success or failure.
- (void)signInSilently;

// Starts the sign-in process.  The delegate will be called at the end of this process.  Note that
// this method should not be called when the app is starting up, (e.g in
// application:didFinishLaunchingWithOptions:). Instead use the |signInSilently| method.
- (void)signIn;

// Marks current user as being in the signed out state.
- (void)signOut;

// Disconnects the current user from the app and revokes previous authentication. If the operation
// succeeds, the OAuth 2.0 token is also removed from keychain.
- (void)disconnect;

// DEPRECATED: this method always calls back with |NO| on iOS 9 or above. Do not use this method.
// Checks if a Google app to handle sign in requests is installed on the user's device on iOS 8 or
// below.
- (void)checkGoogleSignInAppInstalled:(void (^)(BOOL isInstalled))callback
    DEPRECATED_MSG_ATTRIBUTE("This method always calls back with |NO| on iOS 9 or above.");

@end
