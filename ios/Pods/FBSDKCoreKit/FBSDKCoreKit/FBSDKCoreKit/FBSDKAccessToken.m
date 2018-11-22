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

#import "FBSDKAccessToken.h"

#import "FBSDKGraphRequestPiggybackManager.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKMath.h"
#import "FBSDKSettings+Internal.h"

NSString *const FBSDKAccessTokenDidChangeNotification = @"com.facebook.sdk.FBSDKAccessTokenData.FBSDKAccessTokenDidChangeNotification";
NSString *const FBSDKAccessTokenDidChangeUserID = @"FBSDKAccessTokenDidChangeUserID";
NSString *const FBSDKAccessTokenChangeNewKey = @"FBSDKAccessToken";
NSString *const FBSDKAccessTokenChangeOldKey = @"FBSDKAccessTokenOld";
NSString *const FBSDKAccessTokenDidExpire = @"FBSDKAccessTokenDidExpire";

static FBSDKAccessToken *g_currentAccessToken;

#define FBSDK_ACCESSTOKEN_TOKENSTRING_KEY @"tokenString"
#define FBSDK_ACCESSTOKEN_PERMISSIONS_KEY @"permissions"
#define FBSDK_ACCESSTOKEN_DECLINEDPERMISSIONS_KEY @"declinedPermissions"
#define FBSDK_ACCESSTOKEN_APPID_KEY @"appID"
#define FBSDK_ACCESSTOKEN_USERID_KEY @"userID"
#define FBSDK_ACCESSTOKEN_REFRESHDATE_KEY @"refreshDate"
#define FBSDK_ACCESSTOKEN_EXPIRATIONDATE_KEY @"expirationDate"
#define FBSDK_ACCESSTOKEN_DATA_EXPIRATIONDATE_KEY @"dataAccessExpirationDate"


@implementation FBSDKAccessToken

- (instancetype)init NS_UNAVAILABLE
{
  assert(0);
}

- (instancetype)initWithTokenString:(NSString *)tokenString
                        permissions:(NSArray *)permissions
                declinedPermissions:(NSArray *)declinedPermissions
                              appID:(NSString *)appID
                             userID:(NSString *)userID
                     expirationDate:(NSDate *)expirationDate
                        refreshDate:(NSDate *)refreshDate
{
    return [self initWithTokenString:tokenString
                         permissions:permissions
                 declinedPermissions:declinedPermissions
                               appID:appID
                              userID:userID
                      expirationDate:expirationDate
                         refreshDate:refreshDate
            dataAccessExpirationDate:[NSDate distantFuture]];
}

- (instancetype)initWithTokenString:(NSString *)tokenString
                        permissions:(NSArray *)permissions
                declinedPermissions:(NSArray *)declinedPermissions
                              appID:(NSString *)appID
                             userID:(NSString *)userID
                     expirationDate:(NSDate *)expirationDate
                        refreshDate:(NSDate *)refreshDate
                  dataAccessExpirationDate:(NSDate *)dataAccessExpirationDate
{
  if ((self = [super init])) {
    _tokenString = [tokenString copy];
    _permissions = [NSSet setWithArray:permissions];
    _declinedPermissions = [NSSet setWithArray:declinedPermissions];
    _appID = [appID copy];
    _userID = [userID copy];
    _expirationDate = [expirationDate copy] ?: [NSDate distantFuture];
    _refreshDate = [refreshDate copy] ?: [NSDate date];
    _dataAccessExpirationDate = [dataAccessExpirationDate copy] ?: [NSDate distantFuture];
  }
  return self;
}

- (BOOL)hasGranted:(NSString *)permission
{
  return [self.permissions containsObject:permission];

}

- (BOOL)isDataAccessExpired
{
    return [self.dataAccessExpirationDate compare:NSDate.date] == NSOrderedAscending;
}

- (BOOL)isExpired
{
  return [self.expirationDate compare:NSDate.date] == NSOrderedAscending;
}

+ (FBSDKAccessToken *)currentAccessToken
{
  return g_currentAccessToken;
}

+ (void)setCurrentAccessToken:(FBSDKAccessToken *)token
{
  if (token != g_currentAccessToken) {
    NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
    [FBSDKInternalUtility dictionary:userInfo setObject:token forKey:FBSDKAccessTokenChangeNewKey];
    [FBSDKInternalUtility dictionary:userInfo setObject:g_currentAccessToken forKey:FBSDKAccessTokenChangeOldKey];
    // We set this flag also when the current Access Token was not valid, since there might be legacy code relying on it
    if (![g_currentAccessToken.userID isEqualToString:token.userID] || ![self currentAccessTokenIsActive]) {
      userInfo[FBSDKAccessTokenDidChangeUserID] = @YES;
    }

    g_currentAccessToken = token;

    // Only need to keep current session in web view for the case when token is current
    // When token is abandoned cookies must to be cleaned up immediately
    if (token == nil) {
      [FBSDKInternalUtility deleteFacebookCookies];
    }

    [[FBSDKSettings accessTokenCache] cacheAccessToken:token];
    [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKAccessTokenDidChangeNotification
                                                        object:[self class]
                                                      userInfo:userInfo];
  }
}

