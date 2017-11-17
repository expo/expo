// Copyright 2015-present 650 Industries. All rights reserved.

// This code is basically based on react-native's built-in
// `RCTAsyncLocalStorage.{h,m}` except made to be read-only and with
// naming changes to `EXLegacyAsyncLocalStorage` for the Objective-C class
// and `ExponentLegacyAsyncLocalStorage` for the native module name

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "EXLegacyAsyncLocalStorage.h"
#import "EXConstants.h"
#import "EXUnversioned.h"

#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

static NSString *const RCTManifestFileName = @"manifest.json";

#pragma mark - Static helper functions

static void RCTAppendError(NSDictionary *error, NSMutableArray<NSDictionary *> **errors)
{
  if (error && errors) {
    if (!*errors) {
      *errors = [NSMutableArray new];
    }
    [*errors addObject:error];
  }
}

static NSString *RCTReadFile(NSString *filePath, NSString *key, NSDictionary **errorOut)
{
  if ([[NSFileManager defaultManager] fileExistsAtPath:filePath]) {
    NSError *error;
    NSStringEncoding encoding;
    NSString *entryString = [NSString stringWithContentsOfFile:filePath usedEncoding:&encoding error:&error];
    if (error) {
      *errorOut = RCTMakeError(@"Failed to read storage file.", error, @{@"key": key});
    } else if (encoding != NSUTF8StringEncoding) {
      *errorOut = RCTMakeError(@"Incorrect encoding of storage file: ", @(encoding), @{@"key": key});
    } else {
      return entryString;
    }
  }
  return nil;
}

static NSString *RCTGetStorageDirectory()
{
  static NSString *storageDirectory = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
#if TARGET_OS_TV
    storageDirectory = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
#else
    storageDirectory = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
#endif
    // Check if we are in UNVERSIONED code since the UNVERSIONED legacy `AsyncStorage` location and the versioned
    // one are different (even though it's the same one for all versioned ones)
    if ([EX_UNVERSIONED(@"EXBlah")
         isEqualToString:@"EXBlah"]) {
      storageDirectory = [storageDirectory stringByAppendingPathComponent:EX_UNVERSIONED(@"RCTAsyncLocalStorage_V1")];
    } else {
      storageDirectory = [storageDirectory stringByAppendingPathComponent:EX_UNVERSIONED(@"ABI15_0_0RCTAsyncLocalStorage_V1")];
    }
  });
  return storageDirectory;
}

static NSString *RCTGetManifestFilePath()
{
  static NSString *manifestFilePath = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    manifestFilePath = [RCTGetStorageDirectory() stringByAppendingPathComponent:RCTManifestFileName];
  });
  return manifestFilePath;
}

static dispatch_queue_t RCTGetMethodQueue()
{
  // We want all instances to share the same queue since they will be reading/writing the same files.
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.react.AsyncLocalStorageQueue", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

static NSCache *RCTGetCache()
{
  // We want all instances to share the same cache since they will be reading/writing the same files.
  static NSCache *cache;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    cache = [NSCache new];
    cache.totalCostLimit = 2 * 1024 * 1024; // 2MB

    // Clear cache in the event of a memory warning
    [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationDidReceiveMemoryWarningNotification object:nil queue:nil usingBlock:^(__unused NSNotification *note) {
      [cache removeAllObjects];
    }];
  });
  return cache;
}

static BOOL RCTHasCreatedStorageDirectory = NO;

#pragma mark - EXLegacyAsyncLocalStorage

@implementation EXLegacyAsyncLocalStorage
{
  BOOL _haveSetup;
  // The manifest is a dictionary of all keys with small values inlined.  Null values indicate values that are stored
  // in separate files (as opposed to nil values which don't exist).  The manifest is read off disk at startup, and
  // written to disk after all mutations.
  NSMutableDictionary<NSString *, NSString *> *_manifest;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExponentLegacyAsyncLocalStorage)

- (dispatch_queue_t)methodQueue
{
  return RCTGetMethodQueue();
}

- (void)invalidate
{
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
  NSString *safeFileName = RCTMD5Hash(key);
  return [RCTGetStorageDirectory() stringByAppendingPathComponent:safeFileName];
}

