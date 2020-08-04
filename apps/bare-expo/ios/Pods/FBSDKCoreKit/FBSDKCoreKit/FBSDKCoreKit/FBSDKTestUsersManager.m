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

#import "FBSDKTestUsersManager.h"

#import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>

static NSString *const kFBGraphAPITestUsersPathFormat = @"%@/accounts/test-users";
static NSString *const kAccountsDictionaryTokenKey = @"access_token";
static NSString *const kAccountsDictionaryPermissionsKey = @"permissions";
static NSMutableDictionary<NSString *, FBSDKTestUsersManager *> *gInstancesDictionary;

@interface FBSDKTestUsersManager()
- (instancetype)initWithAppID:(NSString *)appID appSecret:(NSString *)appSecret NS_DESIGNATED_INITIALIZER;
@end

@implementation FBSDKTestUsersManager
{
  NSString *_appID;
  NSString *_appSecret;
  // dictionary with format like:
  // { user_id :  { kAccountsDictionaryTokenKey : "token",
  //                kAccountsDictionaryPermissionsKey : [ permissions ] }
  NSMutableDictionary *_accounts;
}

- (instancetype)initWithAppID:(NSString *)appID appSecret:(NSString *)appSecret {
  if ((self = [super init])) {
    _appID = [appID copy];
    _appSecret = [appSecret copy];
    _accounts = [NSMutableDictionary dictionary];
  }
  return self;
}

+ (instancetype)sharedInstanceForAppID:(NSString *)appID appSecret:(NSString *)appSecret {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    gInstancesDictionary = [NSMutableDictionary dictionary];
  });

  NSString *instanceKey = [NSString stringWithFormat:@"%@|%@", appID, appSecret];
  if (!gInstancesDictionary[instanceKey]) {
    gInstancesDictionary[instanceKey] = [[FBSDKTestUsersManager alloc] initWithAppID:appID appSecret:appSecret];
  }
  return gInstancesDictionary[instanceKey];
}

- (void)requestTestAccountTokensWithArraysOfPermissions:(NSArray<NSSet<NSString *> *> *)arraysOfPermissions
                                       createIfNotFound:(BOOL)createIfNotFound
                                      completionHandler:(FBSDKAccessTokensBlock)handler {
  arraysOfPermissions = arraysOfPermissions ?: @[[NSSet set]];

  // wrap work in a block so that we can chain it to after a fetch of existing accounts if we need to.
  void (^helper)(NSError *) = ^(NSError *error){
    if (error) {
      if (handler) {
        handler(@[], error);
      }
      return;
    }
    NSMutableArray *tokenDatum = [NSMutableArray arrayWithCapacity:arraysOfPermissions.count];
    NSMutableSet *collectedUserIds = [NSMutableSet setWithCapacity:arraysOfPermissions.count];
    __block BOOL canInvokeHandler = YES;
    __weak id weakSelf = self;
    [arraysOfPermissions enumerateObjectsUsingBlock:^(NSSet *desiredPermissions, NSUInteger idx, BOOL *stop) {
      NSArray* userIdAndTokenPair = [self userIdAndTokenOfExistingAccountWithPermissions:desiredPermissions skip:collectedUserIds];
      if (!userIdAndTokenPair) {
        if (createIfNotFound) {
          [self addTestAccountWithPermissions:desiredPermissions
                            completionHandler:^(NSArray *tokens, NSError *addError) {
                              if (addError) {
                                if (handler) {
                                  handler(@[], addError);
                                }
                              } else {
                                [weakSelf requestTestAccountTokensWithArraysOfPermissions:arraysOfPermissions
                                                                         createIfNotFound:createIfNotFound
                                                                        completionHandler:handler];
                              }
                            }];
          // stop the enumeration (ane flag so that callback to addTestAccount* will resolve our handler now).
          canInvokeHandler = NO;
          *stop = YES;
          return;
        } else {
          [tokenDatum addObject:[NSNull null]];
        }
      } else {
        NSString *userId = userIdAndTokenPair[0];
        NSString *tokenString = userIdAndTokenPair[1];
        [collectedUserIds addObject:userId];
        [tokenDatum addObject:[self tokenDataForTokenString:tokenString
                                                permissions:desiredPermissions
                                                     userId:userId]];
      }
    }];

    if (canInvokeHandler && handler) {
      handler(tokenDatum, nil);
    }
  };
  if (_accounts.count == 0) {
    [self fetchExistingTestAccountsWithAfterCursor:nil handler:helper];
  } else {
    helper(NULL);
  }
}

