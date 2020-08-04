/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "FIRInstanceIDTokenManager.h"

#import "FIRInstanceIDAuthKeyChain.h"
#import "FIRInstanceIDAuthService.h"
#import "FIRInstanceIDCheckinPreferences.h"
#import "FIRInstanceIDConstants.h"
#import "FIRInstanceIDDefines.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDStore.h"
#import "FIRInstanceIDTokenDeleteOperation.h"
#import "FIRInstanceIDTokenFetchOperation.h"
#import "FIRInstanceIDTokenInfo.h"
#import "FIRInstanceIDTokenOperation.h"
#import "NSError+FIRInstanceID.h"

@interface FIRInstanceIDTokenManager () <FIRInstanceIDStoreDelegate>

@property(nonatomic, readwrite, strong) FIRInstanceIDStore *instanceIDStore;
@property(nonatomic, readwrite, strong) FIRInstanceIDAuthService *authService;
@property(nonatomic, readonly, strong) NSOperationQueue *tokenOperations;

@property(nonatomic, readwrite, strong) FIRInstanceIDAPNSInfo *currentAPNSInfo;

@end

@implementation FIRInstanceIDTokenManager

- (instancetype)init {
  self = [super init];
  if (self) {
    _instanceIDStore = [[FIRInstanceIDStore alloc] initWithDelegate:self];
    _authService = [[FIRInstanceIDAuthService alloc] initWithStore:_instanceIDStore];
    [self configureTokenOperations];
  }
  return self;
}

- (void)dealloc {
  [self stopAllTokenOperations];
}

- (void)configureTokenOperations {
  _tokenOperations = [[NSOperationQueue alloc] init];
  _tokenOperations.name = @"com.google.iid-token-operations";
  // For now, restrict the operations to be serial, because in some cases (like if the
  // authorized entity and scope are the same), order matters.
  // If we have to deal with several different token requests simultaneously, it would be a good
  // idea to add some better intelligence around this (performing unrelated token operations
  // simultaneously, etc.).
  _tokenOperations.maxConcurrentOperationCount = 1;
  if ([_tokenOperations respondsToSelector:@selector(qualityOfService)]) {
    _tokenOperations.qualityOfService = NSOperationQualityOfServiceUtility;
  }
}

- (void)fetchNewTokenWithAuthorizedEntity:(NSString *)authorizedEntity
                                    scope:(NSString *)scope
                                  keyPair:(FIRInstanceIDKeyPair *)keyPair
                                  options:(NSDictionary *)options
                                  handler:(FIRInstanceIDTokenHandler)handler {
  FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenManager000,
                           @"Fetch new token for authorizedEntity: %@, scope: %@", authorizedEntity,
                           scope);
  FIRInstanceIDTokenFetchOperation *operation =
      [self createFetchOperationWithAuthorizedEntity:authorizedEntity
                                               scope:scope
                                             options:options
                                             keyPair:keyPair];
  FIRInstanceID_WEAKIFY(self);
  FIRInstanceIDTokenOperationCompletion completion =
      ^(FIRInstanceIDTokenOperationResult result, NSString *_Nullable token,
        NSError *_Nullable error) {
        FIRInstanceID_STRONGIFY(self);
        if (error) {
          handler(nil, error);
          return;
        }
        NSString *firebaseAppID = options[kFIRInstanceIDTokenOptionsFirebaseAppIDKey];
        FIRInstanceIDTokenInfo *tokenInfo = [[FIRInstanceIDTokenInfo alloc]
            initWithAuthorizedEntity:authorizedEntity
                               scope:scope
                               token:token
                          appVersion:FIRInstanceIDCurrentAppVersion()
                       firebaseAppID:firebaseAppID];
        tokenInfo.APNSInfo = [[FIRInstanceIDAPNSInfo alloc] initWithTokenOptionsDictionary:options];

        [self.instanceIDStore
            saveTokenInfo:tokenInfo
                  handler:^(NSError *error) {
                    if (!error) {
                      // Do not send the token back in case the save was unsuccessful. Since with
                      // the new asychronous fetch mechanism this can lead to infinite loops, for
                      // example, we will return a valid token even though we weren't able to store
                      // it in our cache. The first token will lead to a onTokenRefresh callback
                      // wherein the user again calls `getToken` but since we weren't able to save
                      // it we won't hit the cache but hit the server again leading to an infinite
                      // loop.
                      FIRInstanceIDLoggerDebug(
                          kFIRInstanceIDMessageCodeTokenManager001,
                          @"Token fetch successful, token: %@, authorizedEntity: %@, scope:%@",
                          token, authorizedEntity, scope);

                      if (handler) {
                        handler(token, nil);
                      }
                    } else {
                      if (handler) {
                        handler(nil, error);
                      }
                    }
                  }];
      };
  // Add completion handler, and ensure it's called on the main queue
  [operation addCompletionHandler:^(FIRInstanceIDTokenOperationResult result,
                                    NSString *_Nullable token, NSError *_Nullable error) {
    dispatch_async(dispatch_get_main_queue(), ^{
      completion(result, token, error);
    });
  }];
  [self.tokenOperations addOperation:operation];
}

