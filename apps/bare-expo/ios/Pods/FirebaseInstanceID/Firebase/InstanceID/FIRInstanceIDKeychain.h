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

/* The Keychain error domain */
extern NSString *const kFIRInstanceIDKeychainErrorDomain;

@class FIRInstanceIDKeyPair;

/*
 * Wrapping the keychain operations in a serialize queue. This is to avoid keychain operation
 * blocking main queue.
 */
@interface FIRInstanceIDKeychain : NSObject

/**
 *  FIRInstanceIDKeychain.
 *
 *  @return A shared instance of FIRInstanceIDKeychain.
 */
+ (instancetype)sharedInstance;

/**
 *  Get keychain items matching the given a query.
 *
 *  @param keychainQuery    The keychain query.
 *
 *  @return                 An CFTypeRef result matching the provided inputs.
 */
- (CFTypeRef)itemWithQuery:(NSDictionary *)keychainQuery;

/**
 *  Remove the cached items from the keychain matching the query.
 *
 *  @param keychainQuery    The keychain query.
 *  @param handler          The callback handler which is invoked when the remove operation is
 *                          complete, with an error if there is any.
 */
- (void)removeItemWithQuery:(NSDictionary *)keychainQuery handler:(void (^)(NSError *error))handler;

/**
 *  Add the item with a given query.
 *
 *  @param keychainQuery    The keychain query.
 *  @param handler          The callback handler which is invoked when the add operation is
 *                          complete, with an error if there is any.
 */
- (void)addItemWithQuery:(NSDictionary *)keychainQuery handler:(void (^)(NSError *))handler;

#pragma mark - Keypair
/**
 *  Generate a public/private key pair given their tags.
 *
 *  @param privateTag        The private tag associated with the private key.
 *  @param publicTag         The public tag associated with the public key.
 *
 *  @return                  A new FIRInstanceIDKeyPair object.
 */
- (FIRInstanceIDKeyPair *)generateKeyPairWithPrivateTag:(NSString *)privateTag
                                              publicTag:(NSString *)publicTag;

@end
