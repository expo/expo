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

#import "FBSDKDeviceLoginManager.h"
#import "FBSDKDeviceLoginManagerResult+Internal.h"

#import <FBSDKCoreKit/FBSDKConstants.h>

#ifdef COCOAPODS
#import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>
#else
#import "FBSDKCoreKit+Internal.h"
#endif
#import "FBSDKDeviceLoginCodeInfo+Internal.h"
#import "FBSDKLoginConstants.h"

static NSMutableArray<FBSDKDeviceLoginManager *> *g_loginManagerInstances;

@implementation FBSDKDeviceLoginManager {
  FBSDKDeviceLoginCodeInfo *_codeInfo;
  BOOL _isCancelled;
  NSNetService * _loginAdvertisementService;
  BOOL _isSmartLoginEnabled;
}

+ (void)initialize
{
  if (self == [FBSDKDeviceLoginManager class]) {
    g_loginManagerInstances = [NSMutableArray array];
  }
}

- (instancetype)initWithPermissions:(NSArray<NSString *> *)permissions enableSmartLogin:(BOOL)enableSmartLogin
{
  if ((self = [super init])) {
    _permissions = [permissions copy];
    _isSmartLoginEnabled = enableSmartLogin;
  }
  return self;
}

- (void)start
{
  [FBSDKInternalUtility validateAppID];
  [g_loginManagerInstances addObject:self];

  NSDictionary *parameters = @{
                               @"scope": [self.permissions componentsJoinedByString:@","] ?: @"",
                               @"redirect_uri": self.redirectURL.absoluteString ?: @"",
                               FBSDK_DEVICE_INFO_PARAM: [FBSDKDeviceRequestsHelper getDeviceInfo],
                               };
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:@"device/login"
                                                                 parameters:parameters
                                                                tokenString:[FBSDKInternalUtility validateRequiredClientAccessToken]
                                                                 HTTPMethod:@"POST"
                                                                      flags:FBSDKGraphRequestFlagNone];
  [request setGraphErrorRecoveryDisabled:YES];
  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (error) {
      [self _processError:error];
      return;
    }

    self->_codeInfo = [[FBSDKDeviceLoginCodeInfo alloc]
                                          initWithIdentifier:result[@"code"]
                                          loginCode:result[@"user_code"]
                                          verificationURL:[NSURL URLWithString:result[@"verification_uri"]]
                                          expirationDate:[[NSDate date] dateByAddingTimeInterval:[result[@"expires_in"] doubleValue]]
                                          pollingInterval:[result[@"interval"] integerValue]];

    if (self->_isSmartLoginEnabled) {
      [FBSDKDeviceRequestsHelper startAdvertisementService:self->_codeInfo.loginCode
                                              withDelegate:self
      ];
    }

    [self.delegate deviceLoginManager:self startedWithCodeInfo:self->_codeInfo];
    [self _schedulePoll:self->_codeInfo.pollingInterval];
  }];
 }

- (void)cancel
{
  [FBSDKDeviceRequestsHelper cleanUpAdvertisementService:self];
  _isCancelled = YES;
  [g_loginManagerInstances removeObject:self];
}

#pragma mark - Private impl

- (void)_notifyError:(NSError *)error
{
  [FBSDKDeviceRequestsHelper cleanUpAdvertisementService:self];
  [self.delegate deviceLoginManager:self
                completedWithResult:nil
                              error:error];
  [g_loginManagerInstances removeObject:self];
}

