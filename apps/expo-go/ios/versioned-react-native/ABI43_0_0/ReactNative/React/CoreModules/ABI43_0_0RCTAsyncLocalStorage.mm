/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTAsyncLocalStorage.h"

#import <Foundation/Foundation.h>

#import <CommonCrypto/CommonCryptor.h>
#import <CommonCrypto/CommonDigest.h>
#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>

#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTLog.h>
#import <ABI43_0_0React/ABI43_0_0RCTUtils.h>

#import "ABI43_0_0CoreModulesPlugins.h"

static NSString *const ABI43_0_0RCTStorageDirectory = @"ABI43_0_0RCTAsyncLocalStorage_V1";
static NSString *const ABI43_0_0RCTManifestFileName = @"manifest.json";
static const NSUInteger ABI43_0_0RCTInlineValueThreshold = 1024;

#pragma mark - Static helper functions

static NSDictionary *ABI43_0_0RCTErrorForKey(NSString *key)
{
  if (![key isKindOfClass:[NSString class]]) {
    return ABI43_0_0RCTMakeAndLogError(@"Invalid key - must be a string.  Key: ", key, @{@"key" : key});
  } else if (key.length < 1) {
    return ABI43_0_0RCTMakeAndLogError(@"Invalid key - must be at least one character.  Key: ", key, @{@"key" : key});
  } else {
    return nil;
  }
}

static void ABI43_0_0RCTAppendError(NSDictionary *error, NSMutableArray<NSDictionary *> **errors)
{
  if (error && errors) {
    if (!*errors) {
      *errors = [NSMutableArray new];
    }
    [*errors addObject:error];
  }
}

