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

NS_ASSUME_NONNULL_BEGIN

@class FIRInstanceIDBackupExcludedPlist;
@class FIRInstanceIDCheckinPreferences;
@class FIRInstanceIDCheckinStore;
@class FIRInstanceIDTokenInfo;
@class FIRInstanceIDTokenStore;

@class FIRInstanceIDStore;
@protocol FIRInstanceIDStoreDelegate <NSObject>

/**
 *  This is called when the store has decided to invalide its tokens associated with the
 *  previous checkin credentials. After deleting the tokens locally, it calls this method
 *  to notify the delegate of the change. If possible, the delegate should use this time
 *  to request the invalidation of the tokens on the server as well.
 */
- (void)store:(FIRInstanceIDStore *)store
    didDeleteFCMScopedTokensForCheckin:(FIRInstanceIDCheckinPreferences *)checkin;

@end

/**
 *  Used to persist the InstanceID tokens. This is also used to cache the Checkin
 *  credentials.  The store also checks for stale entries in the store and
 *  let's us know if things in the store are stale or not. It does not however
 *  acts on stale entries in anyway.
 */
@interface FIRInstanceIDStore : NSObject

/**
 *  The delegate set in the initializer which is notified of changes in the store.
 */
@property(nonatomic, readonly, weak) NSObject<FIRInstanceIDStoreDelegate> *delegate;

- (instancetype)init __attribute__((unavailable("Use initWithDelegate: instead.")));

/**
 *  Initialize a default store to persist InstanceID tokens and options.
 *
 *  @param delegate The delegate with which to be notified of changes in the store.
 *  @return Store to persist InstanceID tokens.
 */
- (instancetype)initWithDelegate:(NSObject<FIRInstanceIDStoreDelegate> *)delegate;

/**
 *  Initialize a store with the token store used to persist tokens, and a checkin store.
 *  Used for testing.
 *
 *  @param checkinStore Persistent store that persists checkin preferences.
 *  @param tokenStore Persistent store that persists tokens.
 *
 *  @return Store to persist InstanceID tokens and options.
 */
- (instancetype)initWithCheckinStore:(FIRInstanceIDCheckinStore *)checkinStore
                          tokenStore:(FIRInstanceIDTokenStore *)tokenStore
                            delegate:(NSObject<FIRInstanceIDStoreDelegate> *)delegate
    NS_DESIGNATED_INITIALIZER;

#pragma mark - Save
/**
 *  Save the instanceID token info to the store.
 *
 *  @param tokenInfo     The token info to store.
 *  @param handler       The callback handler which is invoked when the operation is complete,
 *                       with an error if there is any.
 */
- (void)saveTokenInfo:(FIRInstanceIDTokenInfo *)tokenInfo handler:(void (^)(NSError *))handler;

#pragma mark - Get

/**
 *  Get the cached token info.
 *
 *  @param authorizedEntity The authorized entity for which we want the token.
 *  @param scope            The scope for which we want the token.
 *
 *  @return The cached token info if any for the given authorizedEntity and scope else
 *          returns nil.
 */
- (nullable FIRInstanceIDTokenInfo *)tokenInfoWithAuthorizedEntity:(NSString *)authorizedEntity
                                                             scope:(NSString *)scope;
/**
 *  Return all cached token infos from the Keychain.
 *
 *  @return The cached token infos, if any, that are stored in the Keychain.
 */
- (NSArray<FIRInstanceIDTokenInfo *> *)cachedTokenInfos;

#pragma mark - Delete

/**
 *  Remove the cached token for a given authorizedEntity and scope. If the token was never
 *  cached or deleted from the cache before this is a no-op.
 *
 *  @param authorizedEntity The authorizedEntity for the cached token.
 *  @param scope            The scope for the cached token
 */
- (void)removeCachedTokenWithAuthorizedEntity:(NSString *)authorizedEntity scope:(NSString *)scope;

/**
 *  Removes all cached tokens from the persistent store. In case deleting the cached tokens
 *  fails we try to delete the backup excluded plist that stores the tokens.
 *
 *  @param handler       The callback handler which is invoked when the operation is complete,
 *                       with an error if there is any.
 *
 */
- (void)removeAllCachedTokensWithHandler:(nullable void (^)(NSError *error))handler;

#pragma mark - Persisting Checkin Preferences

/**
 *  Save the checkin preferences
 *
 *  @param preferences   Checkin preferences to save.
 *  @param handler       The callback handler which is invoked when the operation is complete,
 *                       with an error if there is any.
 */
- (void)saveCheckinPreferences:(FIRInstanceIDCheckinPreferences *)preferences
                       handler:(nullable void (^)(NSError *error))handler;

/**
 *  Return the cached checkin preferences.
 *
 *  @return Checkin preferences.
 */
- (FIRInstanceIDCheckinPreferences *)cachedCheckinPreferences;

/**
 *  Remove the cached checkin preferences from the store.
 *
 *  @param handler       The callback handler which is invoked when the operation is complete,
 *                       with an error if there is any.
 */
- (void)removeCheckinPreferencesWithHandler:(nullable void (^)(NSError *error))handler;

#pragma mark - Standard Directory sub-directory

/**
 *  Check if supported directory has InstanceID subdirectory
 *
 *  @return YES if the Application Support directory has InstanceID subdirectory else NO.
 */
+ (BOOL)hasSubDirectory:(NSString *)subDirectoryName;

/**
 *  Create InstanceID subdirectory in Application support directory.
 *
 *  @return YES if the subdirectory was created successfully else NO.
 */
+ (BOOL)createSubDirectory:(NSString *)subDirectoryName;

/**
 *  Removes Application Support subdirectory for InstanceID.
 *
 *  @param error The error object if any while trying to delete the sub-directory.
 *
 *  @return YES if the deletion was successful else NO.
 */
+ (BOOL)removeSubDirectory:(NSString *)subDirectoryName error:(NSError **)error;

@end

NS_ASSUME_NONNULL_END
