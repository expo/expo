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
  // Indicates an unknown error has occurred.
  kGIDSignInErrorCodeUnknown = -1,
  // Indicates a problem reading or writing to the application keychain.
  kGIDSignInErrorCodeKeychain = -2,
  // Indicates there are no valid auth tokens in the keychain. This error code will be returned by
  // |restorePreviousSignIn| if the user has not signed in before or if they have since signed out.
  kGIDSignInErrorCodeHasNoAuthInKeychain = -4,
  // Indicates the user canceled the sign in request.
  kGIDSignInErrorCodeCanceled = -5,
  // Indicates an Enterprise Mobility Management related error has occurred.
  kGIDSignInErrorCodeEMM = -6,
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

// This class signs the user in with Google. It also provides single sign-on via a capable Google
// app if one is installed.
//
// For reference, please see "Google Sign-In for iOS" at
// https://developers.google.com/identity/sign-in/ios
// Here is sample code to use |GIDSignIn|:
// 1. Get a reference to the |GIDSignIn| shared instance:
//    GIDSignIn *signIn = [GIDSignIn sharedInstance];
// 2. Call [signIn setDelegate:self];
// 3. Set up delegate method |signIn:didSignInForUser:withError:|.
// 4. Call |handleURL| on the shared instance from |application:openUrl:...| in your app delegate.
// 5. Call |signIn| on the shared instance;
@interface GIDSignIn : NSObject

// The authentication object for the current user, or |nil| if there is currently no logged in user.
@property(nonatomic, readonly) GIDGoogleUser *currentUser;

// The object to be notified when authentication is finished.
@property(nonatomic, weak) id<GIDSignInDelegate> delegate;

// The view controller used to present |SFSafariViewContoller| on iOS 9 and 10.
@property(nonatomic, weak) UIViewController *presentingViewController;

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

// Use |sharedInstance| to instantiate |GIDSignIn|.
+ (instancetype)new NS_UNAVAILABLE;

// Use |sharedInstance| to instantiate |GIDSignIn|.
- (instancetype)init NS_UNAVAILABLE;

// This method should be called from your |UIApplicationDelegate|'s |application:openURL:options|
// and or |application:openURL:sourceApplication:annotation| method(s). Returns |YES| if |GIDSignIn|
// handled this URL.
- (BOOL)handleURL:(NSURL *)url;

// Checks if there is a previously authenticated user saved in keychain.
- (BOOL)hasPreviousSignIn;

// Attempts to restore a previously authenticated user without interaction.  The delegate will be
// called at the end of this process indicating success or failure.  The current values of
// |GIDSignIn|'s configuration properties will not impact the restored user.
- (void)restorePreviousSignIn;

// Starts an interactive sign-in flow using |GIDSignIn|'s configuration properties.  The delegate
// will be called at the end of this process.  Any saved sign-in state will be replaced by the
// result of this flow.  Note that this method should not be called when the app is starting up,
// (e.g in application:didFinishLaunchingWithOptions:), instead use the |restorePreviousSignIn|
// method to restore a previous sign-in.
- (void)signIn;

// Marks current user as being in the signed out state.
- (void)signOut;

// Disconnects the current user from the app and revokes previous authentication. If the operation
// succeeds, the OAuth 2.0 token is also removed from keychain.
- (void)disconnect;

@end
