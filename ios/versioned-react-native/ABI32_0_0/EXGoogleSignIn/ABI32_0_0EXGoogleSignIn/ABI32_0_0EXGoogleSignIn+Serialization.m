// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXGoogleSignIn/ABI32_0_0EXGoogleSignIn+Serialization.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXUtilities.h>

@implementation ABI32_0_0EXGoogleSignIn (Serialization)

+ (NSDictionary *)jsonFromGIDSignIn:(GIDSignIn *)input
{
  if (!input) return nil;
  
  return @{
           @"scopes": ABI32_0_0EXNullIfNil([input scopes]),
           @"language": ABI32_0_0EXNullIfNil([input language]),
           @"openIdRealm": ABI32_0_0EXNullIfNil([input openIDRealm]),
           @"accountName": ABI32_0_0EXNullIfNil([input loginHint]),
           @"hostedDomain": ABI32_0_0EXNullIfNil([input hostedDomain]),
           @"webClientId": ABI32_0_0EXNullIfNil([input serverClientID]),
           @"shouldFetchBasicProfile": ABI32_0_0EXNullIfNil(@([input shouldFetchBasicProfile])),
           @"currentUser": ABI32_0_0EXNullIfNil([ABI32_0_0EXGoogleSignIn jsonFromGIDGoogleUser:input.currentUser]),
           @"hasAuthInKeychain": ABI32_0_0EXNullIfNil(@([input hasAuthInKeychain]))
           };
}

+ (NSDictionary *)jsonFromGIDGoogleUser:(GIDGoogleUser *)input
{
  if (!input) return nil;
  
  NSMutableDictionary *output = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                  @"uid": ABI32_0_0EXNullIfNil([input userID]),
                                                                                  @"auth": ABI32_0_0EXNullIfNil([ABI32_0_0EXGoogleSignIn jsonFromGIDAuthentication:[input authentication]]),
                                                                                  @"scopes": ABI32_0_0EXNullIfNil([input grantedScopes]),
                                                                                  @"domain": ABI32_0_0EXNullIfNil([input hostedDomain]),
                                                                                  @"serverAuthCode": ABI32_0_0EXNullIfNil([input serverAuthCode]),
                                                                                  }];
  
  
  NSDictionary *profileData = [ABI32_0_0EXGoogleSignIn jsonFromGIDProfileData:[input profile]];
  if (profileData != nil) {
    [output addEntriesFromDictionary:profileData];
  }

  return output;
}

+ (NSNumber *)jsonFromNSDate:(NSDate *)input
{
  if (!input) return nil;
  return [NSNumber numberWithDouble:input.timeIntervalSinceNow];
}

+ (NSDictionary *)jsonFromGIDAuthentication:(GIDAuthentication *)input
{
  if (!input) return nil;
  return @{
           @"clientId": ABI32_0_0EXNullIfNil([input clientID]),
           @"accessToken": ABI32_0_0EXNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": ABI32_0_0EXNullIfNil([ABI32_0_0EXGoogleSignIn jsonFromNSDate:[input accessTokenExpirationDate]]),
           @"refreshToken": ABI32_0_0EXNullIfNil([input refreshToken]),
           @"idToken": ABI32_0_0EXNullIfNil([input idToken]),
           @"idTokenExpirationDate": ABI32_0_0EXNullIfNil([ABI32_0_0EXGoogleSignIn jsonFromNSDate:[input idTokenExpirationDate]])
           };
}

+ (NSDictionary *)jsonFromGIDProfileData:(GIDProfileData *)input
{
  if (!input) return nil;
  NSMutableDictionary *output =
  [NSMutableDictionary dictionaryWithDictionary:@{
                                                  @"email": ABI32_0_0EXNullIfNil([input email]),
                                                  @"displayName": ABI32_0_0EXNullIfNil([input name]),
                                                  @"firstName": ABI32_0_0EXNullIfNil([input givenName]),
                                                  @"lastName": ABI32_0_0EXNullIfNil([input familyName]),
                                                  }];
  if (input.hasImage) {
    NSURL *imageURL = [input imageURLWithDimension:128];
    if (imageURL) [output setValue:[imageURL absoluteString] forKey:@"photoURL"];
  }
  return output;
}

+ (NSString *)jsonFromGIDSignInErrorCode:(GIDSignInErrorCode)input
{
  switch (input) {
    case kGIDSignInErrorCodeKeychain:
      return @"A problem reading or writing to the application keychain.";
    case kGIDSignInErrorCodeNoSignInHandlersInstalled:
      return @"No appropriate applications are installed on the user's device which can handle sign-in. This code will only ever be returned if using webview and switching to browser have both been disabled.";
    case kGIDSignInErrorCodeHasNoAuthInKeychain:
      return @"There are no auth tokens in the keychain. This error code will be returned by signInSilently if the user has never signed in before with the given scopes, or if they have since signed out.";
    case kGIDSignInErrorCodeCanceled:
      return @"The user canceled the sign in request.";
    case kGIDSignInErrorCodeEMM:
      return @"An Enterprise Mobility Management related error has occurred.";
    case kGIDSignInErrorCodeUnknown:
    default:
      return @"kGIDSignInErrorCodeUnknown: An unknown error has occurred.";
  }
}
@end
