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

#import "FBSDKGraphRequestPiggybackManager.h"

#import "FBSDKCoreKit+Internal.h"

static int const FBSDKTokenRefreshThresholdSeconds = 24 * 60 * 60; // day
static int const FBSDKTokenRefreshRetrySeconds = 60 * 60; // hour

@implementation FBSDKGraphRequestPiggybackManager

static NSDate *_lastRefreshTry = nil;

+ (void)addPiggybackRequests:(FBSDKGraphRequestConnection *)connection
{
  if ([FBSDKSettings appID].length > 0) {
    BOOL safeForPiggyback = YES;
    for (FBSDKGraphRequestMetadata *metadata in connection.requests) {
      if (![self _safeForPiggyback:metadata.request]) {
        safeForPiggyback = NO;
        break;
      }
    }
    if (safeForPiggyback) {
      [[self class] addRefreshPiggybackIfStale:connection];
      [[self class] addServerConfigurationPiggyback:connection];
    }
  }
}

+ (void)addRefreshPiggyback:(FBSDKGraphRequestConnection *)connection permissionHandler:(FBSDKGraphRequestBlock)permissionHandler
{
  FBSDKAccessToken *expectedToken = [FBSDKAccessToken currentAccessToken];
  if (!expectedToken) {
    return;
  }
  __block NSMutableSet *permissions = nil;
  __block NSMutableSet *declinedPermissions = nil;
  __block NSMutableSet *expiredPermissions = nil;
  __block NSString *tokenString = nil;
  __block NSNumber *expirationDateNumber = nil;
  __block NSNumber *dataAccessExpirationDateNumber = nil;
  __block NSString *graphDomain = nil;
  __block int expectingCallbacksCount = 2;
  void (^expectingCallbackComplete)(void) = ^{
    if (--expectingCallbacksCount == 0) {
      FBSDKAccessToken *currentToken = [FBSDKAccessToken currentAccessToken];
      NSDate *expirationDate = currentToken.expirationDate;
      if (expirationDateNumber != nil) {
        expirationDate = (expirationDateNumber.doubleValue > 0
          ? [NSDate dateWithTimeIntervalSince1970:expirationDateNumber.doubleValue]
          : [NSDate distantFuture]);
      }
      NSDate *dataExpirationDate = currentToken.dataAccessExpirationDate;
      if (dataAccessExpirationDateNumber != nil) {
        dataExpirationDate = (dataAccessExpirationDateNumber.doubleValue > 0
          ? [NSDate dateWithTimeIntervalSince1970:dataAccessExpirationDateNumber.doubleValue]
          : [NSDate distantFuture]);
      }

      #pragma clang diagnostic push
      #pragma clang diagnostic ignored "-Wdeprecated-declarations"
      FBSDKAccessToken *refreshedToken = [[FBSDKAccessToken alloc] initWithTokenString:tokenString ?: currentToken.tokenString
                                                                           permissions:(permissions ?: currentToken.permissions).allObjects
                                                                   declinedPermissions:(declinedPermissions ?: currentToken.declinedPermissions).allObjects
                                                                    expiredPermissions:(expiredPermissions ?: currentToken.expiredPermissions).allObjects
                                                                                 appID:currentToken.appID
                                                                                userID:currentToken.userID
                                                                        expirationDate:expirationDate
                                                                           refreshDate:[NSDate date]
                                                              dataAccessExpirationDate:dataExpirationDate
                                                                           graphDomain:graphDomain ?: currentToken.graphDomain];
      #pragma clange diagnostic pop

      if (expectedToken == currentToken) {
        [FBSDKAccessToken setCurrentAccessToken:refreshedToken];
      }
    }
  };
  FBSDKGraphRequest *extendRequest = [[FBSDKGraphRequest alloc] initWithGraphPath:@"oauth/access_token"
                                                                       parameters:@{@"grant_type" : @"fb_extend_sso_token",
                                                                                    @"fields" : @"",
                                                                                    @"client_id" : expectedToken.appID}
                                                                            flags:FBSDKGraphRequestFlagDisableErrorRecovery];

  [connection addRequest:extendRequest completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    tokenString = [FBSDKTypeUtility dictionary:result objectForKey:@"access_token" ofType:NSString.class];
    expirationDateNumber = [FBSDKTypeUtility dictionary:result objectForKey:@"expires_at" ofType:NSNumber.class];
    dataAccessExpirationDateNumber = [FBSDKTypeUtility dictionary:result objectForKey:@"data_access_expiration_time" ofType:NSNumber.class];
    graphDomain = [FBSDKTypeUtility dictionary:result objectForKey:@"graph_domain" ofType:NSString.class];
    expectingCallbackComplete();
  }];
  FBSDKGraphRequest *permissionsRequest = [[FBSDKGraphRequest alloc] initWithGraphPath:@"me/permissions"
                                                                            parameters:@{@"fields" : @""}
                                                                                 flags:FBSDKGraphRequestFlagDisableErrorRecovery];

  [connection addRequest:permissionsRequest completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    if (!error) {
      permissions = [NSMutableSet set];
      declinedPermissions = [NSMutableSet set];
      expiredPermissions = [NSMutableSet set];

      [FBSDKInternalUtility extractPermissionsFromResponse:result
                                        grantedPermissions:permissions
                                       declinedPermissions:declinedPermissions
                                        expiredPermissions:expiredPermissions];
    }
    expectingCallbackComplete();
    if (permissionHandler) {
      permissionHandler(innerConnection, result, error);
    }
  }];
}

