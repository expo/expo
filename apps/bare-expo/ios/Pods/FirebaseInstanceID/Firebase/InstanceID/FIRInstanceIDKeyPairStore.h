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

@class FIRInstanceIDKeyPair;

extern NSString *const kFIRInstanceIDKeyPairSubType;

@class FIRInstanceIDKeyPairStore;

@interface FIRInstanceIDKeyPairStore : NSObject

/**
 *  Invalidates the cached keypairs in the Keychain, if needed. The keypair metadata plist is
 *  checked for existence. If the plist file does not exist, it is a signal of a new installation,
 *  and therefore the key pairs are not valid.
 *
 *  Returns YES if keypair has been invalidated.
 */
- (BOOL)invalidateKeyPairsIfNeeded;

/**
 *  Delete the cached RSA keypair from Keychain with the given subtype.
 *
 *  @param subtype       The subtype used to cache the RSA keypair in Keychain.
 *  @param handler       The callback handler which is invoked when the keypair deletion is
 *                       complete, with an error if there is any.
 */
- (void)deleteSavedKeyPairWithSubtype:(NSString *)subtype handler:(void (^)(NSError *))handler;

/**
 *  Delete the plist that caches KeyPair generation timestamps.
 *
 *  @param error The error if any while deleting the plist else nil.
 *
 *  @return YES if the delete was successful else NO.
 */
- (BOOL)removeKeyPairCreationTimePlistWithError:(NSError **)error;

/**
 *  Loads a cached KeyPair if it exists in the Keychain else generate a new
 *  one. If a keyPair already exists in memory this will just return that. This should
 *  not be called from the main thread since it could potentially lead to creating a new
 *  RSA-2048 bit keyPair which is an expensive operation.
 *
 *  @param error The error, if any, while accessing the Keychain.
 *
 *  @return A valid 2048 bit RSA key pair.
 */
- (FIRInstanceIDKeyPair *)loadKeyPairWithError:(NSError **)error;

/**
 *  Check if the Keychain has any cached keypairs or not.
 *
 *  @return YES if the Keychain has cached RSA KeyPairs else NO.
 */
- (BOOL)hasCachedKeyPairs;

/**
 *  Return an identifier for the app instance. The result is a short identifier that can
 *  be used as a key when storing information about the app. This method will return the same
 *  ID as long as the application identity remains active. If the identity has been revoked or
 *  expired the method will generate and return a new identifier.
 *
 *  @param error The error if any while loading the RSA KeyPair.
 *
 * @return The identifier, as url safe string.
 */
- (NSString *)appIdentityWithError:(NSError *__autoreleasing *)error;

@end
