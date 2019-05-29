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

#import "FIRInstanceIDKeyPairStore.h"

#import "FIRInstanceIDBackupExcludedPlist.h"
#import "FIRInstanceIDConstants.h"
#import "FIRInstanceIDDefines.h"
#import "FIRInstanceIDKeyPair.h"
#import "FIRInstanceIDKeyPairUtilities.h"
#import "FIRInstanceIDKeychain.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDUtilities.h"
#import "NSError+FIRInstanceID.h"

// NOTE: These values should be in sync with what InstanceID saves in as.
static NSString *const kFIRInstanceIDKeyPairStoreFileName = @"com.google.iid-keypair";

static NSString *const kFIRInstanceIDStoreKeyGenerationTime = @"cre";

static NSString *const kFIRInstanceIDStoreKeyPrefix = @"com.google.iid-";
static NSString *const kFIRInstanceIDStoreKeyPublic = @"|P|";
static NSString *const kFIRInstanceIDStoreKeyPrivate = @"|K|";
static NSString *const kFIRInstanceIDStoreKeySubtype = @"|S|";

static NSString *const kFIRInstanceIDKeyPairPublicTagPrefix = @"com.google.iid.keypair.public-";
static NSString *const kFIRInstanceIDKeyPairPrivateTagPrefix = @"com.google.iid.keypair.private-";

static const int kMaxMissingEntitlementErrorCount = 3;

NSString *const kFIRInstanceIDKeyPairSubType = @"";

// Query the key with NSData format
NSData *FIRInstanceIDKeyDataWithTag(NSString *tag) {
  _FIRInstanceIDDevAssert([tag length], @"Invalid tag for keychain specified");
  if (![tag length]) {
    return NULL;
  }
  NSDictionary *queryKey = FIRInstanceIDKeyPairQuery(tag, YES, YES);
  CFTypeRef result = [[FIRInstanceIDKeychain sharedInstance] itemWithQuery:queryKey];
  if (!result) {
    return NULL;
  }
  return (__bridge NSData *)result;
}

// Query the key given a tag
SecKeyRef FIRInstanceIDCachedKeyRefWithTag(NSString *tag) {
  _FIRInstanceIDDevAssert([tag length], @"Invalid tag for keychain specified");
  if (!tag.length) {
    return NULL;
  }
  NSDictionary *queryKey = FIRInstanceIDKeyPairQuery(tag, YES, NO);
  CFTypeRef result = [[FIRInstanceIDKeychain sharedInstance] itemWithQuery:queryKey];
  return (SecKeyRef)result;
}

// Check if keypair has been migrated from the legacy to the new version
BOOL FIRInstanceIDHasMigratedKeyPair(NSString *legacyPublicKeyTag, NSString *newPublicKeyTag) {
  NSData *oldPublicKeyData = FIRInstanceIDKeyDataWithTag(legacyPublicKeyTag);
  NSData *newPublicKeyData = FIRInstanceIDKeyDataWithTag(newPublicKeyTag);
  return [oldPublicKeyData isEqualToData:newPublicKeyData];
}

// The legacy value is hardcoded to be the same key. This is a potential problem in shared keychain
// environments.
NSString *FIRInstanceIDLegacyPublicTagWithSubtype(NSString *subtype) {
  NSString *prefix = kFIRInstanceIDStoreKeyPrefix;
  return [NSString stringWithFormat:@"%@%@%@", prefix, subtype, kFIRInstanceIDStoreKeyPublic];
}

// The legacy value is hardcoded to be the same key. This is a potential problem in shared keychain
// environments.
NSString *FIRInstanceIDLegacyPrivateTagWithSubtype(NSString *subtype) {
  NSString *prefix = kFIRInstanceIDStoreKeyPrefix;
  return [NSString stringWithFormat:@"%@%@%@", prefix, subtype, kFIRInstanceIDStoreKeyPrivate];
}

NSString *FIRInstanceIDPublicTagWithSubtype(NSString *subtype) {
  static NSString *publicTag;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *mainAppBundleID = FIRInstanceIDAppIdentifier();
    publicTag =
        [NSString stringWithFormat:@"%@%@", kFIRInstanceIDKeyPairPublicTagPrefix, mainAppBundleID];
  });
  return publicTag;
}