- (FIRInstanceIDTokenInfo *)cachedTokenInfoWithAuthorizedEntity:(NSString *)authorizedEntity
                                                          scope:(NSString *)scope {
  return [self.instanceIDStore tokenInfoWithAuthorizedEntity:authorizedEntity scope:scope];
}

- (void)deleteTokenWithAuthorizedEntity:(NSString *)authorizedEntity
                                  scope:(NSString *)scope
                                keyPair:(FIRInstanceIDKeyPair *)keyPair
                                handler:(FIRInstanceIDDeleteTokenHandler)handler {
  if ([self.instanceIDStore tokenInfoWithAuthorizedEntity:authorizedEntity scope:scope]) {
    [self.instanceIDStore removeCachedTokenWithAuthorizedEntity:authorizedEntity scope:scope];
  }
  // Does not matter if we cannot find it in the cache. Still make an effort to unregister
  // from the server.
  FIRInstanceIDCheckinPreferences *checkinPreferences = self.authService.checkinPreferences;
  FIRInstanceIDTokenDeleteOperation *operation =
      [self createDeleteOperationWithAuthorizedEntity:authorizedEntity
                                                scope:scope
                                   checkinPreferences:checkinPreferences
                                              keyPair:keyPair
                                               action:FIRInstanceIDTokenActionDeleteToken];

  if (handler) {
    [operation addCompletionHandler:^(FIRInstanceIDTokenOperationResult result,
                                      NSString *_Nullable token, NSError *_Nullable error) {
      dispatch_async(dispatch_get_main_queue(), ^{
        handler(error);
      });
    }];
  }
  [self.tokenOperations addOperation:operation];
}

- (void)deleteAllTokensWithKeyPair:(FIRInstanceIDKeyPair *)keyPair
                           handler:(FIRInstanceIDDeleteHandler)handler {
  // delete all tokens
  FIRInstanceIDCheckinPreferences *checkinPreferences = self.authService.checkinPreferences;
  if (!checkinPreferences) {
    // The checkin is already deleted. No need to trigger the token delete operation as client no
    // longer has the checkin information for server to delete.
    dispatch_async(dispatch_get_main_queue(), ^{
      handler(nil);
    });
    return;
  }
  FIRInstanceIDTokenDeleteOperation *operation =
      [self createDeleteOperationWithAuthorizedEntity:kFIRInstanceIDKeychainWildcardIdentifier
                                                scope:kFIRInstanceIDKeychainWildcardIdentifier
                                   checkinPreferences:checkinPreferences
                                              keyPair:keyPair
                                               action:FIRInstanceIDTokenActionDeleteTokenAndIID];
  if (handler) {
    [operation addCompletionHandler:^(FIRInstanceIDTokenOperationResult result,
                                      NSString *_Nullable token, NSError *_Nullable error) {
      dispatch_async(dispatch_get_main_queue(), ^{
        handler(error);
      });
    }];
  }
  [self.tokenOperations addOperation:operation];
}

- (void)deleteAllTokensLocallyWithHandler:(void (^)(NSError *error))handler {
  [self.instanceIDStore removeAllCachedTokensWithHandler:handler];
}

- (void)stopAllTokenOperations {
  [self.authService stopCheckinRequest];
  [self.tokenOperations cancelAllOperations];
}

#pragma mark - FIRInstanceIDStoreDelegate

- (void)store:(FIRInstanceIDStore *)store
    didDeleteFCMScopedTokensForCheckin:(FIRInstanceIDCheckinPreferences *)checkin {
  // Make a best effort try to delete the old client related state on the FCM server. This is
  // required to delete old pubusb registrations which weren't cleared when the app was deleted.
  //
  // This is only a one time effort. If this call fails the client would still receive duplicate
  // pubsub notifications if he is again subscribed to the same topic.
  //
  // The client state should be cleared on the server for the provided checkin preferences.
  FIRInstanceIDTokenDeleteOperation *operation =
      [self createDeleteOperationWithAuthorizedEntity:nil
                                                scope:nil
                                   checkinPreferences:checkin
                                              keyPair:nil
                                               action:FIRInstanceIDTokenActionDeleteToken];
  [operation addCompletionHandler:^(FIRInstanceIDTokenOperationResult result,
                                    NSString *_Nullable token, NSError *_Nullable error) {
    if (error) {
      FIRInstanceIDMessageCode code =
          kFIRInstanceIDMessageCodeTokenManagerErrorDeletingFCMTokensOnAppReset;
      FIRInstanceIDLoggerDebug(code, @"Failed to delete GCM server registrations on app reset.");
    } else {
      FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenManagerDeletedFCMTokensOnAppReset,
                               @"Successfully deleted GCM server registrations on app reset");
    }
  }];

  [self.tokenOperations addOperation:operation];
}