+ (BOOL)currentAccessTokenIsActive
{
  FBSDKAccessToken *currentAccessToken = [self currentAccessToken];
  return currentAccessToken != nil && !currentAccessToken.isExpired;
}

+ (void)refreshCurrentAccessToken:(FBSDKGraphRequestHandler)completionHandler
{
  if ([FBSDKAccessToken currentAccessToken]) {
    FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
    [FBSDKGraphRequestPiggybackManager addRefreshPiggyback:connection permissionHandler:completionHandler];
    [connection start];
  } else {
    if (completionHandler) {
      completionHandler(nil, nil, [FBSDKError errorWithCode:FBSDKAccessTokenRequiredErrorCode message:@"No current access token to refresh"]);
    }
  }
}

#pragma mark - Equality

- (NSUInteger)hash
{
  NSUInteger subhashes[] = {
    [self.tokenString hash],
    [self.permissions hash],
    [self.declinedPermissions hash],
    [self.appID hash],
    [self.userID hash],
    [self.refreshDate hash],
    [self.expirationDate hash],
    [self.dataAccessExpirationDate hash]
  };
  return [FBSDKMath hashWithIntegerArray:subhashes count:sizeof(subhashes) / sizeof(subhashes[0])];
}

- (BOOL)isEqual:(id)object
{
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[FBSDKAccessToken class]]) {
    return NO;
  }
  return [self isEqualToAccessToken:(FBSDKAccessToken *)object];
}

- (BOOL)isEqualToAccessToken:(FBSDKAccessToken *)token
{
  return (token &&
          [FBSDKInternalUtility object:self.tokenString isEqualToObject:token.tokenString] &&
          [FBSDKInternalUtility object:self.permissions isEqualToObject:token.permissions] &&
          [FBSDKInternalUtility object:self.declinedPermissions isEqualToObject:token.declinedPermissions] &&
          [FBSDKInternalUtility object:self.appID isEqualToObject:token.appID] &&
          [FBSDKInternalUtility object:self.userID isEqualToObject:token.userID] &&
          [FBSDKInternalUtility object:self.refreshDate isEqualToObject:token.refreshDate] &&
          [FBSDKInternalUtility object:self.expirationDate isEqualToObject:token.expirationDate] &&
          [FBSDKInternalUtility object:self.dataAccessExpirationDate isEqualToObject:token.dataAccessExpirationDate] );
}

#pragma mark - NSCopying

- (id)copyWithZone:(NSZone *)zone
{
  // we're immutable.
  return self;
}

#pragma mark NSCoding

+ (BOOL)supportsSecureCoding
{
  return YES;
}

- (id)initWithCoder:(NSCoder *)decoder
{
  NSString *appID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_ACCESSTOKEN_APPID_KEY];
  NSSet *declinedPermissions = [decoder decodeObjectOfClass:[NSSet class] forKey:FBSDK_ACCESSTOKEN_DECLINEDPERMISSIONS_KEY];
  NSSet *permissions = [decoder decodeObjectOfClass:[NSSet class] forKey:FBSDK_ACCESSTOKEN_PERMISSIONS_KEY];
  NSString *tokenString = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_ACCESSTOKEN_TOKENSTRING_KEY];
  NSString *userID = [decoder decodeObjectOfClass:[NSString class] forKey:FBSDK_ACCESSTOKEN_USERID_KEY];
  NSDate *refreshDate = [decoder decodeObjectOfClass:[NSDate class] forKey:FBSDK_ACCESSTOKEN_REFRESHDATE_KEY];
  NSDate *expirationDate = [decoder decodeObjectOfClass:[NSDate class] forKey:FBSDK_ACCESSTOKEN_EXPIRATIONDATE_KEY];
  NSDate *dataAccessExpirationDate = [decoder decodeObjectOfClass:[NSDate class] forKey:FBSDK_ACCESSTOKEN_DATA_EXPIRATIONDATE_KEY];

  return [self initWithTokenString:tokenString
                       permissions:[permissions allObjects]
               declinedPermissions:[declinedPermissions allObjects]
                             appID:appID
                            userID:userID
                    expirationDate:expirationDate
                       refreshDate:refreshDate
          dataAccessExpirationDate:dataAccessExpirationDate];
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
  [encoder encodeObject:self.appID forKey:FBSDK_ACCESSTOKEN_APPID_KEY];
  [encoder encodeObject:self.declinedPermissions forKey:FBSDK_ACCESSTOKEN_DECLINEDPERMISSIONS_KEY];
  [encoder encodeObject:self.permissions forKey:FBSDK_ACCESSTOKEN_PERMISSIONS_KEY];
  [encoder encodeObject:self.tokenString forKey:FBSDK_ACCESSTOKEN_TOKENSTRING_KEY];
  [encoder encodeObject:self.userID forKey:FBSDK_ACCESSTOKEN_USERID_KEY];
  [encoder encodeObject:self.expirationDate forKey:FBSDK_ACCESSTOKEN_EXPIRATIONDATE_KEY];
  [encoder encodeObject:self.refreshDate forKey:FBSDK_ACCESSTOKEN_REFRESHDATE_KEY];
  [encoder encodeObject:self.dataAccessExpirationDate forKey:FBSDK_ACCESSTOKEN_DATA_EXPIRATIONDATE_KEY];
}

@end
