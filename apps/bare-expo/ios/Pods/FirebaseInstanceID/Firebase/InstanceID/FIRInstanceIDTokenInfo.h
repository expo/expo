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

#import "FIRInstanceIDAPNSInfo.h"

NS_ASSUME_NONNULL_BEGIN

/**
 *  Represents an Instance ID token, and all of the relevant information
 *  associated with it. It can read from and write to an NSDictionary object, for
 *  simple serialization.
 */
@interface FIRInstanceIDTokenInfo : NSObject <NSCoding>

/// The authorized entity (also known as Sender ID), associated with the token.
@property(nonatomic, readonly, copy) NSString *authorizedEntity;
/// The scope associated with the token. This is an arbitrary string, typically "*".
@property(nonatomic, readonly, copy) NSString *scope;
/// The token value itself, with which all other properties are associated.
@property(nonatomic, readonly, copy) NSString *token;

// These properties are nullable because they might not exist for tokens fetched from
// legacy storage formats.

/// The app version that this token represents.
@property(nonatomic, readonly, copy, nullable) NSString *appVersion;
/// The Firebase app ID (also known as GMP App ID), that this token is associated with.
@property(nonatomic, readonly, copy, nullable) NSString *firebaseAppID;

/// Tokens may not always be associated with an APNs token, and may be associated after
/// being created.
@property(nonatomic, strong, nullable) FIRInstanceIDAPNSInfo *APNSInfo;
/// The time that this token info was updated. The cache time is writeable, since in
/// some cases the token info may be refreshed from the server. In those situations,
/// the cacheTime would be updated.
@property(nonatomic, copy, nullable) NSDate *cacheTime;

/**
 *  Initializes a FIRInstanceIDTokenInfo object with the required parameters. These
 *  parameters represent all the relevant associated data with a token.
 *
 *  @param authorizedEntity The authorized entity (also known as Sender ID).
 *  @param scope            The scope of the token, typically "*" meaning
 *                          it's a "default scope".
 *  @param token            The token value itself.
 *  @param appVersion       The application version that this token is associated with.
 *  @param firebaseAppID    The Firebase app ID which this token is associated with.
 *  @return An instance of FIRInstanceIDTokenInfo.
 */
- (instancetype)initWithAuthorizedEntity:(NSString *)authorizedEntity
                                   scope:(NSString *)scope
                                   token:(NSString *)token
                              appVersion:(nullable NSString *)appVersion
                           firebaseAppID:(nullable NSString *)firebaseAppID;

/**
 * Check whether the token is still fresh based on:
 * 1. Last fetch token is within the 7 days.
 * 2. Language setting is not changed.
 * 3. App version is current.
 * 4. GMP App ID is current.
 * 5. token is consistent with the current IID.
 * 6. APNS info has changed.
 * @param IID  The app identifiier that is used to check if token is prefixed with.
 * @return If token is fresh.
 *
 */
- (BOOL)isFreshWithIID:(NSString *)IID;

/*
 * Check whether the token is default token.
 */
- (BOOL)isDefaultToken;

@end

NS_ASSUME_NONNULL_END
