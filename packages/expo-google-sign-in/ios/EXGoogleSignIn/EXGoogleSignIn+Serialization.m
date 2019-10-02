// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXGoogleSignIn/EXGoogleSignIn+Serialization.h>
#import <UMCore/UMUtilities.h>

@implementation EXGoogleSignIn (Serialization)

+ (NSDictionary *)jsonFromGIDSignIn:(GIDSignIn *)input
{
  if (!input) return nil;
  
  return @{
           @"scopes": UMNullIfNil([input scopes]),
           @"language": UMNullIfNil([input language]),
           @"openIdRealm": UMNullIfNil([input openIDRealm]),
           @"accountName": UMNullIfNil([input loginHint]),
           @"hostedDomain": UMNullIfNil([input hostedDomain]),
           @"webClientId": UMNullIfNil([input serverClientID]),
           @"shouldFetchBasicProfile": UMNullIfNil(@([input shouldFetchBasicProfile])),
           @"currentUser": UMNullIfNil([EXGoogleSignIn jsonFromGIDGoogleUser:input.currentUser]),
           @"hasAuthInKeychain": UMNullIfNil(@([input hasPreviousSignIn]))
           };
}

+ (NSDictionary *)jsonFromGIDGoogleUser:(GIDGoogleUser *)input
{
  if (!input) return nil;
  
  NSMutableDictionary *output = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                  @"uid": UMNullIfNil([input userID]),
                                                                                  @"auth": UMNullIfNil([EXGoogleSignIn jsonFromGIDAuthentication:[input authentication]]),
                                                                                  @"scopes": UMNullIfNil([input grantedScopes]),
                                                                                  @"domain": UMNullIfNil([input hostedDomain]),
                                                                                  @"serverAuthCode": UMNullIfNil([input serverAuthCode]),
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
           @"clientId": UMNullIfNil([input clientID]),
           @"accessToken": UMNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": UMNullIfNil([EXGoogleSignIn jsonFromNSDate:[input accessTokenExpirationDate]]),
           @"refreshToken": UMNullIfNil([input refreshToken]),
           @"idToken": UMNullIfNil([input idToken]),
           @"idTokenExpirationDate": UMNullIfNil([EXGoogleSignIn jsonFromNSDate:[input idTokenExpirationDate]])
           };
}

+ (NSDictionary *)jsonFromGIDProfileData:(GIDProfileData *)input
{
  if (!input) return nil;
  NSMutableDictionary *output =
  [NSMutableDictionary dictionaryWithDictionary:@{
                                                  @"email": UMNullIfNil([input email]),
                                                  @"displayName": UMNullIfNil([input name]),
                                                  @"firstName": UMNullIfNil([input givenName]),
                                                  @"lastName": UMNullIfNil([input familyName]),
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