- (void)_notifyToken:(NSString *)tokenString
{
  [FBSDKDeviceRequestsHelper cleanUpAdvertisementService:self];
  void(^completeWithResult)(FBSDKDeviceLoginManagerResult *) = ^(FBSDKDeviceLoginManagerResult *result) {
    [self.delegate deviceLoginManager:self completedWithResult:result error:nil];
    [g_loginManagerInstances removeObject:self];
  };

  if (tokenString) {
    FBSDKGraphRequest *permissionsRequest =
    [[FBSDKGraphRequest alloc] initWithGraphPath:@"me"
                                      parameters:@{@"fields": @"id,permissions"}
                                     tokenString:tokenString
                                      HTTPMethod:@"GET"
                                           flags:FBSDKGraphRequestFlagDisableErrorRecovery];
    [permissionsRequest startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id permissionRawResult, NSError *error) {
      NSString *userID = permissionRawResult[@"id"];
      NSDictionary *permissionResult = permissionRawResult[@"permissions"];
      if (error ||
          !userID ||
          !permissionResult) {
#if TARGET_TV_OS
        NSError *wrappedError = [FBSDKError errorWithDomain:FBSDKShareErrorDomain
                                                       code:FBSDKErrorTVOSUnknown
                                                    message:@"Unable to fetch permissions for token"
                                            underlyingError:error];
#else
        NSError *wrappedError = [FBSDKError errorWithDomain:FBSDKLoginErrorDomain
                                                       code:FBSDKErrorUnknown
                                                    message:@"Unable to fetch permissions for token"
                                            underlyingError:error];
#endif
        [self _notifyError:wrappedError];
      } else {
        NSMutableSet<NSString *> *permissions = [NSMutableSet set];
        NSMutableSet<NSString *> *declinedPermissions = [NSMutableSet set];
        NSMutableSet<NSString *> *expiredPermissions = [NSMutableSet set];

        [FBSDKInternalUtility extractPermissionsFromResponse:permissionResult
                                          grantedPermissions:permissions
                                         declinedPermissions:declinedPermissions
                                         expiredPermissions:expiredPermissions];
        FBSDKAccessToken *accessToken = [[FBSDKAccessToken alloc] initWithTokenString:tokenString
                                                                          permissions:permissions.allObjects
                                                                  declinedPermissions:declinedPermissions.allObjects
                                                                   expiredPermissions:expiredPermissions.allObjects
                                                                                appID:[FBSDKSettings appID]
                                                                               userID:userID
                                                                       expirationDate:nil
                                                                          refreshDate:nil
                                                             dataAccessExpirationDate:nil];
        FBSDKDeviceLoginManagerResult *result = [[FBSDKDeviceLoginManagerResult alloc] initWithToken:accessToken
                                                                                         isCancelled:NO];
        completeWithResult(result);
      }
    }];
  } else {
    _isCancelled = YES;
    FBSDKDeviceLoginManagerResult *result = [[FBSDKDeviceLoginManagerResult alloc] initWithToken:nil isCancelled:YES];
    completeWithResult(result);
  }
}

- (void)_processError:(NSError *)error
{
  FBSDKDeviceLoginError code = [error.userInfo[FBSDKGraphRequestErrorGraphErrorSubcodeKey] unsignedIntegerValue];
  switch (code) {
    case FBSDKDeviceLoginErrorAuthorizationPending:
      [self _schedulePoll:_codeInfo.pollingInterval];
      break;
    case FBSDKDeviceLoginErrorCodeExpired:
    case FBSDKDeviceLoginErrorAuthorizationDeclined:
      [self _notifyToken:nil];
      break;
    case FBSDKDeviceLoginErrorExcessivePolling:
      [self _schedulePoll:_codeInfo.pollingInterval * 2];
    default:
      [self _notifyError:error];
      break;
  }
}

- (void)_schedulePoll:(NSUInteger)interval
{
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(interval * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    if (self->_isCancelled) {
      return;
    }

    NSDictionary *parameters = @{ @"code": self->_codeInfo.identifier };
    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:@"device/login_status"
                                                                   parameters:parameters
                                                                  tokenString:[FBSDKInternalUtility validateRequiredClientAccessToken]
                                                                   HTTPMethod:@"POST"
                                                                        flags:FBSDKGraphRequestFlagNone];
    [request setGraphErrorRecoveryDisabled:YES];
    [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
      if (self->_isCancelled) {
        return;
      }
      if (error) {
        [self _processError:error];
      } else {
        NSString *tokenString = result[@"access_token"];
        if (tokenString) {
          [self _notifyToken:tokenString];
        } else {
          NSError *unknownError = [FBSDKError errorWithDomain:FBSDKLoginErrorDomain
                                                         code:FBSDKErrorUnknown
                                                      message:@"Device Login poll failed. No token nor error was found."];
          [self _notifyError:unknownError];
        }
      }
    }];
  });
}

- (void)netService:(NSNetService *)sender
     didNotPublish:(NSDictionary<NSString *, NSNumber *> *)errorDict
{
  // Only cleanup if the publish error is from our advertising service
  if ([FBSDKDeviceRequestsHelper isDelegate:self forAdvertisementService:sender])
  {
    [FBSDKDeviceRequestsHelper cleanUpAdvertisementService:self];
  }
}

@end
