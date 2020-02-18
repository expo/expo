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

#import "FIRInstanceIDStore.h"

#import "FIRInstanceIDCheckinPreferences.h"
#import "FIRInstanceIDCheckinStore.h"
#import "FIRInstanceIDConstants.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDTokenStore.h"
#import "FIRInstanceIDVersionUtilities.h"

// NOTE: These values should be in sync with what InstanceID saves in as.
static NSString *const kCheckinFileName = @"g-checkin";

// APNS token (use the old key value i.e. with prefix GMS)
static NSString *const kFIRInstanceIDLibraryVersion = @"GMSInstanceID-version";

@interface FIRInstanceIDStore ()

@property(nonatomic, readwrite, strong) FIRInstanceIDCheckinStore *checkinStore;
@property(nonatomic, readwrite, strong) FIRInstanceIDTokenStore *tokenStore;

@end

@implementation FIRInstanceIDStore

- (instancetype)initWithDelegate:(NSObject<FIRInstanceIDStoreDelegate> *)delegate {
  FIRInstanceIDCheckinStore *checkinStore = [[FIRInstanceIDCheckinStore alloc]
      initWithCheckinPlistFileName:kCheckinFileName
                  subDirectoryName:kFIRInstanceIDSubDirectoryName];

  FIRInstanceIDTokenStore *tokenStore = [FIRInstanceIDTokenStore defaultStore];

  return [self initWithCheckinStore:checkinStore tokenStore:tokenStore delegate:delegate];
}

- (instancetype)initWithCheckinStore:(FIRInstanceIDCheckinStore *)checkinStore
                          tokenStore:(FIRInstanceIDTokenStore *)tokenStore
                            delegate:(NSObject<FIRInstanceIDStoreDelegate> *)delegate {
  self = [super init];
  if (self) {
    _checkinStore = checkinStore;
    _tokenStore = tokenStore;
    _delegate = delegate;
    [self resetCredentialsIfNeeded];
  }
  return self;
}

#pragma mark - Upgrades

+ (BOOL)hasSubDirectory:(NSString *)subDirectoryName {
  NSString *subDirectoryPath = [self pathForSupportSubDirectory:subDirectoryName];
  BOOL isDirectory;
  if (![[NSFileManager defaultManager] fileExistsAtPath:subDirectoryPath
                                            isDirectory:&isDirectory]) {
    return NO;
  } else if (!isDirectory) {
    return NO;
  }
  return YES;
}

+ (NSSearchPathDirectory)supportedDirectory {
#if TARGET_OS_TV
  return NSCachesDirectory;
#else
  return NSApplicationSupportDirectory;
#endif
}

+ (NSString *)pathForSupportSubDirectory:(NSString *)subDirectoryName {
  NSArray *directoryPaths =
      NSSearchPathForDirectoriesInDomains([self supportedDirectory], NSUserDomainMask, YES);
  NSString *dirPath = directoryPaths.lastObject;
  NSArray *components = @[ dirPath, subDirectoryName ];
  return [NSString pathWithComponents:components];
}

+ (BOOL)createSubDirectory:(NSString *)subDirectoryName {
  NSString *subDirectoryPath = [self pathForSupportSubDirectory:subDirectoryName];
  BOOL hasSubDirectory;

  if (![[NSFileManager defaultManager] fileExistsAtPath:subDirectoryPath
                                            isDirectory:&hasSubDirectory]) {
    NSError *error;
    [[NSFileManager defaultManager] createDirectoryAtPath:subDirectoryPath
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:&error];
    if (error) {
      FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeStore000,
                               @"Cannot create directory %@, error: %@", subDirectoryPath, error);
      return NO;
    }
  } else {
    if (!hasSubDirectory) {
      FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeStore001,
                               @"Found file instead of directory at %@", subDirectoryPath);
      return NO;
    }
  }
  return YES;
}

+ (BOOL)removeSubDirectory:(NSString *)subDirectoryName error:(NSError **)error {
  if ([self hasSubDirectory:subDirectoryName]) {
    NSString *subDirectoryPath = [self pathForSupportSubDirectory:subDirectoryName];
    BOOL isDirectory;
    if ([[NSFileManager defaultManager] fileExistsAtPath:subDirectoryPath
                                             isDirectory:&isDirectory]) {
      return [[NSFileManager defaultManager] removeItemAtPath:subDirectoryPath error:error];
    }
  }
  return YES;
}

