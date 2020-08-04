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

@interface FIRInstanceIDKeyPair : NSObject

- (instancetype)init __attribute__((
    unavailable("Use -initWithPrivateKey:publicKey:publicKeyData:privateKeyData: instead.")));
;

/**
 *  Initialize a new 2048 bit RSA keypair. This also stores the keypair in the Keychain
 *  Preferences.
 *
 *  @param publicKey      The publicKey stored in Keychain.
 *  @param privateKey     The privateKey stored in Keychain.
 *  @param publicKeyData  The publicKey in NSData format.
 *  @param privateKeyData The privateKey in NSData format.
 *
 *  @return A new KeyPair instance with the generated public and private key.
 */
- (instancetype)initWithPrivateKey:(SecKeyRef)privateKey
                         publicKey:(SecKeyRef)publicKey
                     publicKeyData:(NSData *)publicKeyData
                    privateKeyData:(NSData *)privateKeyData NS_DESIGNATED_INITIALIZER;

/**
 *  The public key in the RSA 20148 bit generated KeyPair.
 *
 *  @return The 2048 bit RSA KeyPair's public key.
 */
@property(nonatomic, readonly, strong) NSData *publicKeyData;

/**
 *  The private key in the RSA 20148 bit generated KeyPair.
 *
 *  @return The 2048 bit RSA KeyPair's private key.
 */
@property(nonatomic, readonly, strong) NSData *privateKeyData;

#pragma mark - Info

/**
 *  Checks if the private and public keyPair are valid or not.
 *
 *  @return YES if keypair is valid else NO.
 */
- (BOOL)isValid;

/**
 *  The public key in the RSA 2048 bit generated KeyPair.
 *
 *  @return The 2048 bit RSA KeyPair's public key.
 */
- (SecKeyRef)publicKey;

/**
 *  The private key in the RSA 2048 bit generated KeyPair.
 *
 *  @return The 2048 bit RSA KeyPair's private key.
 */
- (SecKeyRef)privateKey;

@end