NSString *FIRInstanceIDPrivateTagWithSubtype(NSString *subtype) {
  static NSString *privateTag;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *mainAppBundleID = FIRInstanceIDAppIdentifier();
    privateTag =
        [NSString stringWithFormat:@"%@%@", kFIRInstanceIDKeyPairPrivateTagPrefix, mainAppBundleID];
  });
  return privateTag;
}

NSString *FIRInstanceIDCreationTimeKeyWithSubtype(NSString *subtype) {
  return [NSString stringWithFormat:@"%@%@%@", subtype, kFIRInstanceIDStoreKeySubtype,
                                    kFIRInstanceIDStoreKeyGenerationTime];
}

@interface FIRInstanceIDKeyPairStore ()

@property(nonatomic, readwrite, strong) FIRInstanceIDBackupExcludedPlist *plist;
@property(atomic, readwrite, strong) FIRInstanceIDKeyPair *keyPair;
@property(nonatomic, readwrite, assign) NSInteger keychainEntitlementsErrorCount;

@end

@implementation FIRInstanceIDKeyPairStore

- (instancetype)init {
  self = [super init];
  if (self) {
    NSString *fileName = [[self class] keyStoreFileName];
    _plist =
        [[FIRInstanceIDBackupExcludedPlist alloc] initWithFileName:fileName
                                                      subDirectory:kFIRInstanceIDSubDirectoryName];
  }
  return self;
}

- (BOOL)invalidateKeyPairsIfNeeded {
  // Currently keypairs are always invalidated if self.plist is missing. This normally indicates
  // a fresh install (or an uninstall/reinstall). In those situations the key pairs should be
  // deleted.
  // NOTE: Although this class refers to multiple key pairs, with different subtypes, in practice
  // only a single subtype is currently supported. (b/64906549)
  if (![self.plist doesFileExist]) {
    // A fresh install, clear all the key pairs in the key chain. Do not perform migration as all
    // key pairs are gone.
    [self deleteSavedKeyPairWithSubtype:kFIRInstanceIDKeyPairSubType handler:nil];
    return YES;
  }
  // Not a fresh install, perform migration at early state.
  [self migrateKeyPairCacheIfNeededWithHandler:nil];
  return NO;
}

- (BOOL)hasCachedKeyPairs {
  NSError *error;
  if ([self cachedKeyPairWithSubtype:kFIRInstanceIDKeyPairSubType error:&error] == nil) {
    if (error) {
      FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeKeyPairStore000,
                               @"Failed to get the cached keyPair %@", error);
    }
    error = nil;
    [self removeKeyPairCreationTimePlistWithError:&error];
    if (error) {
      FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeKeyPairStore001,
                               @"Failed to remove keyPair creationTime plist %@", error);
    }
    return NO;
  }
  return YES;
}

- (NSString *)appIdentityWithError:(NSError *__autoreleasing *)error {
  // Load the keyPair from Keychain (or generate a key pair, if this is the first run of the app).
  FIRInstanceIDKeyPair *keyPair = [self loadKeyPairWithError:error];
  if (!keyPair) {
    FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPairStoreCouldNotLoadKeyPair,
                             @"Keypair could not be loaded from Keychain. Error: %@", (*error));
    return nil;
  }

  if (error) {
    *error = nil;
  }
  NSString *appIdentity = FIRInstanceIDAppIdentity(keyPair);
  if (!appIdentity.length) {
    if (error) {
      *error = [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeUnknown];
    }
  }
  return appIdentity;
}

- (FIRInstanceIDKeyPair *)loadKeyPairWithError:(NSError **)error {
  // In case we call this from different threads we don't want to generate or fetch the
  // keyPair multiple times. Once we have a keyPair in the cache it would mostly be used
  // from there.
  @synchronized(self) {
    if ([self.keyPair isValid]) {
      return self.keyPair;
    }

    if (self.keychainEntitlementsErrorCount >= kMaxMissingEntitlementErrorCount) {
      FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeKeyPairStore002,
                               @"Keychain not accessible, Entitlements missing error (-34018). "
                               @"Will not check token in cache.");
      return nil;
    }

    if (!self.keyPair) {
      self.keyPair = [self validCachedKeyPairWithSubtype:kFIRInstanceIDKeyPairSubType error:error];
    }

    if ((*error).code == kFIRInstanceIDSecMissingEntitlementErrorCode) {
      self.keychainEntitlementsErrorCount++;
    }

    if (!self.keyPair) {
      self.keyPair = [self generateAndSaveKeyWithSubtype:kFIRInstanceIDKeyPairSubType
                                            creationTime:FIRInstanceIDCurrentTimestampInSeconds()
                                                   error:error];
    }
  }
  return self.keyPair;
}

