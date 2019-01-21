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

#import "FBSDKAccessTokenCacheV3.h"

#import "FBSDKAccessToken.h"
#import "FBSDKSettings.h"
#import "FBSDKTypeUtility.h"

NSString *const FBSDKTokenInformationUUIDKey = @"com.facebook.sdk:TokenInformationUUIDKey";

#define FBSDK_TOKEN_INFORMATION_TOKEN_KEY @"com.facebook.sdk:TokenInformationTokenKey"
#define FBSDK_TOKEN_INFORMATION_EXPIRATION_DATE_KEY @"com.facebook.sdk:TokenInformationExpirationDateKey"
#define FBSDK_TOKEN_INFORMATION_USER_FBID_KEY @"com.facebook.sdk:TokenInformationUserFBIDKey"
#define FBSDK_TOKEN_INFORMATION_PERMISSIONS_KEY @"com.facebook.sdk:TokenInformationPermissionsKey"
#define FBSDK_TOKEN_INFORMATION_DECLINED_PERMISSIONS_KEY @"com.facebook.sdk:TokenInformationDeclinedPermissionsKey"
#define FBSDK_TOKEN_INFORMATION_APP_ID_KEY @"com.facebook.sdk:TokenInformationAppIDKey"
#define FBSDK_TOKEN_INFORMATION_REFRESH_DATE_KEY @"com.facebook.sdk:TokenInformationRefreshDateKey"


@implementation FBSDKAccessTokenCacheV3

- (FBSDKAccessToken *)accessToken
{
  // Check NSUserDefaults ( <= v3.16 )
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSDictionary *tokenDictionary = [defaults objectForKey:[FBSDKSettings legacyUserDefaultTokenInformationKeyName]];
  return [[self class] accessTokenForV3Dictionary:tokenDictionary];
}

- (void)clearCache
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  [defaults removeObjectForKey:[FBSDKSettings legacyUserDefaultTokenInformationKeyName]];
  [defaults synchronize];
}

- (void)setAccessToken:(FBSDKAccessToken *)token
{
  //no-op.
  NSAssert(NO, @"deprecated cache FBSDKAccessTokenCacheV3 should not be used to cache a token");
}

+ (FBSDKAccessToken *)accessTokenForV3Dictionary:(NSDictionary *)dictionary
{
  NSString *tokenString = [FBSDKTypeUtility stringValue:dictionary[FBSDK_TOKEN_INFORMATION_TOKEN_KEY]];
  if (tokenString.length > 0) {
    NSDate *expirationDate = dictionary[FBSDK_TOKEN_INFORMATION_EXPIRATION_DATE_KEY];
    // Note we default to valid in cases where expiration date is missing.
    BOOL isExpired = ([expirationDate compare:[NSDate date]] == NSOrderedAscending);
    if (isExpired) {
      return nil;
    }
    return [[FBSDKAccessToken alloc] initWithTokenString:tokenString
                                             permissions:dictionary[FBSDK_TOKEN_INFORMATION_PERMISSIONS_KEY]
                                     declinedPermissions:dictionary[FBSDK_TOKEN_INFORMATION_DECLINED_PERMISSIONS_KEY]
                                                   appID:dictionary[FBSDK_TOKEN_INFORMATION_APP_ID_KEY]
                                                  userID:dictionary[FBSDK_TOKEN_INFORMATION_USER_FBID_KEY]
                                          expirationDate:expirationDate
                                             refreshDate:dictionary[FBSDK_TOKEN_INFORMATION_REFRESH_DATE_KEY]
                                             dataAccessExpirationDate:nil];
  }
  return nil;
}
@end