/**
 *  Reset the keychain preferences if the app had been deleted earlier and then reinstalled.
 *  Keychain preferences are not cleared in the above scenario so explicitly clear them.
 *
 *  In case of an iCloud backup and restore the Keychain preferences should already be empty
 *  since the Keychain items are marked with `*BackupThisDeviceOnly`.
 */
- (void)resetCredentialsIfNeeded {
  BOOL checkinPlistExists = [self.checkinStore hasCheckinPlist];
  // Checkin info existed in backup excluded plist. Should not be a fresh install.
  if (checkinPlistExists) {
    // FCM user can still have the old version of checkin, migration should only happen once.
    [self.checkinStore migrateCheckinItemIfNeeded];
    return;
  }

  // reset checkin in keychain if a fresh install.
  // set the old checkin preferences to unregister pre-registered tokens
  FIRInstanceIDCheckinPreferences *oldCheckinPreferences =
      [self.checkinStore cachedCheckinPreferences];

  if (oldCheckinPreferences) {
    [self.checkinStore removeCheckinPreferencesWithHandler:^(NSError *error) {
      if (!error) {
        FIRInstanceIDLoggerDebug(
            kFIRInstanceIDMessageCodeStore002,
            @"Removed cached checkin preferences from Keychain because this is a fresh install.");
      } else {
        FIRInstanceIDLoggerError(
            kFIRInstanceIDMessageCodeStore003,
            @"Couldn't remove cached checkin preferences for a fresh install. Error: %@", error);
      }
      if (oldCheckinPreferences.deviceID.length && oldCheckinPreferences.secretToken.length) {
        FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeStore006,
                                 @"App reset detected. Will delete server registrations.");
        // We don't really need to delete old FCM tokens created via IID auth tokens since
        // those tokens are already hashed by APNS token as the has so creating a new
        // token should automatically delete the old-token.
        [self.delegate store:self didDeleteFCMScopedTokensForCheckin:oldCheckinPreferences];
      } else {
        FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeStore009,
                                 @"App reset detected but no valid checkin auth preferences found."
                                 @" Will not delete server registrations.");
      }
    }];
  }
}

#pragma mark - Get

- (FIRInstanceIDTokenInfo *)tokenInfoWithAuthorizedEntity:(NSString *)authorizedEntity
                                                    scope:(NSString *)scope {
  // TODO(chliangGoogle): If we don't have the token plist we should delete all the tokens from
  // the keychain. This is because not having the plist signifies a backup and restore operation.
  // In case the keychain has any tokens these would now be stale and therefore should be
  // deleted.
  if (![authorizedEntity length] || ![scope length]) {
    return nil;
  }
  FIRInstanceIDTokenInfo *info = [self.tokenStore tokenInfoWithAuthorizedEntity:authorizedEntity
                                                                          scope:scope];
  return info;
}

- (NSArray<FIRInstanceIDTokenInfo *> *)cachedTokenInfos {
  return [self.tokenStore cachedTokenInfos];
}

#pragma mark - Save

- (void)saveTokenInfo:(FIRInstanceIDTokenInfo *)tokenInfo
              handler:(void (^)(NSError *error))handler {
  [self.tokenStore saveTokenInfo:tokenInfo handler:handler];
}

#pragma mark - Delete

- (void)removeCachedTokenWithAuthorizedEntity:(NSString *)authorizedEntity scope:(NSString *)scope {
  if (![authorizedEntity length] || ![scope length]) {
    FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeStore012,
                             @"Will not delete token with invalid entity: %@, scope: %@",
                             authorizedEntity, scope);
    return;
  }
  [self.tokenStore removeTokenWithAuthorizedEntity:authorizedEntity scope:scope];
}

- (void)removeAllCachedTokensWithHandler:(void (^)(NSError *error))handler {
  [self.tokenStore removeAllTokensWithHandler:handler];
}

#pragma mark - FIRInstanceIDCheckinCache protocol

- (void)saveCheckinPreferences:(FIRInstanceIDCheckinPreferences *)preferences
                       handler:(void (^)(NSError *error))handler {
  [self.checkinStore saveCheckinPreferences:preferences handler:handler];
}

- (FIRInstanceIDCheckinPreferences *)cachedCheckinPreferences {
  return [self.checkinStore cachedCheckinPreferences];
}

- (void)removeCheckinPreferencesWithHandler:(void (^)(NSError *))handler {
  [self.checkinStore removeCheckinPreferencesWithHandler:^(NSError *error) {
    if (handler) {
      handler(error);
    }
  }];
}

@end