// TODO(chliangGoogle: Remove subtype support, as it's not being used.
- (FIRInstanceIDKeyPair *)generateAndSaveKeyWithSubtype:(NSString *)subtype
                                           creationTime:(int64_t)creationTime
                                                  error:(NSError **)error {
  NSString *publicKeyTag = FIRInstanceIDPublicTagWithSubtype(subtype);
  NSString *privateKeyTag = FIRInstanceIDPrivateTagWithSubtype(subtype);
  FIRInstanceIDKeyPair *keyPair =
      [[FIRInstanceIDKeychain sharedInstance] generateKeyPairWithPrivateTag:privateKeyTag
                                                                  publicTag:publicKeyTag];

  if (![keyPair isValid]) {
    FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPairStore003,
                             @"Unable to generate keypair.");
    return nil;
  }

  NSString *creationTimeKey = FIRInstanceIDCreationTimeKeyWithSubtype(subtype);
  NSDictionary *keyPairData = @{creationTimeKey : @(creationTime)};

  if (error) {
    *error = nil;
  }
  NSMutableDictionary *allKeyPairs = [[self.plist contentAsDictionary] mutableCopy];
  if (allKeyPairs.count) {
    [allKeyPairs addEntriesFromDictionary:keyPairData];
  } else {
    allKeyPairs = [keyPairData mutableCopy];
  }
  if (![self.plist writeDictionary:allKeyPairs error:error]) {
    [FIRInstanceIDKeyPairStore deleteKeyPairWithPrivateTag:privateKeyTag
                                                 publicTag:publicKeyTag
                                                   handler:nil];
    FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPairStore004,
                             @"Failed to save keypair data to plist %@", error ? *error : @"");
    return nil;
  }

  return keyPair;
}

- (FIRInstanceIDKeyPair *)validCachedKeyPairWithSubtype:(NSString *)subtype
                                                  error:(NSError **)error {
  // On a new install (or if the ID was deleted), the plist will be missing, which should trigger
  // a reset of the key pairs in Keychain (if they exist).
  NSDictionary *allKeyPairs = [self.plist contentAsDictionary];
  NSString *creationTimeKey = FIRInstanceIDCreationTimeKeyWithSubtype(subtype);

  if (allKeyPairs[creationTimeKey] > 0) {
    return [self cachedKeyPairWithSubtype:subtype error:error];
  } else {
    // There is no need to reset keypair again here as FIRInstanceID init call is always
    // going to be ahead of this call, which already trigger keypair reset if it's new install
    FIRInstanceIDErrorCode code = kFIRInstanceIDErrorCodeInvalidKeyPairCreationTime;
    if (error) {
      *error = [NSError errorWithFIRInstanceIDErrorCode:code];
    }
    return nil;
  }
}

- (FIRInstanceIDKeyPair *)cachedKeyPairWithSubtype:(NSString *)subtype
                                             error:(NSError *__autoreleasing *)error {
  // base64 encoded keys
  NSString *publicKeyTag = FIRInstanceIDPublicTagWithSubtype(subtype);
  NSString *privateKeyTag = FIRInstanceIDPrivateTagWithSubtype(subtype);
  return [FIRInstanceIDKeyPairStore keyPairForPrivateKeyTag:privateKeyTag
                                               publicKeyTag:publicKeyTag
                                                      error:error];
}

