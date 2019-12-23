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

#import "FIRInstanceID.h"

@class FIRInstanceIDAuthService;
@class FIRInstanceIDCheckinPreferences;
@class FIRInstanceIDKeyPair;
@class FIRInstanceIDTokenInfo;
@class FIRInstanceIDStore;

typedef NS_OPTIONS(NSUInteger, FIRInstanceIDInvalidTokenReason) {
  FIRInstanceIDInvalidTokenReasonNone = 0,               // 0
  FIRInstanceIDInvalidTokenReasonAppVersion = (1 << 0),  // 0...00001
  FIRInstanceIDInvalidTokenReasonAPNSToken = (1 << 1),   // 0...00010
};

/**
 *  Manager for the InstanceID token requests i.e `newToken` and `deleteToken`. This
 *  manages the overall interaction of the `InstanceIDStore`, the token register
 *  service and the callbacks associated with `GCMInstanceID`.
 */
@interface FIRInstanceIDTokenManager : NSObject

/// Expose the auth service, so it can be used by others
@property(nonatomic, readonly, strong) FIRInstanceIDAuthService *authService;

/**
 *  Fetch new token for the given authorizedEntity and scope. This makes an
 *  asynchronous request to the InstanceID backend to create a new token for
 *  the service and returns it. This will replace any old token for the given
 *  authorizedEntity and scope that has been cached before.
 *
 *  @param authorizedEntity The authorized entity for the token, should not be nil.
 *  @param scope            The scope for the token, should not be nil.
 *  @param keyPair          The keyPair that represents the app identity.
 *  @param options          The options to be added to the fetch request.
 *  @param handler          The handler to be invoked once we have the token or the
 *                          fetch request to InstanceID backend results in an error. Also
 *                          since it's a public handler it should always be called
 *                          asynchronously. This should be non-nil.
 */
- (void)fetchNewTokenWithAuthorizedEntity:(NSString *)authorizedEntity
                                    scope:(NSString *)scope
                                  keyPair:(FIRInstanceIDKeyPair *)keyPair
                                  options:(NSDictionary *)options
                                  handler:(FIRInstanceIDTokenHandler)handler;

/**
 *  Return the cached token info, if one exists, for the given authorizedEntity and scope.
 *
 *  @param authorizedEntity The authorized entity for the token.
 *  @param scope            The scope for the token.
 *
 *  @return The cached token info, if available, matching the parameters.
 */
- (FIRInstanceIDTokenInfo *)cachedTokenInfoWithAuthorizedEntity:(NSString *)authorizedEntity
                                                          scope:(NSString *)scope;

/**
 *  Delete the token for the given authorizedEntity and scope. If the token has
 *  been cached, it will be deleted from the store. It will also make an
 *  asynchronous request to the InstanceID backend to invalidate the token.
 *
 *  @param authorizedEntity The authorized entity for the token, should not be nil.
 *  @param scope            The scope for the token, should not be nil.
 *  @param keyPair          The keyPair that represents the app identity.
 *  @param handler          The handler to be invoked once the delete request to
 *                          InstanceID backend has returned. If the request was
 *                          successful we invoke the handler with a nil error;
 *                          otherwise we call it with an appropriate error. Also since
 *                          it's a public handler it should always be called
 *                          asynchronously. This should be non-nil.
 */
- (void)deleteTokenWithAuthorizedEntity:(NSString *)authorizedEntity
                                  scope:(NSString *)scope
                                keyPair:(FIRInstanceIDKeyPair *)keyPair
                                handler:(FIRInstanceIDDeleteTokenHandler)handler;

/**
 *  Deletes all cached tokens from the persistent store. This method should only be triggered
 *  when InstanceID is deleted
 *
 *  @param keyPair The keyPair for the given app.
 *  @param handler The handler to be invoked once the delete request to InstanceID backend
 *                 has returned. If the request was successful we invoke the handler with
 *                 a nil error; else we pass in an appropriate error. This should be non-nil
 *                 and be called asynchronously.
 */
- (void)deleteAllTokensWithKeyPair:(FIRInstanceIDKeyPair *)keyPair
                           handler:(FIRInstanceIDDeleteHandler)handler;

/**
 *  Deletes all cached tokens from the persistent store.
 *  @param handler       The callback handler which is invoked when tokens deletion is complete,
 *                       with an error if there is any.
 *
 */
- (void)deleteAllTokensLocallyWithHandler:(void (^)(NSError *error))handler;

/**
 *  Stop any ongoing token operations.
 */
- (void)stopAllTokenOperations;

#pragma mark - Invalidating Cached Tokens

/**
 *  Invalidate any cached tokens, if the app version has changed since last launch or if the token
 *  is cached for more than 7 days.
 *  @param IID The cached instanceID, check if token is prefixed by such IID.
 *
 *  @return Whether we should fetch default token from server.
 *
 *  @discussion This should safely be called prior to any tokens being retrieved from
 *  the cache or being fetched from the network.
 */
- (BOOL)checkTokenRefreshPolicyWithIID:(NSString *)IID;

/**
 *  Upon being provided with different APNs or sandbox, any locally cached tokens
 *  should be deleted, and the new APNs token should be cached.
 *
 *  @discussion It is possible for this method to be called while token operations are
 *  in-progress or queued. In this case, the in-flight token operations will have stale
 *  APNs information. The default token is checked for being out-of-date by Instance ID,
 *  and re-fetched. Custom tokens are not currently checked.
 *
 *  @param deviceToken  The APNS device token, provided by the operating system.
 *  @param isSandbox    YES if the device token is for the sandbox environment, NO otherwise.
 *
 *  @return The array of FIRInstanceIDTokenInfo objects which were invalidated.
 */
- (NSArray<FIRInstanceIDTokenInfo *> *)updateTokensToAPNSDeviceToken:(NSData *)deviceToken
                                                           isSandbox:(BOOL)isSandbox;

@end
