//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesBareUpdate.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesLegacyUpdate.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesNewUpdate.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXUpdatesUpdate+Private.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXUpdatesUpdate ()

@property (nonatomic, strong, readwrite) NSDictionary *rawManifest;

@end

@implementation ABI41_0_0EXUpdatesUpdate

- (instancetype)initWithRawManifest:(NSDictionary *)manifest
                             config:(ABI41_0_0EXUpdatesConfig *)config
                           database:(nullable ABI41_0_0EXUpdatesDatabase *)database
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
                      status:(ABI41_0_0EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(ABI41_0_0EXUpdatesConfig *)config
                    database:(ABI41_0_0EXUpdatesDatabase *)database
{
  // for now, we store the entire managed manifest in the metadata field
  ABI41_0_0EXUpdatesUpdate *update = [[self alloc] initWithRawManifest:metadata ?: @{}
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
                          response:(nullable NSURLResponse *)response
                            config:(ABI41_0_0EXUpdatesConfig *)config
                          database:(ABI41_0_0EXUpdatesDatabase *)database
{
  if (config.usesLegacyManifest) {
    return [ABI41_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest
                                                    config:config
                                                  database:database];
  } else {
    return [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest
                                            response:response
                                              config:config
                                            database:database];
  }
}

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI41_0_0EXUpdatesConfig *)config
                                  database:(nullable ABI41_0_0EXUpdatesDatabase *)database
{
  if (config.usesLegacyManifest) {
    if (manifest[@"releaseId"]) {
      return [ABI41_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest
                                                      config:config
                                                    database:database];
    } else {
      return [ABI41_0_0EXUpdatesBareUpdate updateWithBareManifest:manifest
                                                  config:config
                                                database:database];
    }
  } else {
    // bare (embedded) manifests should never have a runtimeVersion field
    if (manifest[@"manifest"] || manifest[@"runtimeVersion"]) {
      return [ABI41_0_0EXUpdatesNewUpdate updateWithNewManifest:manifest
                                              response:nil
                                                config:config
                                              database:database];
    } else {
      return [ABI41_0_0EXUpdatesBareUpdate updateWithBareManifest:manifest
                                                  config:config
                                                database:database];
    }
  }
}

- (NSArray<ABI41_0_0EXUpdatesAsset *> *)assets
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