- (void)addTestAccountWithPermissions:(NSSet *)permissions
                    completionHandler:(FBSDKAccessTokensBlock)handler {
  NSDictionary *params = @{
                           @"installed" : @"true",
                           @"permissions" : [permissions.allObjects componentsJoinedByString:@","],
                           @"access_token" : self.appAccessToken
                           };
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:kFBGraphAPITestUsersPathFormat, _appID]
                                                                 parameters:params
                                                                tokenString:[self appAccessToken]
                                                                    version:nil
                                                                 HTTPMethod:FBSDKHTTPMethodPOST];
  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (error) {
      if (handler) {
        handler(@[], error);
      }
    } else {
      NSMutableDictionary *accountData = [NSMutableDictionary dictionaryWithCapacity:2];
      accountData[kAccountsDictionaryPermissionsKey] = [NSSet setWithSet:permissions];
      accountData[kAccountsDictionaryTokenKey] = result[@"access_token"];
      self->_accounts[result[@"id"]] = accountData;

      if (handler) {
        FBSDKAccessToken *token = [self tokenDataForTokenString:accountData[kAccountsDictionaryTokenKey]
                                                    permissions:permissions
                                                         userId:result[@"id"]];
        handler(@[token], nil);
      }
    }
  }];
}

- (void)makeFriendsWithFirst:(FBSDKAccessToken *)first second:(FBSDKAccessToken *)second callback:(FBSDKErrorBlock)callback
{
  __block int expectedCount = 2;
  void (^complete)(NSError *) = ^(NSError *error) {
    // ignore if they're already friends or pending request
    if ([error.userInfo[FBSDKGraphRequestErrorGraphErrorCodeKey] integerValue] == 522 ||
        [error.userInfo[FBSDKGraphRequestErrorGraphErrorCodeKey] integerValue] == 520) {
      error = nil;
    }
    if (--expectedCount == 0 || error) {
      callback(error);
    }
  };
  FBSDKGraphRequest *one = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:@"%@/friends/%@", first.userID, second.userID]
                                                             parameters:@{}
                                                            tokenString:first.tokenString
                                                                version:nil
                                                             HTTPMethod:FBSDKHTTPMethodPOST];
  FBSDKGraphRequest *two = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:@"%@/friends/%@", second.userID, first.userID]
                                                             parameters:@{}
                                                            tokenString:second.tokenString
                                                                version:nil
                                                             HTTPMethod:FBSDKHTTPMethodPOST];
  FBSDKGraphRequestConnection *conn = [[FBSDKGraphRequestConnection alloc] init];
  [conn addRequest:one
    batchEntryName:@"first"
 completionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    complete(error);
  }];
  [conn addRequest:two
   batchParameters:@{ @"depends_on" : @"first"}
 completionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    complete(error);
  }];
  [conn start];
}

- (void)removeTestAccount:(NSString *)userId completionHandler:(FBSDKErrorBlock)handler {
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:userId
                                                                 parameters:@{}
                                                                tokenString:self.appAccessToken
                                                                    version:nil
                                                                 HTTPMethod:@"DELETE"];
  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (handler) {
      handler(error);
    }
  }];
  [_accounts removeObjectForKey:userId];
}

#pragma mark - private methods
- (FBSDKAccessToken *)tokenDataForTokenString:(NSString *)tokenString permissions:(NSSet *)permissions userId:(NSString *)userId{
  return [[FBSDKAccessToken alloc] initWithTokenString:tokenString
                                           permissions:permissions.allObjects
                                   declinedPermissions:@[]
                                    expiredPermissions:@[]
                                                 appID:_appID
                                                userID:userId
                                        expirationDate:nil
                                           refreshDate:nil
                                           dataAccessExpirationDate:nil];
}