static NSString *ABI43_0_0RCTReadFile(NSString *filePath, NSString *key, NSDictionary **errorOut)
{
  if ([[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
    NSError *error;
    NSStringEncoding encoding;
    NSString *entryString = [NSString stringWithContentsOfFile:filePath usedEncoding:&encoding error:&error];
    NSDictionary *extraData = @{@"key" : ABI43_0_0RCTNullIfNil(key)};

    if (error) {
      if (errorOut)
        *errorOut = ABI43_0_0RCTMakeError(@"Failed to read storage file.", error, extraData);
      return nil;
    }

    if (encoding != NSUTF8StringEncoding) {
      if (errorOut)
        *errorOut = ABI43_0_0RCTMakeError(@"Incorrect encoding of storage file: ", @(encoding), extraData);
      return nil;
    }
    return entryString;
  }

  return nil;
}

// Only merges objects - all other types are just clobbered (including arrays)
static BOOL ABI43_0_0RCTMergeRecursive(NSMutableDictionary *destination, NSDictionary *source)
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
        if (ABI43_0_0RCTMergeRecursive(destinationValue, sourceValue)) {
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

// NOTE(nikki93): We replace with scoped implementations of:
//   ABI43_0_0RCTGetStorageDirectory()
//   ABI43_0_0RCTGetManifestFilePath()
//   ABI43_0_0RCTGetMethodQueue()
//   ABI43_0_0RCTGetCache()
//   ABI43_0_0RCTDeleteStorageDirectory()

#define ABI43_0_0RCTGetStorageDirectory() _storageDirectory
#define ABI43_0_0RCTGetManifestFilePath() _manifestFilePath
#define ABI43_0_0RCTGetMethodQueue() self.methodQueue
#define ABI43_0_0RCTGetCache() self.cache

static NSDictionary *ABI43_0_0RCTDeleteStorageDirectory(NSString *storageDirectory)
{
  NSError *error;
  [[NSFileManager defaultManager] removeItemAtPath:storageDirectory error:&error];
  return error ? ABI43_0_0RCTMakeError(@"Failed to delete storage directory.", error, nil) : nil;
}
#define ABI43_0_0RCTDeleteStorageDirectory() ABI43_0_0RCTDeleteStorageDirectory(_storageDirectory)

#pragma mark - ABI43_0_0RCTAsyncLocalStorage

@interface ABI43_0_0RCTAsyncLocalStorage () <ABI43_0_0NativeAsyncLocalStorageSpec>

@property (nonatomic, copy) NSString *storageDirectory;
@property (nonatomic, copy) NSString *manifestFilePath;

@end

@implementation ABI43_0_0RCTAsyncLocalStorage {
  BOOL _haveSetup;
  // The manifest is a dictionary of all keys with small values inlined.  Null values indicate values that are stored
  // in separate files (as opposed to nil values which don't exist).  The manifest is read off disk at startup, and
  // written to disk after all mutations.
  NSMutableDictionary<NSString *, NSString *> *_manifest;
  NSCache *_cache;
  dispatch_once_t _cacheOnceToken;
}

// NOTE(nikki93): Prevents the module from being auto-initialized and allows us to pass our own `storageDirectory`
+ (NSString *)moduleName { return @"ABI43_0_0RCTAsyncLocalStorage"; }
- (instancetype)initWithStorageDirectory:(NSString *)storageDirectory
{
  if ((self = [super init])) {
    _storageDirectory = storageDirectory;
    _manifestFilePath = [ABI43_0_0RCTGetStorageDirectory() stringByAppendingPathComponent:ABI43_0_0RCTManifestFileName];
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

- (void)clearAllData
{
  dispatch_async(ABI43_0_0RCTGetMethodQueue(), ^{
    [self->_manifest removeAllObjects];
    [ABI43_0_0RCTGetCache() removeAllObjects];
    ABI43_0_0RCTDeleteStorageDirectory();
  });
}

- (void)invalidate
{
  if (_clearOnInvalidate) {
    [ABI43_0_0RCTGetCache() removeAllObjects];
    ABI43_0_0RCTDeleteStorageDirectory();
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
  NSString *safeFileName = ABI43_0_0RCTMD5Hash(key);
  return [ABI43_0_0RCTGetStorageDirectory() stringByAppendingPathComponent:safeFileName];
}

- (NSDictionary *)_ensureSetup
{
  ABI43_0_0RCTAssertThread(ABI43_0_0RCTGetMethodQueue(), @"Must be executed on storage thread");

  NSError *error = nil;
  // NOTE(nikki93): `withIntermediateDirectories:YES` makes this idempotent
  [[NSFileManager defaultManager] createDirectoryAtPath:ABI43_0_0RCTGetStorageDirectory()
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:&error];
  if (error) {
    return ABI43_0_0RCTMakeError(@"Failed to create storage directory.", error, nil);
  }
  if (!_haveSetup) {
    NSDictionary *errorOut;
    NSString *serialized = ABI43_0_0RCTReadFile(ABI43_0_0RCTGetManifestFilePath(), ABI43_0_0RCTManifestFileName, &errorOut);
    _manifest = serialized ? ABI43_0_0RCTJSONParseMutable(serialized, &error) : [NSMutableDictionary new];
    if (error) {
      ABI43_0_0RCTLogWarn(@"Failed to parse manifest - creating new one.\n\n%@", error);
      _manifest = [NSMutableDictionary new];
    }
    _haveSetup = YES;
  }
  return nil;
}

- (NSDictionary *)_writeManifest:(NSMutableArray<NSDictionary *> **)errors
{
  NSError *error;
  NSString *serialized = ABI43_0_0RCTJSONStringify(_manifest, &error);
  [serialized writeToFile:ABI43_0_0RCTGetManifestFilePath() atomically:YES encoding:NSUTF8StringEncoding error:&error];
  NSDictionary *errorOut;
  if (error) {
    errorOut = ABI43_0_0RCTMakeError(@"Failed to write manifest file.", error, nil);
    ABI43_0_0RCTAppendError(errorOut, errors);
  }
  return errorOut;
}

- (NSDictionary *)_appendItemForKey:(NSString *)key toArray:(NSMutableArray<NSArray<NSString *> *> *)result
{
  NSDictionary *errorOut = ABI43_0_0RCTErrorForKey(key);
  if (errorOut) {
    return errorOut;
  }
  NSString *value = [self _getValueForKey:key errorOut:&errorOut];
  [result addObject:@[ key, ABI43_0_0RCTNullIfNil(value) ]]; // Insert null if missing or failure.
  return errorOut;
}

- (NSString *)_getValueForKey:(NSString *)key errorOut:(NSDictionary **)errorOut
{
  NSString *value = _manifest[key]; // nil means missing, null means there may be a data file, else: NSString
  if (value == (id)kCFNull) {
    value = [ABI43_0_0RCTGetCache() objectForKey:key];
    if (!value) {
      NSString *filePath = [self _filePathForKey:key];
      value = ABI43_0_0RCTReadFile(filePath, key, errorOut);
      if (value) {
        [ABI43_0_0RCTGetCache() setObject:value forKey:key cost:value.length];
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
    return ABI43_0_0RCTMakeAndLogError(@"Entries must be arrays of the form [key: string, value: string], got: ", entry, nil);
  }
  NSString *key = entry[0];
  NSDictionary *errorOut = ABI43_0_0RCTErrorForKey(key);
  if (errorOut) {
    return errorOut;
  }
  NSString *value = entry[1];
  NSString *filePath = [self _filePathForKey:key];
  NSError *error;
  if (value.length <= ABI43_0_0RCTInlineValueThreshold) {
    if (_manifest[key] == (id)kCFNull) {
      // If the value already existed but wasn't inlined, remove the old file.
      [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
      [ABI43_0_0RCTGetCache() removeObjectForKey:key];
    }
    *changedManifest = YES;
    _manifest[key] = value;
    return nil;
  }
  [value writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];
  [ABI43_0_0RCTGetCache() setObject:value forKey:key cost:value.length];
  if (error) {
    errorOut = ABI43_0_0RCTMakeError(@"Failed to write value.", error, @{@"key" : key});
  } else if (_manifest[key] != (id)kCFNull) {
    *changedManifest = YES;
    _manifest[key] = (id)kCFNull;
  }
  return errorOut;
}

#pragma mark - Exported JS Functions

ABI43_0_0RCT_EXPORT_METHOD(multiGet : (NSArray<NSString *> *)keys callback : (ABI43_0_0RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ @[ errorOut ], (id)kCFNull ]);
    return;
  }
  NSMutableArray<NSDictionary *> *errors;
  NSMutableArray<NSArray<NSString *> *> *result = [[NSMutableArray alloc] initWithCapacity:keys.count];
  for (NSString *key in keys) {
    id keyError;
    id value = [self _getValueForKey:key errorOut:&keyError];
    [result addObject:@[ key, ABI43_0_0RCTNullIfNil(value) ]];
    ABI43_0_0RCTAppendError(keyError, &errors);
  }
  callback(@[ ABI43_0_0RCTNullIfNil(errors), result ]);
}

ABI43_0_0RCT_EXPORT_METHOD(multiSet : (NSArray<NSArray<NSString *> *> *)kvPairs callback : (ABI43_0_0RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ @[ errorOut ] ]);
    return;
  }
  BOOL changedManifest = NO;
  NSMutableArray<NSDictionary *> *errors;
  for (NSArray<NSString *> *entry in kvPairs) {
    NSDictionary *keyError = [self _writeEntry:entry changedManifest:&changedManifest];
    ABI43_0_0RCTAppendError(keyError, &errors);
  }
  if (changedManifest) {
    [self _writeManifest:&errors];
  }
  callback(@[ ABI43_0_0RCTNullIfNil(errors) ]);
}

ABI43_0_0RCT_EXPORT_METHOD(multiMerge : (NSArray<NSArray<NSString *> *> *)kvPairs callback : (ABI43_0_0RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ @[ errorOut ] ]);
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
        NSMutableDictionary *mergedVal = ABI43_0_0RCTJSONParseMutable(value, &jsonError);
        if (ABI43_0_0RCTMergeRecursive(mergedVal, ABI43_0_0RCTJSONParse(entry[1], &jsonError))) {
          entry = @[ entry[0], ABI43_0_0RCTNullIfNil(ABI43_0_0RCTJSONStringify(mergedVal, NULL)) ];
        }
        if (jsonError) {
          keyError = ABI43_0_0RCTJSErrorFromNSError(jsonError);
        }
      }
      if (!keyError) {
        keyError = [self _writeEntry:entry changedManifest:&changedManifest];
      }
    }
    ABI43_0_0RCTAppendError(keyError, &errors);
  }
  if (changedManifest) {
    [self _writeManifest:&errors];
  }
  callback(@[ ABI43_0_0RCTNullIfNil(errors) ]);
}

ABI43_0_0RCT_EXPORT_METHOD(multiRemove : (NSArray<NSString *> *)keys callback : (ABI43_0_0RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ @[ errorOut ] ]);
    return;
  }
  NSMutableArray<NSDictionary *> *errors;
  BOOL changedManifest = NO;
  for (NSString *key in keys) {
    NSDictionary *keyError = ABI43_0_0RCTErrorForKey(key);
    if (!keyError) {
      if (_manifest[key] == (id)kCFNull) {
        NSString *filePath = [self _filePathForKey:key];
        [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
        [ABI43_0_0RCTGetCache() removeObjectForKey:key];
      }
      if (_manifest[key]) {
        changedManifest = YES;
        [_manifest removeObjectForKey:key];
      }
    }
    ABI43_0_0RCTAppendError(keyError, &errors);
  }
  if (changedManifest) {
    [self _writeManifest:&errors];
  }
  callback(@[ ABI43_0_0RCTNullIfNil(errors) ]);
}

ABI43_0_0RCT_EXPORT_METHOD(clear : (ABI43_0_0RCTResponseSenderBlock)callback)
{
  [_manifest removeAllObjects];
  [ABI43_0_0RCTGetCache() removeAllObjects];
  NSDictionary *error = ABI43_0_0RCTDeleteStorageDirectory();
  callback(@[ ABI43_0_0RCTNullIfNil(error) ]);
}

ABI43_0_0RCT_EXPORT_METHOD(getAllKeys : (ABI43_0_0RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[ errorOut, (id)kCFNull ]);
  } else {
    callback(@[ (id)kCFNull, _manifest.allKeys ]);
  }
}

- (std::shared_ptr<ABI43_0_0facebook::ABI43_0_0React::TurboModule>)getTurboModule:
    (const ABI43_0_0facebook::ABI43_0_0React::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ABI43_0_0facebook::ABI43_0_0React::NativeAsyncLocalStorageSpecJSI>(params);
}

@end

Class ABI43_0_0RCTAsyncLocalStorageCls(void)
{
  return ABI43_0_0RCTAsyncLocalStorage.class;
}
