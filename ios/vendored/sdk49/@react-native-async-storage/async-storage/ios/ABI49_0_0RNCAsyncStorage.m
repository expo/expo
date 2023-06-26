/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNCAsyncStorage.h"

#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonDigest.h>

#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>
#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>

// NOTE(kudo): Use Expo storage directory for backward compatibility
//static NSString *const ABI49_0_0RCTStorageDirectory = @"ABI49_0_0RCTAsyncLocalStorage_V1";
static NSString *const ABI49_0_0RCTStorageDirectory = @"ABI49_0_0RCTAsyncLocalStorage";
static NSString *const ABI49_0_0RCTOldStorageDirectory = @"ABI49_0_0RNCAsyncLocalStorage_V1";
static NSString *const ABI49_0_0RCTExpoStorageDirectory = @"ABI49_0_0RCTAsyncLocalStorage";
static NSString *const ABI49_0_0RCTManifestFileName = @"manifest.json";
static const NSUInteger ABI49_0_0RCTInlineValueThreshold = 1024;

#pragma mark - Static helper functions

static NSDictionary *ABI49_0_0RCTErrorForKey(NSString *key)
{
    if (![key isKindOfClass:[NSString class]]) {
        return ABI49_0_0RCTMakeAndLogError(@"Invalid key - must be a string.  Key: ", key, @{@"key": key});
    } else if (key.length < 1) {
        return ABI49_0_0RCTMakeAndLogError(
            @"Invalid key - must be at least one character.  Key: ", key, @{@"key": key});
    } else {
        return nil;
    }
}

static BOOL ABI49_0_0RCTAsyncStorageSetExcludedFromBackup(NSString *path, NSNumber *isExcluded)
{
    NSFileManager *fileManager = [[NSFileManager alloc] init];

    BOOL isDir;
    BOOL exists = [fileManager fileExistsAtPath:path isDirectory:&isDir];
    BOOL success = false;

    if (isDir && exists) {
        NSURL *pathUrl = [NSURL fileURLWithPath:path];
        NSError *error = nil;
        success = [pathUrl setResourceValue:isExcluded
                                     forKey:NSURLIsExcludedFromBackupKey
                                      error:&error];

        if (!success) {
            NSLog(@"Could not exclude AsyncStorage dir from backup %@", error);
        }
    }
    return success;
}

static void ABI49_0_0RCTAppendError(NSDictionary *error, NSMutableArray<NSDictionary *> **errors)
{
    if (error && errors) {
        if (!*errors) {
            *errors = [NSMutableArray new];
        }
        [*errors addObject:error];
    }
}

static NSArray<NSDictionary *> *ABI49_0_0RCTMakeErrors(NSArray<id<NSObject>> *results)
{
    NSMutableArray<NSDictionary *> *errors;
    for (id object in results) {
        if ([object isKindOfClass:[NSError class]]) {
            NSError *error = (NSError *)object;
            NSDictionary *keyError = ABI49_0_0RCTMakeError(error.localizedDescription, error, nil);
            ABI49_0_0RCTAppendError(keyError, &errors);
        }
    }
    return errors;
}