#pragma mark - Unit Testing Stub Helpers
// We really have this method so that we can more easily stub it out for unit testing
- (FIRInstanceIDTokenFetchOperation *)
    createFetchOperationWithAuthorizedEntity:(NSString *)authorizedEntity
                                       scope:(NSString *)scope
                                     options:(NSDictionary<NSString *, NSString *> *)options
                                     keyPair:(FIRInstanceIDKeyPair *)keyPair {
  FIRInstanceIDCheckinPreferences *checkinPreferences = self.authService.checkinPreferences;
  FIRInstanceIDTokenFetchOperation *operation =
      [[FIRInstanceIDTokenFetchOperation alloc] initWithAuthorizedEntity:authorizedEntity
                                                                   scope:scope
                                                                 options:options
                                                      checkinPreferences:checkinPreferences
                                                                 keyPair:keyPair];
  return operation;
}

// We really have this method so that we can more easily stub it out for unit testing
- (FIRInstanceIDTokenDeleteOperation *)
    createDeleteOperationWithAuthorizedEntity:(NSString *)authorizedEntity
                                        scope:(NSString *)scope
                           checkinPreferences:(FIRInstanceIDCheckinPreferences *)checkinPreferences
                                      keyPair:(FIRInstanceIDKeyPair *)keyPair
                                       action:(FIRInstanceIDTokenAction)action {
  FIRInstanceIDTokenDeleteOperation *operation =
      [[FIRInstanceIDTokenDeleteOperation alloc] initWithAuthorizedEntity:authorizedEntity
                                                                    scope:scope
                                                       checkinPreferences:checkinPreferences
                                                                  keyPair:keyPair
                                                                   action:action];
  return operation;
}

#pragma mark - Invalidating Cached Tokens
- (BOOL)checkTokenRefreshPolicyWithIID:(NSString *)IID {
  // We know at least one cached token exists.
  BOOL shouldFetchDefaultToken = NO;
  NSArray<FIRInstanceIDTokenInfo *> *tokenInfos = [self.instanceIDStore cachedTokenInfos];

  NSMutableArray<FIRInstanceIDTokenInfo *> *tokenInfosToDelete =
      [NSMutableArray arrayWithCapacity:tokenInfos.count];
  for (FIRInstanceIDTokenInfo *tokenInfo in tokenInfos) {
    if ([tokenInfo isFreshWithIID:IID]) {
      // Token is fresh and in right format, do nothing
      continue;
    }
    if ([tokenInfo isDefaultToken]) {
      // Default token is expired, do not mark for deletion. Fetch directly from server to
      // replace the current one.
      shouldFetchDefaultToken = YES;
    } else {
      // Non-default token is expired, mark for deletion.
      [tokenInfosToDelete addObject:tokenInfo];
    }
    FIRInstanceIDLoggerDebug(
        kFIRInstanceIDMessageCodeTokenManagerInvalidateStaleToken,
        @"Invalidating cached token for %@ (%@) due to token is no longer fresh.",
        tokenInfo.authorizedEntity, tokenInfo.scope);
  }
  for (FIRInstanceIDTokenInfo *tokenInfoToDelete in tokenInfosToDelete) {
    [self.instanceIDStore removeCachedTokenWithAuthorizedEntity:tokenInfoToDelete.authorizedEntity
                                                          scope:tokenInfoToDelete.scope];
  }
  return shouldFetchDefaultToken;
}

- (NSArray<FIRInstanceIDTokenInfo *> *)updateTokensToAPNSDeviceToken:(NSData *)deviceToken
                                                           isSandbox:(BOOL)isSandbox {
  // Each cached IID token that is missing an APNSInfo, or has an APNSInfo associated should be
  // checked and invalidated if needed.
  FIRInstanceIDAPNSInfo *APNSInfo = [[FIRInstanceIDAPNSInfo alloc] initWithDeviceToken:deviceToken
                                                                             isSandbox:isSandbox];
  if ([self.currentAPNSInfo isEqualToAPNSInfo:APNSInfo]) {
    return @[];
  }
  self.currentAPNSInfo = APNSInfo;

  NSArray<FIRInstanceIDTokenInfo *> *tokenInfos = [self.instanceIDStore cachedTokenInfos];
  NSMutableArray<FIRInstanceIDTokenInfo *> *tokenInfosToDelete =
      [NSMutableArray arrayWithCapacity:tokenInfos.count];
  for (FIRInstanceIDTokenInfo *cachedTokenInfo in tokenInfos) {
    // Check if the cached APNSInfo is nil, or if it is an old APNSInfo.
    if (!cachedTokenInfo.APNSInfo ||
        ![cachedTokenInfo.APNSInfo isEqualToAPNSInfo:self.currentAPNSInfo]) {
      // Mark for invalidation.
      [tokenInfosToDelete addObject:cachedTokenInfo];
    }
  }
  for (FIRInstanceIDTokenInfo *tokenInfoToDelete in tokenInfosToDelete) {
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeTokenManagerAPNSChangedTokenInvalidated,
                             @"Invalidating cached token for %@ (%@) due to APNs token change.",
                             tokenInfoToDelete.authorizedEntity, tokenInfoToDelete.scope);
    [self.instanceIDStore removeCachedTokenWithAuthorizedEntity:tokenInfoToDelete.authorizedEntity
                                                          scope:tokenInfoToDelete.scope];
  }
  return tokenInfosToDelete;
}

@end
