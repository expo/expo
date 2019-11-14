/*
 * GIDAuthentication.h
 * Google Sign-In iOS SDK
 *
 * Copyright 2014 Google Inc.
 *
 * Use of this SDK is subject to the Google APIs Terms of Service:
 * https://developers.google.com/terms/
 */

#import <Foundation/Foundation.h>

@protocol GTMFetcherAuthorizationProtocol;
@class GIDAuthentication;

// @relates GIDAuthentication
//
// The callback block that takes a GIDAuthentication, or an error if attempt to refresh was
// unsuccessful.
typedef void (^GIDAuthenticationHandler)(GIDAuthentication *authentication, NSError *error);

// @relates GIDAuthentication
//
// The callback block that takes an access token, or an error if attempt to refresh was
// unsuccessful.
typedef void (^GIDAccessTokenHandler)(NSString *accessToken, NSError *error);

// This class represents the OAuth 2.0 entities needed for sign-in.
@interface GIDAuthentication : NSObject <NSSecureCoding>

// The client ID associated with the authentication.
@property(nonatomic, readonly) NSString *clientID;

// The OAuth2 access token to access Google services.
@property(nonatomic, readonly) NSString *accessToken;

// The estimated expiration date of the access token.
@property(nonatomic, readonly) NSDate *accessTokenExpirationDate;

// The OAuth2 refresh token to exchange for new access tokens.
@property(nonatomic, readonly) NSString *refreshToken;

// An OpenID Connect ID token that identifies the user. Send this token to your server to
// authenticate the user there. For more information on this topic, see
// https://developers.google.com/identity/sign-in/ios/backend-auth
@property(nonatomic, readonly) NSString *idToken;

// The estimated expiration date of the ID token.
@property(nonatomic, readonly) NSDate *idTokenExpirationDate;

// Gets a new authorizer for GTLService, GTMSessionFetcher, or GTMHTTPFetcher.
- (id<GTMFetcherAuthorizationProtocol>)fetcherAuthorizer;

// Get a valid access token and a valid ID token, refreshing them first if they have expired or are
// about to expire.
- (void)getTokensWithHandler:(GIDAuthenticationHandler)handler;

// Refreshes the access token and the ID token using the refresh token.
- (void)refreshTokensWithHandler:(GIDAuthenticationHandler)handler;

@end
