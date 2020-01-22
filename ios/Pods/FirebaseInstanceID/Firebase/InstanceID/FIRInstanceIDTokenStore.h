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

#import <Foundation/Foundation.h>

@class FIRInstanceIDAPNSInfo;
@class FIRInstanceIDAuthKeychain;
@class FIRInstanceIDTokenInfo;

/**
 *  This class is responsible for retrieving and saving `FIRInstanceIDTokenInfo` objects from the
 *  keychain. The keychain keys that are used are:
 *  Account: <Main App Bundle ID> (e.g. com.mycompany.myapp)
 *  Service: <Sender ID>:<Scope> (e.g. 1234567890:*)
 */
@interface FIRInstanceIDTokenStore : NSObject

NS_ASSUME_NONNULL_BEGIN

/**
 *  Create a default InstanceID token store. Uses a valid Keychain object as it's
 *  persistent backing store.
 *
 *  @return A valid token store object.
 */
+ (instancetype)defaultStore;

- (instancetype)init __attribute__((unavailable("Use -initWithKeychain: instead.")));

/**
 *  Initialize a token store object with a Keychain object. Used for testing.
 *
 *  @param keychain The Keychain object to use as the backing store for tokens.
 *
 *  @return A valid token store object with the given Keychain as backing store.
 */
- (instancetype)initWithKeychain:(FIRInstanceIDAuthKeychain *)keychain;

#pragma mark - Get

/**
 *  Get the cached token from the Keychain.
 *
 *  @param authorizedEntity The authorized entity for the token.
 *  @param scope            The scope for the token.
 *
 *  @return The cached token info if any for the given authorizedEntity and scope else
 *          nil.
 */
- (nullable FIRInstanceIDTokenInfo *)tokenInfoWithAuthorizedEntity:(NSString *)authorizedEntity
                                                             scope:(NSString *)scope;

/**
 *  Return all cached token infos from the Keychain.
 *
 *  @return The cached token infos, if any, that are stored in the Keychain.
 */
- (NSArray<FIRInstanceIDTokenInfo *> *)cachedTokenInfos;

#pragma mark - Save

/**
 *  Save the instanceID token info to the persistent store.
 *
 *  @param tokenInfo        The token info to store.
 *  @param handler          The callback handler which is invoked when token saving is complete,
 *                          with an error if there is any.
 */
- (void)saveTokenInfo:(FIRInstanceIDTokenInfo *)tokenInfo
              handler:(nullable void (^)(NSError *))handler;

#pragma mark - Delete

/**
 *  Remove the cached token from Keychain.
 *
 *  @param authorizedEntity The authorized entity for the token.
 *  @param scope            The scope for the token.
 *
 */
- (void)removeTokenWithAuthorizedEntity:(NSString *)authorizedEntity scope:(NSString *)scope;

/**
 *  Remove all the cached tokens from the Keychain.
 *  @param handler          The callback handler which is invoked when tokens deletion is complete,
 *                          with an error if there is any.
 *
 */
- (void)removeAllTokensWithHandler:(nullable void (^)(NSError *))handler;

NS_ASSUME_NONNULL_END

@end
