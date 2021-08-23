// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXGoogleSignIn/EXGoogleSignIn+Serialization.h>
#import <ExpoModulesCore/EXUtilities.h>

@implementation EXGoogleSignIn (Serialization)

+ (NSDictionary *)jsonFromGIDSignIn:(GIDSignIn *)input
{
  if (!input) return nil;
  
  return @{
           @"scopes": EXNullIfNil([input scopes]),
           @"language": EXNullIfNil([input language]),
           @"openIdRealm": EXNullIfNil([input openIDRealm]),
           @"accountName": EXNullIfNil([input loginHint]),
           @"hostedDomain": EXNullIfNil([input hostedDomain]),
           @"webClientId": EXNullIfNil([input serverClientID]),
           @"shouldFetchBasicProfile": EXNullIfNil(@([input shouldFetchBasicProfile])),
           @"currentUser": EXNullIfNil([EXGoogleSignIn jsonFromGIDGoogleUser:input.currentUser]),
           @"hasAuthInKeychain": EXNullIfNil(@([input hasPreviousSignIn]))
           };
}

+ (NSDictionary *)jsonFromGIDGoogleUser:(GIDGoogleUser *)input
{
  if (!input) return nil;
  
  NSMutableDictionary *output = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                  @"uid": EXNullIfNil([input userID]),
                                                                                  @"auth": EXNullIfNil([EXGoogleSignIn jsonFromGIDAuthentication:[input authentication]]),
                                                                                  @"scopes": EXNullIfNil([input grantedScopes]),
                                                                                  @"domain": EXNullIfNil([input hostedDomain]),
                                                                                  @"serverAuthCode": EXNullIfNil([input serverAuthCode]),
                                                                                  }];
  
  
  NSDictionary *profileData = [EXGoogleSignIn jsonFromGIDProfileData:[input profile]];
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
           @"clientId": EXNullIfNil([input clientID]),
           @"accessToken": EXNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": EXNullIfNil([EXGoogleSignIn jsonFromNSDate:[input accessTokenExpirationDate]]),
           @"refreshToken": EXNullIfNil([input refreshToken]),
           @"idToken": EXNullIfNil([input idToken]),
           @"idTokenExpirationDate": EXNullIfNil([EXGoogleSignIn jsonFromNSDate:[input idTokenExpirationDate]])
           };
}

+ (NSDictionary *)jsonFromGIDProfileData:(GIDProfileData *)input
{
  if (!input) return nil;
  NSMutableDictionary *output =
  [NSMutableDictionary dictionaryWithDictionary:@{
                                                  @"email": EXNullIfNil([input email]),
                                                  @"displayName": EXNullIfNil([input name]),
                                                  @"firstName": EXNullIfNil([input givenName]),
                                                  @"lastName": EXNullIfNil([input familyName]),
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
