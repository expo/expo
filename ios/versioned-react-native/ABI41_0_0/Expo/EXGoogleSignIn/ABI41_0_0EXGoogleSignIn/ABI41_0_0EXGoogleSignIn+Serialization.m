// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXGoogleSignIn/ABI41_0_0EXGoogleSignIn+Serialization.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMUtilities.h>

@implementation ABI41_0_0EXGoogleSignIn (Serialization)

+ (NSDictionary *)jsonFromGIDSignIn:(GIDSignIn *)input
{
  if (!input) return nil;
  
  return @{
           @"scopes": ABI41_0_0UMNullIfNil([input scopes]),
           @"language": ABI41_0_0UMNullIfNil([input language]),
           @"openIdRealm": ABI41_0_0UMNullIfNil([input openIDRealm]),
           @"accountName": ABI41_0_0UMNullIfNil([input loginHint]),
           @"hostedDomain": ABI41_0_0UMNullIfNil([input hostedDomain]),
           @"webClientId": ABI41_0_0UMNullIfNil([input serverClientID]),
           @"shouldFetchBasicProfile": ABI41_0_0UMNullIfNil(@([input shouldFetchBasicProfile])),
           @"currentUser": ABI41_0_0UMNullIfNil([ABI41_0_0EXGoogleSignIn jsonFromGIDGoogleUser:input.currentUser]),
           @"hasAuthInKeychain": ABI41_0_0UMNullIfNil(@([input hasPreviousSignIn]))
           };
}

+ (NSDictionary *)jsonFromGIDGoogleUser:(GIDGoogleUser *)input
{
  if (!input) return nil;
  
  NSMutableDictionary *output = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                  @"uid": ABI41_0_0UMNullIfNil([input userID]),
                                                                                  @"auth": ABI41_0_0UMNullIfNil([ABI41_0_0EXGoogleSignIn jsonFromGIDAuthentication:[input authentication]]),
                                                                                  @"scopes": ABI41_0_0UMNullIfNil([input grantedScopes]),
                                                                                  @"domain": ABI41_0_0UMNullIfNil([input hostedDomain]),
                                                                                  @"serverAuthCode": ABI41_0_0UMNullIfNil([input serverAuthCode]),
                                                                                  }];
  
  
  NSDictionary *profileData = [ABI41_0_0EXGoogleSignIn jsonFromGIDProfileData:[input profile]];
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
           @"clientId": ABI41_0_0UMNullIfNil([input clientID]),
           @"accessToken": ABI41_0_0UMNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": ABI41_0_0UMNullIfNil([ABI41_0_0EXGoogleSignIn jsonFromNSDate:[input accessTokenExpirationDate]]),
           @"refreshToken": ABI41_0_0UMNullIfNil([input refreshToken]),
           @"idToken": ABI41_0_0UMNullIfNil([input idToken]),
           @"idTokenExpirationDate": ABI41_0_0UMNullIfNil([ABI41_0_0EXGoogleSignIn jsonFromNSDate:[input idTokenExpirationDate]])
           };
}

+ (NSDictionary *)jsonFromGIDProfileData:(GIDProfileData *)input
{
  if (!input) return nil;
  NSMutableDictionary *output =
  [NSMutableDictionary dictionaryWithDictionary:@{
                                                  @"email": ABI41_0_0UMNullIfNil([input email]),
                                                  @"displayName": ABI41_0_0UMNullIfNil([input name]),
                                                  @"firstName": ABI41_0_0UMNullIfNil([input givenName]),
                                                  @"lastName": ABI41_0_0UMNullIfNil([input familyName]),
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
