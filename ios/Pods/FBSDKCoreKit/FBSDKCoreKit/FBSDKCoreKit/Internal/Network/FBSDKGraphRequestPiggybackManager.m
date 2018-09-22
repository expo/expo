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

static int const FBSDKTokenRefreshThresholdSeconds = 24 * 60 * 60;  // day
static int const FBSDKTokenRefreshRetrySeconds = 60 * 60;           // hour

@implementation FBSDKGraphRequestPiggybackManager

+ (void)addPiggybackRequests:(FBSDKGraphRequestConnection *)connection
{
  if ([FBSDKSettings appID].length > 0) {
    BOOL safeForPiggyback = YES;
    for (FBSDKGraphRequestMetadata *metadata in connection.requests) {
      if (![metadata.request.version isEqualToString:[FBSDKSettings graphAPIVersion]] ||
          [metadata.request hasAttachments]) {
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

+ (void)addRefreshPiggyback:(FBSDKGraphRequestConnection *)connection permissionHandler:(FBSDKGraphRequestHandler)permissionHandler
{
  FBSDKAccessToken *expectedToken = [FBSDKAccessToken currentAccessToken];
  __block NSMutableSet *permissions = nil;
  __block NSMutableSet *declinedPermissions = nil;
  __block NSString *tokenString = nil;
  __block NSNumber *expirationDateNumber = nil;
  __block int expectingCallbacksCount = 2;
  void (^expectingCallbackComplete)(void) = ^{
    if (--expectingCallbacksCount == 0) {
      FBSDKAccessToken *currentToken = [FBSDKAccessToken currentAccessToken];
      NSDate *expirationDate = currentToken.expirationDate;
      if (expirationDateNumber) {
        expirationDate = ([expirationDateNumber doubleValue] > 0 ?
                          [NSDate dateWithTimeIntervalSince1970:[expirationDateNumber doubleValue]] :
                          [NSDate distantFuture]);
      }
      FBSDKAccessToken *refreshedToken = [[FBSDKAccessToken alloc] initWithTokenString:tokenString ?: currentToken.tokenString
                                                                           permissions:[(permissions ?: currentToken.permissions) allObjects]
                                                                   declinedPermissions:[(declinedPermissions ?: currentToken.declinedPermissions) allObjects]
                                                                                 appID:currentToken.appID
                                                                                userID:currentToken.userID
                                                                        expirationDate:expirationDate
                                                                           refreshDate:[NSDate date]];
      if (expectedToken == currentToken) {
        [FBSDKAccessToken setCurrentAccessToken:refreshedToken];
      }
    }
  };
  FBSDKGraphRequest *extendRequest = [[FBSDKGraphRequest alloc] initWithGraphPath:@"oauth/access_token"
                                                                 parameters:@{@"grant_type" : @"fb_extend_sso_token",
                                                                              @"fields": @""
                                                                              }
                                                                      flags:FBSDKGraphRequestFlagDisableErrorRecovery];

  [connection addRequest:extendRequest completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    tokenString = result[@"access_token"];
    expirationDateNumber = result[@"expires_at"];
    expectingCallbackComplete();
  }];
  FBSDKGraphRequest *permissionsRequest = [[FBSDKGraphRequest alloc] initWithGraphPath:@"me/permissions"
                                                                 parameters:@{@"fields": @""}
                                                                      flags:FBSDKGraphRequestFlagDisableErrorRecovery];

  [connection addRequest:permissionsRequest completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    if (!error) {
      permissions = [NSMutableSet set];
      declinedPermissions = [NSMutableSet set];

      [FBSDKInternalUtility extractPermissionsFromResponse:result
                                        grantedPermissions:permissions
                                       declinedPermissions:declinedPermissions];
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
  static NSDate *lastRefreshTry;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    lastRefreshTry = [NSDate distantPast];
  });

  NSDate *now = [NSDate date];
  NSDate *tokenRefreshDate = [FBSDKAccessToken currentAccessToken].refreshDate;
  if (tokenRefreshDate &&
      [now timeIntervalSinceDate:lastRefreshTry] > FBSDKTokenRefreshRetrySeconds &&
      [now timeIntervalSinceDate:tokenRefreshDate] > FBSDKTokenRefreshThresholdSeconds) {
    [self addRefreshPiggyback:connection permissionHandler:NULL];
    lastRefreshTry = [NSDate date];
  }
}

+ (void)addServerConfigurationPiggyback:(FBSDKGraphRequestConnection *)connection
{
  if (![[FBSDKServerConfigurationManager cachedServerConfiguration] isDefaults]) {
    return;
  }
  NSString *appID = [FBSDKSettings appID];
  FBSDKGraphRequest *serverConfigurationRequest = [FBSDKServerConfigurationManager requestToLoadServerConfiguration:appID];
  [connection addRequest:serverConfigurationRequest
       completionHandler:^(FBSDKGraphRequestConnection *conn, id result, NSError *error) {
         [FBSDKServerConfigurationManager processLoadRequestResponse:result error:error appID:appID];
       }];
}

@end
