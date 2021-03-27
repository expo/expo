//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncBareManifest.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncDatabase.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncLegacyManifest.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncNewManifest.h>
#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest+Private.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXSyncManifest ()

@property (nonatomic, strong, readwrite) NSDictionary *rawManifest;

@end

@implementation ABI40_0_0EXSyncManifest

- (instancetype)initWithRawManifest:(NSDictionary *)manifest
                             config:(ABI40_0_0EXSyncConfig *)config
                           database:(nullable ABI40_0_0EXSyncDatabase *)database
{
  if (self = [super init]) {
    _rawManifest = manifest;
    _config = config;
    _database = database;
    _scopeKey = config.scopeKey;
    _isDevelopmentMode = NO;
  }
  return self;
}

+ (instancetype)updateWithId:(NSUUID *)updateId
                    scopeKey:(NSString *)scopeKey
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    metadata:(nullable NSDictionary *)metadata
                      status:(ABI40_0_0EXSyncManifestStatus)status
                        keep:(BOOL)keep
                      config:(ABI40_0_0EXSyncConfig *)config
                    database:(ABI40_0_0EXSyncDatabase *)database
{
  // for now, we store the entire managed manifest in the metadata field
  ABI40_0_0EXSyncManifest *update = [[self alloc] initWithRawManifest:metadata ?: @{}
                                                       config:config
                                                     database:database];
  update.updateId = updateId;
  update.scopeKey = scopeKey;
  update.commitTime = commitTime;
  update.runtimeVersion = runtimeVersion;
  update.metadata = metadata;
  update.status = status;
  update.keep = keep;
  return update;
}

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                            config:(ABI40_0_0EXSyncConfig *)config
                          database:(ABI40_0_0EXSyncDatabase *)database
{
  if (config.usesLegacyManifest) {
    return [ABI40_0_0EXSyncLegacyManifest updateWithLegacyManifest:manifest
                                                    config:config
                                                  database:database];
  } else {
    return [ABI40_0_0EXSyncNewManifest updateWithNewManifest:manifest
                                              config:config
                                            database:database];
  }
}

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI40_0_0EXSyncConfig *)config
                                  database:(nullable ABI40_0_0EXSyncDatabase *)database
{
  if (config.usesLegacyManifest) {
    if (manifest[@"releaseId"]) {
      return [ABI40_0_0EXSyncLegacyManifest updateWithLegacyManifest:manifest
                                                      config:config
                                                    database:database];
    } else {
      return [ABI40_0_0EXSyncBareManifest updateWithBareManifest:manifest
                                                  config:config
                                                database:database];
    }
  } else {
    if (manifest[@"runtimeVersion"]) {
      return [ABI40_0_0EXSyncNewManifest updateWithNewManifest:manifest
                                                config:config
                                              database:database];
    } else {
      return [ABI40_0_0EXSyncBareManifest updateWithBareManifest:manifest
                                                  config:config
                                                database:database];
    }
  }
}

- (NSArray<ABI40_0_0EXSyncAsset *> *)assets
{
  if (!_assets && _database) {
    dispatch_sync(_database.databaseQueue, ^{
      NSError *error;
      self->_assets = [self->_database assetsWithUpdateId:self->_updateId error:&error];
      NSAssert(self->_assets, @"Assets should be nonnull when selected from DB: %@", error.localizedDescription);
    });
  }
  return _assets;
}

@end

NS_ASSUME_NONNULL_END