- (NSArray *)userIdAndTokenOfExistingAccountWithPermissions:(NSSet *)permissions skip:(NSSet *)setToSkip {
  __block NSString *userId = nil;
  __block NSString *token = nil;

  [_accounts enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSDictionary *accountData, BOOL *stop) {
    if ([setToSkip containsObject:key]) {
      return;
    }
    NSSet *accountPermissions = accountData[kAccountsDictionaryPermissionsKey];
    if ([permissions isSubsetOfSet:accountPermissions]) {
      token = accountData[kAccountsDictionaryTokenKey];
      userId = key;
      *stop = YES;
    }
  }];
  if (userId && token) {
    return @[userId, token];
  } else {
    return nil;
  }
}

- (NSString *)appAccessToken {
  return [NSString stringWithFormat:@"%@|%@", _appID, _appSecret];
}

- (void)fetchExistingTestAccountsWithAfterCursor:(NSString *)after handler:(FBSDKErrorBlock)handler {
  FBSDKGraphRequestConnection *connection = [[FBSDKGraphRequestConnection alloc] init];
  FBSDKGraphRequest *requestForAccountIds = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:kFBGraphAPITestUsersPathFormat, _appID]
                                                                              parameters:@{@"limit" : @"50",
                                                                                           @"after" : after ?: @"",
                                                                                           @"fields": @""
                                                                                           }
                                                                             tokenString:self.appAccessToken
                                                                                 version:nil
                                                                              HTTPMethod:FBSDKHTTPMethodGET];
  __block NSString *afterCursor = nil;
  __block NSInteger expectedTestAccounts = 0;
  FBSDKGraphRequestConnection *permissionConnection = [[FBSDKGraphRequestConnection alloc] init];
  [connection addRequest:requestForAccountIds completionHandler:^(FBSDKGraphRequestConnection *innerConnection, id result, NSError *error) {
    if (error) {
      if (handler) {
        handler(error);
      }
      // on errors, clear out accounts since it may be in a bad state
      [self->_accounts removeAllObjects];
      return;
    } else {
      for (NSDictionary *account in result[@"data"]) {
        NSString *userId = account[@"id"];
        NSString *token = account[@"access_token"];
        if (userId && token) {
          self->_accounts[userId] = [NSMutableDictionary dictionaryWithCapacity:2];
          self->_accounts[userId][kAccountsDictionaryTokenKey] = token;
          expectedTestAccounts++;
          [permissionConnection addRequest:[[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:@"%@?fields=permissions", userId]
                                                                             parameters:@{}
                                                                            tokenString:self.appAccessToken
                                                                                version:nil
                                                                             HTTPMethod:FBSDKHTTPMethodGET]
                         completionHandler:^(FBSDKGraphRequestConnection *innerConnection2, id innerResult, NSError *innerError) {
                           if (self->_accounts.count == 0) {
                             // indicates an earlier error that was already passed to handler, so just short circuit.
                             return;
                           }
                           if (innerError) {
                             if (handler) {
                               handler(innerError);
                             }
                             [self->_accounts removeAllObjects];
                             return;
                           } else {
                             NSMutableSet *grantedPermissions = [NSMutableSet set];
                             NSArray *resultPermissionsDictionaries = innerResult[@"permissions"][@"data"];
                             [resultPermissionsDictionaries enumerateObjectsUsingBlock:^(NSDictionary *obj, NSUInteger idx, BOOL *stop) {
                               if ([obj[@"status"] isEqualToString:@"granted"]) {
                                 [grantedPermissions addObject:obj[@"permission"]];
                               }
                             }];
                             self->_accounts[userId][kAccountsDictionaryPermissionsKey] = grantedPermissions;
                           }
                           expectedTestAccounts--;
                           if (!expectedTestAccounts) {
                             if (afterCursor) {
                               [self fetchExistingTestAccountsWithAfterCursor:afterCursor handler:handler];
                             } else if (handler) {
                               handler(nil);
                             }
                           }
                         }
           ];
        }
      }
      afterCursor = result[@"paging"][@"cursors"][@"after"];
    }

    if (expectedTestAccounts) {
      // finished fetching ids and tokens, now kick off the request for all the permissions
      [permissionConnection start];
    } else {
      if (handler) {
        handler(nil);
      }
    }
  }];
  [connection start];
}
@end