+ (FIRInstanceIDKeyPair *)keyPairForPrivateKeyTag:(NSString *)privateKeyTag
                                     publicKeyTag:(NSString *)publicKeyTag
                                            error:(NSError *__autoreleasing *)error {
  _FIRInstanceIDDevAssert([privateKeyTag length] && [publicKeyTag length],
                          @"Invalid tags for keypair");
  if (![privateKeyTag length] || ![publicKeyTag length]) {
    if (error) {
      *error = [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeInvalidKeyPairTags];
    }
    return nil;
  }

  SecKeyRef privateKeyRef = FIRInstanceIDCachedKeyRefWithTag(privateKeyTag);
  SecKeyRef publicKeyRef = FIRInstanceIDCachedKeyRefWithTag(publicKeyTag);

  if (!privateKeyRef || !publicKeyRef) {
    if (error) {
      *error = [NSError errorWithFIRInstanceIDErrorCode:kFIRInstanceIDErrorCodeMissingKeyPair];
    }
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeKeyPair000,
                             @"No keypair info is found with tag %@", privateKeyTag);
    return nil;
  }

  NSData *publicKeyData = FIRInstanceIDKeyDataWithTag(publicKeyTag);
  NSData *privateKeyData = FIRInstanceIDKeyDataWithTag(privateKeyTag);

  FIRInstanceIDKeyPair *keyPair = [[FIRInstanceIDKeyPair alloc] initWithPrivateKey:privateKeyRef
                                                                         publicKey:publicKeyRef
                                                                     publicKeyData:publicKeyData
                                                                    privateKeyData:privateKeyData];
  return keyPair;
}

// Migrates from keypair saved under legacy keys (hardcoded value) to dynamic keys (stable, but
// unique for the app's bundle id
- (void)migrateKeyPairCacheIfNeededWithHandler:(void (^)(NSError *error))handler {
  // Attempt to load keypair using legacy keys
  NSString *legacyPublicKeyTag =
      FIRInstanceIDLegacyPublicTagWithSubtype(kFIRInstanceIDKeyPairSubType);
  NSString *legacyPrivateKeyTag =
      FIRInstanceIDLegacyPrivateTagWithSubtype(kFIRInstanceIDKeyPairSubType);
  NSError *error;
  FIRInstanceIDKeyPair *keyPair =
      [FIRInstanceIDKeyPairStore keyPairForPrivateKeyTag:legacyPrivateKeyTag
                                            publicKeyTag:legacyPublicKeyTag
                                                   error:&error];
  if (![keyPair isValid]) {
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeKeyPairNoLegacyKeyPair,
                             @"There's no legacy keypair so no need to do migration.");
    if (handler) {
      handler(nil);
    }
    return;
  }

  // Check whether migration already done.
  NSString *publicKeyTag = FIRInstanceIDPublicTagWithSubtype(kFIRInstanceIDKeyPairSubType);
  if (FIRInstanceIDHasMigratedKeyPair(legacyPublicKeyTag, publicKeyTag)) {
    if (handler) {
      handler(nil);
    }
    return;
  }

  // Also cache locally since we are sure to use the migrated key pair.
  self.keyPair = keyPair;

  // Either new key pair doesn't exist or it's different than legacy key pair, start the migration.
  __block NSError *updateKeyRefError;

  NSString *privateKeyTag = FIRInstanceIDPrivateTagWithSubtype(kFIRInstanceIDKeyPairSubType);
  [self updateKeyRef:keyPair.publicKey
             withTag:publicKeyTag
             handler:^(NSError *error) {
               if (error) {
                 FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPairMigrationError,
                                          @"Unable to migrate key pair from legacy ones.");
                 updateKeyRefError = error;
               }
             }];

  [self updateKeyRef:keyPair.privateKey
             withTag:privateKeyTag
             handler:^(NSError *error) {
               if (error) {
                 FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPairMigrationError,
                                          @"Unable to migrate key pair from legacy ones.");
                 updateKeyRefError = error;
               }

               if (handler) {
                 handler(updateKeyRefError);
               }
             }];
}

// Used for migrating from legacy tags to updated tags. The legacy keychain is not deleted for
// backward compatibility.
// TODO(chliangGoogle) Delete the legacy keychain when GCM is fully deprecated.
- (void)updateKeyRef:(SecKeyRef)keyRef
             withTag:(NSString *)tag
             handler:(void (^)(NSError *error))handler {
  NSData *updatedTagData = [tag dataUsingEncoding:NSUTF8StringEncoding];

  __block NSError *keychainError;

  // Always delete the old keychain before adding a new one to avoid conflicts.
  NSDictionary *deleteQuery = @{
    (__bridge id)kSecAttrApplicationTag : updatedTagData,
    (__bridge id)kSecClass : (__bridge id)kSecClassKey,
    (__bridge id)kSecAttrKeyType : (__bridge id)kSecAttrKeyTypeRSA,
    (__bridge id)kSecReturnRef : @(YES),
  };
  [[FIRInstanceIDKeychain sharedInstance] removeItemWithQuery:deleteQuery
                                                      handler:^(NSError *error) {
                                                        if (error) {
                                                          keychainError = error;
                                                        }
                                                      }];

  NSDictionary *addQuery = @{
    (__bridge id)kSecAttrApplicationTag : updatedTagData,
    (__bridge id)kSecClass : (__bridge id)kSecClassKey,
    (__bridge id)kSecValueRef : (__bridge id)keyRef,
    (__bridge id)kSecAttrAccessible : (__bridge id)kSecAttrAccessibleAlwaysThisDeviceOnly,
  };
  [[FIRInstanceIDKeychain sharedInstance] addItemWithQuery:addQuery
                                                   handler:^(NSError *addError) {
                                                     if (addError) {
                                                       keychainError = addError;
                                                     }

                                                     if (handler) {
                                                       handler(keychainError);
                                                     }
                                                   }];
}

