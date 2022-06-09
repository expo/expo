// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXGoogleSignIn/ABI45_0_0EXGoogleSignIn+Serialization.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUtilities.h>

@implementation ABI45_0_0EXGoogleSignIn (Serialization)

+ (NSDictionary *)jsonFromGIDSignIn:(GIDSignIn *)input
{
  if (!input) return nil;
  
  return @{
           @"scopes": ABI45_0_0EXNullIfNil([input scopes]),
           @"language": ABI45_0_0EXNullIfNil([input language]),
           @"openIdRealm": ABI45_0_0EXNullIfNil([input openIDRealm]),
           @"accountName": ABI45_0_0EXNullIfNil([input loginHint]),
           @"hostedDomain": ABI45_0_0EXNullIfNil([input hostedDomain]),
           @"webClientId": ABI45_0_0EXNullIfNil([input serverClientID]),
           @"shouldFetchBasicProfile": ABI45_0_0EXNullIfNil(@([input shouldFetchBasicProfile])),
           @"currentUser": ABI45_0_0EXNullIfNil([ABI45_0_0EXGoogleSignIn jsonFromGIDGoogleUser:input.currentUser]),
           @"hasAuthInKeychain": ABI45_0_0EXNullIfNil(@([input hasPreviousSignIn]))
           };
}

+ (NSDictionary *)jsonFromGIDGoogleUser:(GIDGoogleUser *)input
{
  if (!input) return nil;
  
  NSMutableDictionary *output = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                  @"uid": ABI45_0_0EXNullIfNil([input userID]),
                                                                                  @"auth": ABI45_0_0EXNullIfNil([ABI45_0_0EXGoogleSignIn jsonFromGIDAuthentication:[input authentication]]),
                                                                                  @"scopes": ABI45_0_0EXNullIfNil([input grantedScopes]),
                                                                                  @"domain": ABI45_0_0EXNullIfNil([input hostedDomain]),
                                                                                  @"serverAuthCode": ABI45_0_0EXNullIfNil([input serverAuthCode]),
                                                                                  }];
  
  
  NSDictionary *profileData = [ABI45_0_0EXGoogleSignIn jsonFromGIDProfileData:[input profile]];
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
           @"clientId": ABI45_0_0EXNullIfNil([input clientID]),
           @"accessToken": ABI45_0_0EXNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": ABI45_0_0EXNullIfNil([ABI45_0_0EXGoogleSignIn jsonFromNSDate:[input accessTokenExpirationDate]]),
           @"refreshToken": ABI45_0_0EXNullIfNil([input refreshToken]),
           @"idToken": ABI45_0_0EXNullIfNil([input idToken]),
           @"idTokenExpirationDate": ABI45_0_0EXNullIfNil([ABI45_0_0EXGoogleSignIn jsonFromNSDate:[input idTokenExpirationDate]])
           };
}

+ (NSDictionary *)jsonFromGIDProfileData:(GIDProfileData *)input
{
  if (!input) return nil;
  NSMutableDictionary *output =
  [NSMutableDictionary dictionaryWithDictionary:@{
                                                  @"email": ABI45_0_0EXNullIfNil([input email]),
                                                  @"displayName": ABI45_0_0EXNullIfNil([input name]),
                                                  @"firstName": ABI45_0_0EXNullIfNil([input givenName]),
                                                  @"lastName": ABI45_0_0EXNullIfNil([input familyName]),
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
