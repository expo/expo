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

#import "FIRInstanceIDKeychain.h"

#import "FIRInstanceIDKeyPair.h"
#import "FIRInstanceIDKeyPairUtilities.h"
#import "FIRInstanceIDLogger.h"

NSString *const kFIRInstanceIDKeychainErrorDomain = @"com.google.iid";

static const NSUInteger kRSA2048KeyPairSize = 2048;

@interface FIRInstanceIDKeychain () {
  dispatch_queue_t _keychainOperationQueue;
}

@end

@implementation FIRInstanceIDKeychain

+ (instancetype)sharedInstance {
  static FIRInstanceIDKeychain *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[FIRInstanceIDKeychain alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _keychainOperationQueue =
        dispatch_queue_create("com.google.FirebaseInstanceID.Keychain", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

- (CFTypeRef)itemWithQuery:(NSDictionary *)keychainQuery {
  __block SecKeyRef keyRef = NULL;
  dispatch_sync(_keychainOperationQueue, ^{
    OSStatus status =
        SecItemCopyMatching((__bridge CFDictionaryRef)keychainQuery, (CFTypeRef *)&keyRef);

    if (status != noErr) {
      if (keyRef) {
        CFRelease(keyRef);
      }
      FIRInstanceIDLoggerDebug(kFIRInstanceIDKeychainReadItemError,
                               @"Info is not found in Keychain. OSStatus: %d. Keychain query: %@",
                               (int)status, keychainQuery);
    }
  });
  return keyRef;
}

- (void)removeItemWithQuery:(NSDictionary *)keychainQuery
                    handler:(void (^)(NSError *error))handler {
  dispatch_async(_keychainOperationQueue, ^{
    OSStatus status = SecItemDelete((__bridge CFDictionaryRef)keychainQuery);
    if (status != noErr) {
      FIRInstanceIDLoggerDebug(
          kFIRInstanceIDKeychainDeleteItemError,
          @"Couldn't delete item from Keychain OSStatus: %d with the keychain query %@",
          (int)status, keychainQuery);
    }

    if (handler) {
      NSError *error;
      // When item is not found, it should NOT be considered as an error. The operation should
      // continue.
      if (status != noErr && status != errSecItemNotFound) {
        error = [NSError errorWithDomain:kFIRInstanceIDKeychainErrorDomain
                                    code:status
                                userInfo:nil];
      }
      dispatch_async(dispatch_get_main_queue(), ^{
        handler(error);
      });
    }
  });
}

- (void)addItemWithQuery:(NSDictionary *)keychainQuery handler:(void (^)(NSError *))handler {
  dispatch_async(_keychainOperationQueue, ^{
    OSStatus status = SecItemAdd((__bridge CFDictionaryRef)keychainQuery, NULL);

    if (handler) {
      NSError *error;
      if (status != noErr) {
        FIRInstanceIDLoggerWarning(kFIRInstanceIDKeychainAddItemError,
                                   @"Couldn't add item to Keychain OSStatus: %d", (int)status);
        error = [NSError errorWithDomain:kFIRInstanceIDKeychainErrorDomain
                                    code:status
                                userInfo:nil];
      }
      dispatch_async(dispatch_get_main_queue(), ^{
        handler(error);
      });
    }
  });
}

- (FIRInstanceIDKeyPair *)generateKeyPairWithPrivateTag:(NSString *)privateTag
                                              publicTag:(NSString *)publicTag {
  // TODO(chliangGoogle) this is called by appInstanceID, which is an internal API used by other
  // Firebase teams, will see if we can make it async.
  NSData *publicTagData = [publicTag dataUsingEncoding:NSUTF8StringEncoding];
  NSData *privateTagData = [privateTag dataUsingEncoding:NSUTF8StringEncoding];

  NSDictionary *privateKeyAttr = @{
    (__bridge id)kSecAttrIsPermanent : @YES,
    (__bridge id)kSecAttrApplicationTag : privateTagData,
    (__bridge id)kSecAttrLabel : @"Firebase InstanceID Key Pair Private Key",
    (__bridge id)kSecAttrAccessible : (__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
  };

  NSDictionary *publicKeyAttr = @{
    (__bridge id)kSecAttrIsPermanent : @YES,
    (__bridge id)kSecAttrApplicationTag : publicTagData,
    (__bridge id)kSecAttrLabel : @"Firebase InstanceID Key Pair Public Key",
    (__bridge id)kSecAttrAccessible : (__bridge id)kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
  };

  NSDictionary *keyPairAttributes = @{
    (__bridge id)kSecAttrKeyType : (__bridge id)kSecAttrKeyTypeRSA,
    (__bridge id)kSecAttrLabel : @"Firebase InstanceID Key Pair",
    (__bridge id)kSecAttrKeySizeInBits : @(kRSA2048KeyPairSize),
    (__bridge id)kSecPrivateKeyAttrs : privateKeyAttr,
    (__bridge id)kSecPublicKeyAttrs : publicKeyAttr,
  };

  __block SecKeyRef privateKey = NULL;
  __block SecKeyRef publicKey = NULL;
  dispatch_sync(_keychainOperationQueue, ^{
    // SecKeyGeneratePair does not allow you to set kSetAttrAccessible on the keys. We need the keys
    // to be accessible even when the device is locked (i.e. app is woken up during a push
    // notification, or some background refresh).
    OSStatus status =
        SecKeyGeneratePair((__bridge CFDictionaryRef)keyPairAttributes, &publicKey, &privateKey);
    if (status != noErr || publicKey == NULL || privateKey == NULL) {
      FIRInstanceIDLoggerWarning(kFIRInstanceIDKeychainCreateKeyPairError,
                                 @"Couldn't create keypair from Keychain OSStatus: %d",
                                 (int)status);
    }
  });
  // Extract the actual public and private key data from the Keychain
  NSDictionary *publicKeyDataQuery = FIRInstanceIDKeyPairQuery(publicTag, YES, YES);
  NSDictionary *privateKeyDataQuery = FIRInstanceIDKeyPairQuery(privateTag, YES, YES);

  NSData *publicKeyData = (__bridge NSData *)[self itemWithQuery:publicKeyDataQuery];
  NSData *privateKeyData = (__bridge NSData *)[self itemWithQuery:privateKeyDataQuery];

  return [[FIRInstanceIDKeyPair alloc] initWithPrivateKey:privateKey
                                                publicKey:publicKey
                                            publicKeyData:publicKeyData
                                           privateKeyData:privateKeyData];
}

@end
