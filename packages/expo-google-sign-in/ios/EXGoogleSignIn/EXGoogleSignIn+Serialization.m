//
//  EXGoogleSignIn+Serialization.m
//  EXGoogleSignIn
//
//  Created by Evan Bacon on 10/19/18.
//

#import "EXGoogleSignIn+Serialization.h"

@implementation EXGoogleSignIn (Serialization)

id nullIfNil(id input) {
  if (!input || input == nil) {
    return [NSNull null];
  }
  return input;
}

+ (NSDictionary *)jsonFromGIDSignIn:(GIDSignIn *)input
{
  if (!input) return nullIfNil(nil);
  return @{
           @"scopes": nullIfNil([input scopes]),
           @"language": nullIfNil([input language]),
           @"openIdRealm": nullIfNil([input openIDRealm]),
           @"accountName": nullIfNil([input loginHint]),
           @"hostedDomain": nullIfNil([input hostedDomain]),
           @"webClientId": nullIfNil([input serverClientID]),
           @"shouldFetchBasicProfile": nullIfNil(@([input shouldFetchBasicProfile])),
           @"currentUser": nullIfNil([EXGoogleSignIn jsonFromGIDGoogleUser:input.currentUser]),
           @"hasAuthInKeychain": nullIfNil(@([input hasAuthInKeychain]))
           };
}

+ (NSDictionary *)jsonFromGIDGoogleUser:(GIDGoogleUser *)input
{
  if (!input) return nil;
  
  NSMutableDictionary *output = [[NSMutableDictionary alloc] initWithDictionary:@{
                                                                                  @"uid": nullIfNil([input userID]),
                                                                                  @"auth": nullIfNil([EXGoogleSignIn jsonFromGIDAuthentication:[input authentication]]),
                                                                                  @"scopes": nullIfNil([input grantedScopes]),
                                                                                  @"domain": nullIfNil([input hostedDomain]),
                                                                                  @"serverAuthCode": nullIfNil([input serverAuthCode]),
                                                                                  }];
  
  
  [output addEntriesFromDictionary:[EXGoogleSignIn jsonFromGIDProfileData:[input profile]]];
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
           @"clientId": nullIfNil([input clientID]),
           @"accessToken": nullIfNil([input accessToken]),
           @"accessTokenExpirationDate": nullIfNil([EXGoogleSignIn jsonFromNSDate:[input accessTokenExpirationDate]]),
           @"refreshToken": nullIfNil([input refreshToken]),
           @"idToken": nullIfNil([input idToken]),
           @"idTokenExpirationDate": nullIfNil([EXGoogleSignIn jsonFromNSDate:[input idTokenExpirationDate]])
           };
}

+ (NSDictionary *)jsonFromGIDProfileData:(GIDProfileData *)input
{
  if (!input) return nil;
  NSMutableDictionary *output =
  [NSMutableDictionary dictionaryWithDictionary:@{
                                                  @"email": nullIfNil([input email]),
                                                  @"displayName": nullIfNil([input name]),
                                                  @"firstName": nullIfNil([input givenName]),
                                                  @"lastName": nullIfNil([input familyName]),
                                                  }];
  if (input.hasImage) {
    NSURL *imageURL = [input imageURLWithDimension:128];
    if (imageURL) [output setValue:[imageURL absoluteString] forKey:@"photoURL"];
  }
  return output;
}

+ (NSString *)jsonFromGIDSignInErrorCode:(GIDSignInErrorCode)input
{
  if (!input) return nullIfNil(nil);
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
