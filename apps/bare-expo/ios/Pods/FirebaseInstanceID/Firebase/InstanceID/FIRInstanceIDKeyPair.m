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

#import "FIRInstanceIDKeyPair.h"

#import <Security/Security.h>

#import "FIRInstanceIDKeyPairUtilities.h"
#import "FIRInstanceIDKeychain.h"
#import "FIRInstanceIDLogger.h"
#import "NSError+FIRInstanceID.h"

@interface FIRInstanceIDKeyPair () {
  SecKeyRef _privateKey;
  SecKeyRef _publicKey;
}

@property(nonatomic, readwrite, strong) NSData *publicKeyData;
@property(nonatomic, readwrite, strong) NSData *privateKeyData;
@end

@implementation FIRInstanceIDKeyPair
- (instancetype)initWithPrivateKey:(SecKeyRef)privateKey
                         publicKey:(SecKeyRef)publicKey
                     publicKeyData:(NSData *)publicKeyData
                    privateKeyData:(NSData *)privateKeyData {
  self = [super init];
  if (self) {
    _privateKey = privateKey;
    _publicKey = publicKey;
    _publicKeyData = publicKeyData;
    _privateKeyData = privateKeyData;
  }
  return self;
}

- (void)dealloc {
  if (_privateKey) {
    CFRelease(_privateKey);
  }
  if (_publicKey) {
    CFRelease(_publicKey);
  }
}

#pragma mark - Info

- (BOOL)isValid {
  return _privateKey != NULL && _publicKey != NULL;
}

- (SecKeyRef)publicKey {
  return _publicKey;
}

- (SecKeyRef)privateKey {
  return _privateKey;
}

@end