static NSString *ABI49_0_0RCTReadFile(NSString *filePath, NSString *key, NSDictionary **errorOut)
{
    if ([[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
        NSError *error;
        NSStringEncoding encoding;
        NSString *entryString = [NSString stringWithContentsOfFile:filePath
                                                      usedEncoding:&encoding
                                                             error:&error];
        NSDictionary *extraData = @{@"key": ABI49_0_0RCTNullIfNil(key)};

        if (error) {
            if (errorOut) {
                *errorOut = ABI49_0_0RCTMakeError(@"Failed to read storage file.", error, extraData);
            }
            return nil;
        }

        if (encoding != NSUTF8StringEncoding) {
            if (errorOut) {
                *errorOut =
                    ABI49_0_0RCTMakeError(@"Incorrect encoding of storage file: ", @(encoding), extraData);
            }
            return nil;
        }
        return entryString;
    }

    return nil;
}

// DO NOT USE
// This is used internally to migrate data from the old file location to the new one.
// Please use `ABI49_0_0RCTCreateStorageDirectoryPath` instead
static NSString *ABI49_0_0RCTCreateStorageDirectoryPath_deprecated(NSString *storageDir)
{
    NSString *storageDirectoryPath;
#if TARGET_OS_TV
    storageDirectoryPath =
        NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
#else
    storageDirectoryPath =
        NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
#endif
    storageDirectoryPath = [storageDirectoryPath stringByAppendingPathComponent:storageDir];
    return storageDirectoryPath;
}

static NSString *ABI49_0_0RCTCreateStorageDirectoryPath(NSString *storageDir)
{
    NSString *storageDirectoryPath = @"";

#if TARGET_OS_TV
    storageDirectoryPath =
        NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
#else
    storageDirectoryPath =
        NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES)
            .firstObject;
    // We should use the "Application Support/[bundleID]" folder for persistent data storage that's
    // hidden from users
    storageDirectoryPath = [storageDirectoryPath
        stringByAppendingPathComponent:[[NSBundle mainBundle] bundleIdentifier]];
#endif

    // Per Apple's docs, all app content in Application Support must be within a subdirectory of the
    // app's bundle identifier
    storageDirectoryPath = [storageDirectoryPath stringByAppendingPathComponent:storageDir];

    return storageDirectoryPath;
}

static NSString *ABI49_0_0RCTCreateManifestFilePath(NSString *storageDirectory)
{
    return [storageDirectory stringByAppendingPathComponent:ABI49_0_0RCTManifestFileName];
}

// Only merges objects - all other types are just clobbered (including arrays)
static BOOL ABI49_0_0RCTMergeRecursive(NSMutableDictionary *destination, NSDictionary *source)
{
    BOOL modified = NO;
    for (NSString *key in source) {
        id sourceValue = source[key];
        id destinationValue = destination[key];
        if ([sourceValue isKindOfClass:[NSDictionary class]]) {
            if ([destinationValue isKindOfClass:[NSDictionary class]]) {
                if ([destinationValue classForCoder] != [NSMutableDictionary class]) {
                    destinationValue = [destinationValue mutableCopy];
                }
                if (ABI49_0_0RCTMergeRecursive(destinationValue, sourceValue)) {
                    destination[key] = destinationValue;
                    modified = YES;
                }
            } else {
                destination[key] = [sourceValue copy];
                modified = YES;
            }
        } else if (![source isEqual:destinationValue]) {
            destination[key] = [sourceValue copy];
            modified = YES;
        }
    }
    return modified;
}

static BOOL ABI49_0_0RCTHasCreatedStorageDirectory = NO;

// NOTE(nikki93): We replace with scoped implementations of:
//   ABI49_0_0RCTGetStorageDirectory()
//   ABI49_0_0RCTGetManifestFilePath()
//   ABI49_0_0RCTGetMethodQueue()
//   ABI49_0_0RCTGetCache()
//   ABI49_0_0RCTDeleteStorageDirectory()

#define ABI49_0_0RCTGetStorageDirectory() _storageDirectory
#define ABI49_0_0RCTGetManifestFilePath() _manifestFilePath
#define ABI49_0_0RCTGetMethodQueue() self.methodQueue
#define ABI49_0_0RCTGetCache() self.cache

static NSDictionary *ABI49_0_0RCTDeleteStorageDirectory(NSString *storageDirectory)
{
  NSError *error;
  [[NSFileManager defaultManager] removeItemAtPath:storageDirectory error:&error];
  return error ? ABI49_0_0RCTMakeError(@"Failed to delete storage directory.", error, nil) : nil;
}
#define ABI49_0_0RCTDeleteStorageDirectory() ABI49_0_0RCTDeleteStorageDirectory(_storageDirectory)

static NSDate *ABI49_0_0RCTManifestModificationDate(NSString *manifestFilePath)
{
    NSDictionary *attributes =
        [[NSFileManager defaultManager] attributesOfItemAtPath:manifestFilePath error:nil];
    return [attributes fileModificationDate];
}

/**
 * Creates an NSException used during Storage Directory Migration.
 */
static void ABI49_0_0RCTStorageDirectoryMigrationLogError(NSString *reason, NSError *error)
{
    ABI49_0_0RCTLogWarn(@"%@: %@", reason, error ? error.description : @"");
}

static void ABI49_0_0RCTStorageDirectoryCleanupOld(NSString *oldDirectoryPath)
{
    NSError *error;
    if (![[NSFileManager defaultManager] removeItemAtPath:oldDirectoryPath error:&error]) {
        ABI49_0_0RCTStorageDirectoryMigrationLogError(
            @"Failed to remove old storage directory during migration", error);
    }
}

static void _createStorageDirectory(NSString *storageDirectory, NSError **error)
{
    [[NSFileManager defaultManager] createDirectoryAtPath:storageDirectory
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:error];
}

static void ABI49_0_0RCTStorageDirectoryMigrate(NSString *oldDirectoryPath,
                                       NSString *newDirectoryPath,
                                       BOOL shouldCleanupOldDirectory)
{
  assert(false);
}

/**
 * Determine which of ABI49_0_0RCTOldStorageDirectory or ABI49_0_0RCTExpoStorageDirectory needs to migrated.
 * If both exist, we remove the least recently modified and return the most recently modified.
 * Otherwise, this will return the path to whichever directory exists.
 * If no directory exists, then return nil.
 */
static NSString *ABI49_0_0RCTGetStoragePathForMigration()
{
    BOOL isDir;
    NSString *oldStoragePath = ABI49_0_0RCTCreateStorageDirectoryPath_deprecated(ABI49_0_0RCTOldStorageDirectory);
    NSString *expoStoragePath = ABI49_0_0RCTCreateStorageDirectoryPath_deprecated(ABI49_0_0RCTExpoStorageDirectory);
    NSFileManager *fileManager = [NSFileManager defaultManager];
    BOOL oldStorageDirectoryExists =
        [fileManager fileExistsAtPath:oldStoragePath isDirectory:&isDir] && isDir;
    BOOL expoStorageDirectoryExists =
        [fileManager fileExistsAtPath:expoStoragePath isDirectory:&isDir] && isDir;

    // Check if both the old storage directory and Expo storage directory exist
    if (oldStorageDirectoryExists && expoStorageDirectoryExists) {
        // If the old storage has been modified more recently than Expo storage, then clear Expo
        // storage. Otherwise, clear the old storage.
        if ([ABI49_0_0RCTManifestModificationDate(ABI49_0_0RCTCreateManifestFilePath(oldStoragePath))
                compare:ABI49_0_0RCTManifestModificationDate(ABI49_0_0RCTCreateManifestFilePath(expoStoragePath))] ==
            NSOrderedDescending) {
            ABI49_0_0RCTStorageDirectoryCleanupOld(expoStoragePath);
            return oldStoragePath;
        } else {
            ABI49_0_0RCTStorageDirectoryCleanupOld(oldStoragePath);
            return expoStoragePath;
        }
    } else if (oldStorageDirectoryExists) {
        return oldStoragePath;
    } else if (expoStorageDirectoryExists) {
        return expoStoragePath;
    } else {
        return nil;
    }
}

/**
 * This check is added to make sure that anyone coming from pre-1.2.2 does not lose cached data.
 * Check that data is migrated from the old location to the new location
 * fromStorageDirectory: the directory where the older data lives
 * toStorageDirectory: the directory where the new data should live
 * shouldCleanupOldDirectoryAndOverwriteNewDirectory: YES if we should delete the old directory's
 * contents and overwrite the new directory's contents during the migration to the new directory
 */
static void
ABI49_0_0RCTStorageDirectoryMigrationCheck(NSString *fromStorageDirectory,
                                  NSString *toStorageDirectory,
                                  BOOL shouldCleanupOldDirectoryAndOverwriteNewDirectory)
{
    NSError *error;
    BOOL isDir;
    NSFileManager *fileManager = [NSFileManager defaultManager];
    // If the old directory exists, it means we may need to migrate old data to the new directory
    if ([fileManager fileExistsAtPath:fromStorageDirectory isDirectory:&isDir] && isDir) {
        // Check if the new storage directory location already exists
        if ([fileManager fileExistsAtPath:toStorageDirectory]) {
            // If new storage location exists, check if the new storage has been modified sooner in
            // which case we may want to cleanup the old location
            if ([ABI49_0_0RCTManifestModificationDate(ABI49_0_0RCTCreateManifestFilePath(toStorageDirectory))
                    compare:ABI49_0_0RCTManifestModificationDate(
                                ABI49_0_0RCTCreateManifestFilePath(fromStorageDirectory))] == 1) {
                // If new location has been modified more recently, simply clean out old data
                if (shouldCleanupOldDirectoryAndOverwriteNewDirectory) {
                    ABI49_0_0RCTStorageDirectoryCleanupOld(fromStorageDirectory);
                }
            } else if (shouldCleanupOldDirectoryAndOverwriteNewDirectory) {
                // If old location has been modified more recently, remove new storage and migrate
                if (![fileManager removeItemAtPath:toStorageDirectory error:&error]) {
                    ABI49_0_0RCTStorageDirectoryMigrationLogError(
                        @"Failed to remove new storage directory during migration", error);
                } else {
                    ABI49_0_0RCTStorageDirectoryMigrate(fromStorageDirectory,
                                               toStorageDirectory,
                                               shouldCleanupOldDirectoryAndOverwriteNewDirectory);
                }
            }
        } else {
            // If new storage location doesn't exist, migrate data
            ABI49_0_0RCTStorageDirectoryMigrate(fromStorageDirectory,
                                       toStorageDirectory,
                                       shouldCleanupOldDirectoryAndOverwriteNewDirectory);
        }
    }
}

#pragma mark - ABI49_0_0RNCAsyncStorage

@interface ABI49_0_0RNCAsyncStorage ()

@property (nonatomic, copy) NSString *storageDirectory;
@property (nonatomic, copy) NSString *manifestFilePath;

@end

@implementation ABI49_0_0RNCAsyncStorage {
    BOOL _haveSetup;
    // The manifest is a dictionary of all keys with small values inlined.  Null values indicate
    // values that are stored in separate files (as opposed to nil values which don't exist).  The
    // manifest is read off disk at startup, and written to disk after all mutations.
    NSMutableDictionary<NSString *, NSString *> *_manifest;
    NSCache *_cache;
    dispatch_once_t _cacheOnceToken;
}

// NOTE(nikki93): Prevents the module from being auto-initialized and allows us to pass our own `storageDirectory`
+ (NSString *)moduleName { return @"ABI49_0_0RCTAsyncLocalStorage"; }
- (instancetype)initWithStorageDirectory:(NSString *)storageDirectory
{
  if ((self = [super init])) {
    _storageDirectory = storageDirectory;
    _manifestFilePath = [ABI49_0_0RCTGetStorageDirectory() stringByAppendingPathComponent:ABI49_0_0RCTManifestFileName];
  }
  return self;
}

// NOTE(nikki93): Use the default `methodQueue` since instances have different storage directories
@synthesize methodQueue = _methodQueue;

- (NSCache *)cache
{
  dispatch_once(&_cacheOnceToken, ^{
    _cache = [NSCache new];
    _cache.totalCostLimit = 2 * 1024 * 1024; // 2MB

    // Clear cache in the event of a memory warning
    [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationDidReceiveMemoryWarningNotification object:nil queue:nil usingBlock:^(__unused NSNotification *note) {
      [_cache removeAllObjects];
    }];
  });
  return _cache;
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

- (instancetype)init
{
  assert(false);
    if (!(self = [super init])) {
        return nil;
    }

    // Get the path to any old storage directory that needs to be migrated. If multiple exist,
    // the oldest are removed and the most recently modified is returned.
    NSString *oldStoragePath = ABI49_0_0RCTGetStoragePathForMigration();
    if (oldStoragePath != nil) {
        // Migrate our deprecated path "Documents/.../ABI49_0_0RNCAsyncLocalStorage_V1" or
        // "Documents/.../ABI49_0_0RCTAsyncLocalStorage" to "Documents/.../ABI49_0_0RCTAsyncLocalStorage_V1"
        ABI49_0_0RCTStorageDirectoryMigrationCheck(
            oldStoragePath, ABI49_0_0RCTCreateStorageDirectoryPath_deprecated(ABI49_0_0RCTStorageDirectory), YES);
    }

    // Migrate what's in "Documents/.../ABI49_0_0RCTAsyncLocalStorage_V1" to
    // "Application Support/[bundleID]/ABI49_0_0RCTAsyncLocalStorage_V1"
    ABI49_0_0RCTStorageDirectoryMigrationCheck(ABI49_0_0RCTCreateStorageDirectoryPath_deprecated(ABI49_0_0RCTStorageDirectory),
                                      ABI49_0_0RCTCreateStorageDirectoryPath(ABI49_0_0RCTStorageDirectory),
                                      NO);

    return self;
}

- (void)clearAllData
{
    dispatch_async(ABI49_0_0RCTGetMethodQueue(), ^{
      [self->_manifest removeAllObjects];
      [ABI49_0_0RCTGetCache() removeAllObjects];
      ABI49_0_0RCTDeleteStorageDirectory();
    });
}

- (void)invalidate
{
    if (_clearOnInvalidate) {
        [ABI49_0_0RCTGetCache() removeAllObjects];
        ABI49_0_0RCTDeleteStorageDirectory();
    }
    _clearOnInvalidate = NO;
    [_manifest removeAllObjects];
    _haveSetup = NO;
}

- (BOOL)isValid
{
    return _haveSetup;
}

- (void)dealloc
{
    [self invalidate];
}

- (NSString *)_filePathForKey:(NSString *)key
{
    NSString *safeFileName = ABI49_0_0RCTMD5Hash(key);
    return [ABI49_0_0RCTGetStorageDirectory() stringByAppendingPathComponent:safeFileName];
}

- (NSDictionary *)_ensureSetup
{
    ABI49_0_0RCTAssertThread(ABI49_0_0RCTGetMethodQueue(), @"Must be executed on storage thread");

#if TARGET_OS_TV
    ABI49_0_0RCTLogWarn(
        @"Persistent storage is not supported on tvOS, your data may be removed at any point.");
#endif

    NSError *error = nil;
    // NOTE(nikki93): `withIntermediateDirectories:YES` makes this idempotent
    [[NSFileManager defaultManager] createDirectoryAtPath:ABI49_0_0RCTGetStorageDirectory()
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:&error];
    if (error) {
      return ABI49_0_0RCTMakeError(@"Failed to create storage directory.", error, nil);
    }

    if (!_haveSetup) {
        // iCloud backup exclusion
        NSNumber *isExcludedFromBackup =
            [[NSBundle mainBundle] objectForInfoDictionaryKey:@"ABI49_0_0RCTAsyncStorageExcludeFromBackup"];
        if (isExcludedFromBackup == nil) {
            // by default, we want to exclude AsyncStorage data from backup
            isExcludedFromBackup = @YES;
        }
        // NOTE(kudo): We don't enable iCloud backup for Expo Go
        // ABI49_0_0RCTAsyncStorageSetExcludedFromBackup(ABI49_0_0RCTCreateStorageDirectoryPath(ABI49_0_0RCTStorageDirectory),
        //                                      isExcludedFromBackup);

        NSDictionary *errorOut = nil;
        // NOTE(kudo): Keep data in Documents rather than Application Support for backward compatibility
        // NSString *serialized = ABI49_0_0RCTReadFile(ABI49_0_0RCTCreateStorageDirectoryPath(ABI49_0_0RCTGetManifestFilePath())
        NSString *serialized = ABI49_0_0RCTReadFile(ABI49_0_0RCTGetManifestFilePath(),
                                           ABI49_0_0RCTManifestFileName,
                                           &errorOut);
        if (!serialized) {
            if (errorOut) {
                // We cannot simply create a new manifest in case the file does exist but we have no
                // access to it. This can happen when data protection is enabled for the app and we
                // are trying to read the manifest while the device is locked. (The app can be
                // started by the system even if the device is locked due to e.g. a geofence event.)
                ABI49_0_0RCTLogError(
                    @"Could not open the existing manifest, perhaps data protection is "
                    @"enabled?\n\n%@",
                    errorOut);
                return errorOut;
            } else {
                // We can get nil without errors only when the file does not exist.
                ABI49_0_0RCTLogTrace(@"Manifest does not exist - creating a new one.\n\n%@", errorOut);
                _manifest = [NSMutableDictionary new];
            }
        } else {
            _manifest = ABI49_0_0RCTJSONParseMutable(serialized, &error);
            if (!_manifest) {
                ABI49_0_0RCTLogError(@"Failed to parse manifest - creating a new one.\n\n%@", error);
                _manifest = [NSMutableDictionary new];
            }
        }
        _haveSetup = YES;
    }

    return nil;
}

- (NSDictionary *)_writeManifest:(NSMutableArray<NSDictionary *> **)errors
{
    NSError *error;
    NSString *serialized = ABI49_0_0RCTJSONStringify(_manifest, &error);
    // NOTE(kudo): Keep data in Documents rather than Application Support for backward compatibility
    // [serialized writeToFile:ABI49_0_0RCTCreateStorageDirectoryPath(ABI49_0_0RCTGetManifestFilePath())
    [serialized writeToFile:ABI49_0_0RCTGetManifestFilePath()
                 atomically:YES
                   encoding:NSUTF8StringEncoding
                      error:&error];
    NSDictionary *errorOut;
    if (error) {
        errorOut = ABI49_0_0RCTMakeError(@"Failed to write manifest file.", error, nil);
        ABI49_0_0RCTAppendError(errorOut, errors);
    }
    return errorOut;
}

- (NSDictionary *)_appendItemForKey:(NSString *)key
                            toArray:(NSMutableArray<NSArray<NSString *> *> *)result
{
    NSDictionary *errorOut = ABI49_0_0RCTErrorForKey(key);
    if (errorOut) {
        return errorOut;
    }
    NSString *value = [self _getValueForKey:key errorOut:&errorOut];
    [result addObject:@[key, ABI49_0_0RCTNullIfNil(value)]];  // Insert null if missing or failure.
    return errorOut;
}

- (NSString *)_getValueForKey:(NSString *)key errorOut:(NSDictionary **)errorOut
{
    NSString *value =
        _manifest[key];  // nil means missing, null means there may be a data file, else: NSString
    if (value == (id)kCFNull) {
        value = [ABI49_0_0RCTGetCache() objectForKey:key];
        if (!value) {
            NSString *filePath = [self _filePathForKey:key];
            value = ABI49_0_0RCTReadFile(filePath, key, errorOut);
            if (value) {
                [ABI49_0_0RCTGetCache() setObject:value forKey:key cost:value.length];
            } else {
                // file does not exist after all, so remove from manifest (no need to save
                // manifest immediately though, as cost of checking again next time is negligible)
                [_manifest removeObjectForKey:key];
            }
        }
    }
    return value;
}

- (NSDictionary *)_writeEntry:(NSArray<NSString *> *)entry changedManifest:(BOOL *)changedManifest
{
    if (entry.count != 2) {
        return ABI49_0_0RCTMakeAndLogError(
            @"Entries must be arrays of the form [key: string, value: string], got: ", entry, nil);
    }
    NSString *key = entry[0];
    NSDictionary *errorOut = ABI49_0_0RCTErrorForKey(key);
    if (errorOut) {
        return errorOut;
    }
    NSString *value = entry[1];
    NSString *filePath = [self _filePathForKey:key];
    NSError *error;
    if (value.length <= ABI49_0_0RCTInlineValueThreshold) {
        if (_manifest[key] == (id)kCFNull) {
            // If the value already existed but wasn't inlined, remove the old file.
            [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
            [ABI49_0_0RCTGetCache() removeObjectForKey:key];
        }
        *changedManifest = YES;
        _manifest[key] = value;
        return nil;
    }
    [value writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];
    [ABI49_0_0RCTGetCache() setObject:value forKey:key cost:value.length];
    if (error) {
        errorOut = ABI49_0_0RCTMakeError(@"Failed to write value.", error, @{@"key": key});
    } else if (_manifest[key] != (id)kCFNull) {
        *changedManifest = YES;
        _manifest[key] = (id)kCFNull;
    }
    return errorOut;
}

- (void)_multiGet:(NSArray<NSString *> *)keys
         callback:(ABI49_0_0RCTResponseSenderBlock)callback
           getter:(NSString * (^)(NSUInteger i, NSString *key, NSDictionary **errorOut))getValue
{
    NSMutableArray<NSDictionary *> *errors;
    NSMutableArray<NSArray<NSString *> *> *result = [NSMutableArray arrayWithCapacity:keys.count];
    for (NSUInteger i = 0; i < keys.count; ++i) {
        NSString *key = keys[i];
        id keyError;
        id value = getValue(i, key, &keyError);
        [result addObject:@[key, ABI49_0_0RCTNullIfNil(value)]];
        ABI49_0_0RCTAppendError(keyError, &errors);
    }
    callback(@[ABI49_0_0RCTNullIfNil(errors), result]);
}

- (BOOL)_passthroughDelegate
{
    return
        [self.delegate respondsToSelector:@selector(isPassthrough)] && self.delegate.isPassthrough;
}

#pragma mark - Exported JS Functions

// clang-format off
ABI49_0_0RCT_EXPORT_METHOD(multiGet:(NSArray<NSString *> *)keys
                  callback:(ABI49_0_0RCTResponseSenderBlock)callback)
// clang-format on
{
    if (self.delegate != nil) {
        [self.delegate
            valuesForKeys:keys
               completion:^(NSArray<id<NSObject>> *valuesOrErrors) {
                 [self _multiGet:keys
                        callback:callback
                          getter:^NSString *(NSUInteger i, NSString *key, NSDictionary **errorOut) {
                            id valueOrError = valuesOrErrors[i];
                            if ([valueOrError isKindOfClass:[NSError class]]) {
                                NSError *error = (NSError *)valueOrError;
                                NSDictionary *extraData = @{@"key": ABI49_0_0RCTNullIfNil(key)};
                                *errorOut =
                                    ABI49_0_0RCTMakeError(error.localizedDescription, error, extraData);
                                return nil;
                            } else {
                                return [valueOrError isKindOfClass:[NSString class]]
                                           ? (NSString *)valueOrError
                                           : nil;
                            }
                          }];
               }];

        if (![self _passthroughDelegate]) {
            return;
        }
    }

    NSDictionary *errorOut = [self _ensureSetup];
    if (errorOut) {
        callback(@[@[errorOut], (id)kCFNull]);
        return;
    }
    [self _multiGet:keys
           callback:callback
             getter:^(NSUInteger i, NSString *key, NSDictionary **errorOut) {
               return [self _getValueForKey:key errorOut:errorOut];
             }];
}

// clang-format off
ABI49_0_0RCT_EXPORT_METHOD(multiSet:(NSArray<NSArray<NSString *> *> *)kvPairs
                  callback:(ABI49_0_0RCTResponseSenderBlock)callback)
// clang-format on
{
    if (self.delegate != nil) {
        NSMutableArray<NSString *> *keys = [NSMutableArray arrayWithCapacity:kvPairs.count];
        NSMutableArray<NSString *> *values = [NSMutableArray arrayWithCapacity:kvPairs.count];
        for (NSArray<NSString *> *entry in kvPairs) {
            [keys addObject:entry[0]];
            [values addObject:entry[1]];
        }
        [self.delegate setValues:values
                         forKeys:keys
                      completion:^(NSArray<id<NSObject>> *results) {
                        NSArray<NSDictionary *> *errors = ABI49_0_0RCTMakeErrors(results);
                        callback(@[ABI49_0_0RCTNullIfNil(errors)]);
                      }];

        if (![self _passthroughDelegate]) {
            return;
        }
    }

    NSDictionary *errorOut = [self _ensureSetup];
    if (errorOut) {
        callback(@[@[errorOut]]);
        return;
    }
    BOOL changedManifest = NO;
    NSMutableArray<NSDictionary *> *errors;
    for (NSArray<NSString *> *entry in kvPairs) {
        NSDictionary *keyError = [self _writeEntry:entry changedManifest:&changedManifest];
        ABI49_0_0RCTAppendError(keyError, &errors);
    }
    if (changedManifest) {
        [self _writeManifest:&errors];
    }
    callback(@[ABI49_0_0RCTNullIfNil(errors)]);
}

// clang-format off
ABI49_0_0RCT_EXPORT_METHOD(multiMerge:(NSArray<NSArray<NSString *> *> *)kvPairs
                    callback:(ABI49_0_0RCTResponseSenderBlock)callback)
// clang-format on
{
    if (self.delegate != nil) {
        NSMutableArray<NSString *> *keys = [NSMutableArray arrayWithCapacity:kvPairs.count];
        NSMutableArray<NSString *> *values = [NSMutableArray arrayWithCapacity:kvPairs.count];
        for (NSArray<NSString *> *entry in kvPairs) {
            [keys addObject:entry[0]];
            [values addObject:entry[1]];
        }
        [self.delegate mergeValues:values
                           forKeys:keys
                        completion:^(NSArray<id<NSObject>> *results) {
                          NSArray<NSDictionary *> *errors = ABI49_0_0RCTMakeErrors(results);
                          callback(@[ABI49_0_0RCTNullIfNil(errors)]);
                        }];

        if (![self _passthroughDelegate]) {
            return;
        }
    }

    NSDictionary *errorOut = [self _ensureSetup];
    if (errorOut) {
        callback(@[@[errorOut]]);
        return;
    }
    BOOL changedManifest = NO;
    NSMutableArray<NSDictionary *> *errors;
    for (__strong NSArray<NSString *> *entry in kvPairs) {
        NSDictionary *keyError;
        NSString *value = [self _getValueForKey:entry[0] errorOut:&keyError];
        if (!keyError) {
            if (value) {
                NSError *jsonError;
                NSMutableDictionary *mergedVal = ABI49_0_0RCTJSONParseMutable(value, &jsonError);
                if (ABI49_0_0RCTMergeRecursive(mergedVal, ABI49_0_0RCTJSONParse(entry[1], &jsonError))) {
                    entry = @[entry[0], ABI49_0_0RCTNullIfNil(ABI49_0_0RCTJSONStringify(mergedVal, NULL))];
                }
                if (jsonError) {
                    keyError = ABI49_0_0RCTJSErrorFromNSError(jsonError);
                }
            }
            if (!keyError) {
                keyError = [self _writeEntry:entry changedManifest:&changedManifest];
            }
        }
        ABI49_0_0RCTAppendError(keyError, &errors);
    }
    if (changedManifest) {
        [self _writeManifest:&errors];
    }
    callback(@[ABI49_0_0RCTNullIfNil(errors)]);
}

// clang-format off
ABI49_0_0RCT_EXPORT_METHOD(multiRemove:(NSArray<NSString *> *)keys
                     callback:(ABI49_0_0RCTResponseSenderBlock)callback)
// clang-format on
{
    if (self.delegate != nil) {
        [self.delegate removeValuesForKeys:keys
                                completion:^(NSArray<id<NSObject>> *results) {
                                  NSArray<NSDictionary *> *errors = ABI49_0_0RCTMakeErrors(results);
                                  callback(@[ABI49_0_0RCTNullIfNil(errors)]);
                                }];

        if (![self _passthroughDelegate]) {
            return;
        }
    }

    NSDictionary *errorOut = [self _ensureSetup];
    if (errorOut) {
        callback(@[@[errorOut]]);
        return;
    }
    NSMutableArray<NSDictionary *> *errors;
    BOOL changedManifest = NO;
    for (NSString *key in keys) {
        NSDictionary *keyError = ABI49_0_0RCTErrorForKey(key);
        if (!keyError) {
            if (_manifest[key] == (id)kCFNull) {
                NSString *filePath = [self _filePathForKey:key];
                [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
                [ABI49_0_0RCTGetCache() removeObjectForKey:key];
            }
            if (_manifest[key]) {
                changedManifest = YES;
                [_manifest removeObjectForKey:key];
            }
        }
        ABI49_0_0RCTAppendError(keyError, &errors);
    }
    if (changedManifest) {
        [self _writeManifest:&errors];
    }
    callback(@[ABI49_0_0RCTNullIfNil(errors)]);
}

// clang-format off
ABI49_0_0RCT_EXPORT_METHOD(clear:(ABI49_0_0RCTResponseSenderBlock)callback)
// clang-format on
{
    if (self.delegate != nil) {
        [self.delegate removeAllValues:^(NSError *error) {
          NSDictionary *result = nil;
          if (error != nil) {
              result = ABI49_0_0RCTMakeError(error.localizedDescription, error, nil);
          }
          callback(@[ABI49_0_0RCTNullIfNil(result)]);
        }];
        return;
    }

    [_manifest removeAllObjects];
    [ABI49_0_0RCTGetCache() removeAllObjects];
    NSDictionary *error = ABI49_0_0RCTDeleteStorageDirectory();
    callback(@[ABI49_0_0RCTNullIfNil(error)]);
}

// clang-format off
ABI49_0_0RCT_EXPORT_METHOD(getAllKeys:(ABI49_0_0RCTResponseSenderBlock)callback)
// clang-format on
{
    if (self.delegate != nil) {
        [self.delegate allKeys:^(NSArray<id<NSObject>> *keys) {
          callback(@[(id)kCFNull, keys]);
        }];

        if (![self _passthroughDelegate]) {
            return;
        }
    }

    NSDictionary *errorOut = [self _ensureSetup];
    if (errorOut) {
        callback(@[errorOut, (id)kCFNull]);
    } else {
        callback(@[(id)kCFNull, _manifest.allKeys]);
    }
}

@end