+ (void)addRefreshPiggybackIfStale:(FBSDKGraphRequestConnection *)connection
{
  // don't piggy back more than once an hour as a cheap way of
  // retrying in cases of errors and preventing duplicate refreshes.
  // obviously this is not foolproof but is simple and sufficient.
  NSDate *now = [NSDate date];
  NSDate *tokenRefreshDate = [FBSDKAccessToken currentAccessToken].refreshDate;
  if (tokenRefreshDate
      && [now timeIntervalSinceDate:[self _lastRefreshTry]] > [self _tokenRefreshRetryInSeconds]
      && [now timeIntervalSinceDate:tokenRefreshDate] > [self _tokenRefreshThresholdInSeconds]) {
    [self addRefreshPiggyback:connection permissionHandler:NULL];
    [self _setLastRefreshTry:[NSDate date]];
  }
}

+ (void)addServerConfigurationPiggyback:(FBSDKGraphRequestConnection *)connection
{
  if (![FBSDKServerConfigurationManager cachedServerConfiguration].isDefaults
      && [[NSDate date] timeIntervalSinceDate:[FBSDKServerConfigurationManager cachedServerConfiguration].timestamp]
      < FBSDK_SERVER_CONFIGURATION_MANAGER_CACHE_TIMEOUT) {
    return;
  }
  NSString *appID = [FBSDKSettings appID];
  FBSDKGraphRequest *serverConfigurationRequest = [FBSDKServerConfigurationManager requestToLoadServerConfiguration:appID];
  [connection addRequest:serverConfigurationRequest
       completionHandler:^(FBSDKGraphRequestConnection *conn, id result, NSError *error) {
         [FBSDKServerConfigurationManager processLoadRequestResponse:result error:error appID:appID];
       }];
}

+ (BOOL)_safeForPiggyback:(FBSDKGraphRequest *)request
{
  return [request.version isEqualToString:[FBSDKSettings graphAPIVersion]]
  && !request.hasAttachments;
}

+ (int)_tokenRefreshThresholdInSeconds
{
  return FBSDKTokenRefreshThresholdSeconds;
}

+ (int)_tokenRefreshRetryInSeconds
{
  return FBSDKTokenRefreshRetrySeconds;
}

+ (NSDate *)_lastRefreshTry
{
  if (!_lastRefreshTry) {
    _lastRefreshTry = [NSDate distantPast];
  }
  return _lastRefreshTry;
}

+ (void)_setLastRefreshTry:(NSDate *)date
{
  _lastRefreshTry = date;
}

@end