- (NSDictionary *)_ensureSetup
{
  RCTAssertThread(RCTGetMethodQueue(), @"Must be executed on storage thread");

#if TARGET_OS_TV
  RCTLogWarn(@"Persistent storage is not supported on tvOS, your data may be removed at any point.");
#endif

  NSError *error = nil;
  if (!RCTHasCreatedStorageDirectory) {
    [[NSFileManager defaultManager] createDirectoryAtPath:RCTGetStorageDirectory()
                              withIntermediateDirectories:YES
                                               attributes:nil
                                                    error:&error];
    if (error) {
      return RCTMakeError(@"Failed to create storage directory.", error, nil);
    }
    RCTHasCreatedStorageDirectory = YES;
  }
  if (!_haveSetup) {
    NSDictionary *errorOut;
    NSString *serialized = RCTReadFile(RCTGetManifestFilePath(), nil, &errorOut);
    _manifest = serialized ? RCTJSONParseMutable(serialized, &error) : [NSMutableDictionary new];
    if (error) {
      RCTLogWarn(@"Failed to parse manifest - creating new one.\n\n%@", error);
      _manifest = [NSMutableDictionary new];
    }
    _haveSetup = YES;
  }
  return nil;
}

- (NSString *)_getValueForKey:(NSString *)key errorOut:(NSDictionary **)errorOut
{
  NSString *value = _manifest[key]; // nil means missing, null means there may be a data file, else: NSString
  if (value == (id)kCFNull) {
    value = [RCTGetCache() objectForKey:key];
    if (!value) {
      NSString *filePath = [self _filePathForKey:key];
      value = RCTReadFile(filePath, key, errorOut);
      if (value) {
        [RCTGetCache() setObject:value forKey:key cost:value.length];
      } else {
        // file does not exist after all, so remove from manifest (no need to save
        // manifest immediately though, as cost of checking again next time is negligible)
        [_manifest removeObjectForKey:key];
      }
    }
  }
  return value;
}

#pragma mark - Exported JS Functions

RCT_EXPORT_METHOD(multiGet:(NSArray<NSString *> *)keys
                  callback:(RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[@[errorOut], (id)kCFNull]);
    return;
  }
  NSMutableArray<NSDictionary *> *errors;
  NSMutableArray<NSArray<NSString *> *> *result = [[NSMutableArray alloc] initWithCapacity:keys.count];
  for (NSString *key in keys) {
    id keyError;
    id value = [self _getValueForKey:key errorOut:&keyError];
    [result addObject:@[key, RCTNullIfNil(value)]];
    RCTAppendError(keyError, &errors);
  }
  callback(@[RCTNullIfNil(errors), result]);
}

RCT_EXPORT_METHOD(getAllKeys:(RCTResponseSenderBlock)callback)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    callback(@[errorOut, (id)kCFNull]);
  } else {
    callback(@[(id)kCFNull, _manifest.allKeys]);
  }
}

- (NSString *)migrationDoneKey
{
  return [_bridge.scopedModules.constants.experienceId stringByAppendingString:@".migrationDone"];
}

RCT_REMAP_METHOD(isMigrationDone,
                 isMigrationDoneWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    reject(@"E_LEGACY_ASYNCSTORAGE", @"Error setting up LegacyAsyncStorage", nil);
  } else {
    NSString *key = [self migrationDoneKey];
    BOOL done = _manifest[key] && [_manifest[key] isEqualToString:@"YES"];
    resolve(@(done));
  }
}

RCT_REMAP_METHOD(setMigrationDone,
                 setMigrationDoneWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSDictionary *errorOut = [self _ensureSetup];
  if (errorOut) {
    reject(@"E_LEGACY_ASYNCSTORAGE", @"Error setting up LegacyAsyncStorage", nil);
  } else {
    _manifest[[self migrationDoneKey]] = @"YES";

    NSError *error = nil;
    NSString *manifestStr = RCTJSONStringify(_manifest, &error);
    if (error) {
      reject(@"E_LEGACY_ASYNCSTORAGE", @"Error writing LegacyAsyncStorage manifest", error);
    }

    [manifestStr writeToFile:RCTGetManifestFilePath() atomically:YES encoding:NSUTF8StringEncoding error:&error];
    if (error) {
      reject(@"E_LEGACY_ASYNCSTORAGE", @"Error writing LegacyAsyncStorage manifest", error);
    }

    resolve(nil);
  }
}

@end