- (void)deleteSavedKeyPairWithSubtype:(NSString *)subtype
                              handler:(void (^)(NSError *error))handler {
  NSDictionary *allKeyPairs = [self.plist contentAsDictionary];

  NSString *publicKeyTag = FIRInstanceIDPublicTagWithSubtype(subtype);
  NSString *privateKeyTag = FIRInstanceIDPrivateTagWithSubtype(subtype);
  NSString *creationTimeKey = FIRInstanceIDCreationTimeKeyWithSubtype(subtype);

  // remove the creation time
  if (allKeyPairs[creationTimeKey] > 0) {
    NSMutableDictionary *newKeyPairs = [NSMutableDictionary dictionaryWithDictionary:allKeyPairs];
    [newKeyPairs removeObjectForKey:creationTimeKey];

    NSError *plistError;
    if (![self.plist writeDictionary:newKeyPairs error:&plistError]) {
      FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPairStore006,
                               @"Unable to remove keypair creation time from plist %@", plistError);
    }
  }

  self.keyPair = nil;

  [FIRInstanceIDKeyPairStore
      deleteKeyPairWithPrivateTag:privateKeyTag
                        publicTag:publicKeyTag
                          handler:^(NSError *error) {
                            // Delete legacy key pairs from GCM/FCM If they exist. All key pairs
                            // should be deleted when app is newly installed.
                            NSString *legacyPublicKeyTag =
                                FIRInstanceIDLegacyPublicTagWithSubtype(subtype);
                            NSString *legacyPrivateKeyTag =
                                FIRInstanceIDLegacyPrivateTagWithSubtype(subtype);
                            [FIRInstanceIDKeyPairStore
                                deleteKeyPairWithPrivateTag:legacyPrivateKeyTag
                                                  publicTag:legacyPublicKeyTag
                                                    handler:nil];
                            if (error) {
                              FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPairStore007,
                                                       @"Unable to remove RSA keypair, error: %@",
                                                       error);
                              if (handler) {
                                handler(error);
                              }
                            } else {
                              if (handler) {
                                handler(nil);
                              }
                            }
                          }];
}

+ (void)deleteKeyPairWithPrivateTag:(NSString *)privateTag
                          publicTag:(NSString *)publicTag
                            handler:(void (^)(NSError *))handler {
  NSDictionary *queryPublicKey = FIRInstanceIDKeyPairQuery(publicTag, NO, NO);
  NSDictionary *queryPrivateKey = FIRInstanceIDKeyPairQuery(privateTag, NO, NO);

  __block NSError *keychainError;

  // Always remove public key first because it is the key we generate IID.
  [[FIRInstanceIDKeychain sharedInstance] removeItemWithQuery:queryPublicKey
                                                      handler:^(NSError *error) {
                                                        if (error) {
                                                          keychainError = error;
                                                        }
                                                      }];

  [[FIRInstanceIDKeychain sharedInstance] removeItemWithQuery:queryPrivateKey
                                                      handler:^(NSError *error) {
                                                        if (error) {
                                                          keychainError = error;
                                                        }

                                                        if (handler) {
                                                          handler(keychainError);
                                                        }
                                                      }];
}

- (BOOL)removeKeyPairCreationTimePlistWithError:(NSError *__autoreleasing *)error {
  if (![self.plist deleteFile:error]) {
    FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeKeyPairStore008,
                             @"Unable to delete keypair creation times plist");
    return NO;
  }
  return YES;
}

+ (NSString *)keyStoreFileName {
  return kFIRInstanceIDKeyPairStoreFileName;
}

@end
