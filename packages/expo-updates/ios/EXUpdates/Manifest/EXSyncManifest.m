//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncBareManifest.h>
#import <EXUpdates/EXSyncDatabase.h>
#import <EXUpdates/EXSyncLegacyManifest.h>
#import <EXUpdates/EXSyncNewManifest.h>
#import <EXUpdates/EXSyncManifest+Private.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncManifest ()

@property (nonatomic, strong, readwrite) NSDictionary *rawManifest;

@end

@implementation EXSyncManifest

- (instancetype)initWithRawManifest:(NSDictionary *)manifest
                             config:(EXSyncConfig *)config
                           database:(nullable EXSyncDatabase *)database
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
                      status:(EXSyncManifestStatus)status
                        keep:(BOOL)keep
                      config:(EXSyncConfig *)config
                    database:(EXSyncDatabase *)database
{
  // for now, we store the entire managed manifest in the metadata field
  EXSyncManifest *update = [[self alloc] initWithRawManifest:metadata ?: @{}
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
                            config:(EXSyncConfig *)config
                          database:(EXSyncDatabase *)database
{
  if (config.usesLegacyManifest) {
    return [EXSyncLegacyManifest updateWithLegacyManifest:manifest
                                                    config:config
                                                  database:database];
  } else {
    return [EXSyncNewManifest updateWithNewManifest:manifest
                                            response:response
                                              config:config
                                            database:database];
  }
}

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(EXSyncConfig *)config
                                  database:(nullable EXSyncDatabase *)database
{
  if (config.usesLegacyManifest) {
    if (manifest[@"releaseId"]) {
      return [EXSyncLegacyManifest updateWithLegacyManifest:manifest
                                                      config:config
                                                    database:database];
    } else {
      return [EXSyncBareManifest updateWithBareManifest:manifest
                                                  config:config
                                                database:database];
    }
  } else {
    // bare (embedded) manifests should never have a runtimeVersion field
    if (manifest[@"manifest"] || manifest[@"runtimeVersion"]) {
      return [EXSyncNewManifest updateWithNewManifest:manifest
                                              response:nil
                                                config:config
                                              database:database];
    } else {
      return [EXSyncBareManifest updateWithBareManifest:manifest
                                                  config:config
                                                database:database];
    }
  }
}

- (NSArray<EXSyncAsset *> *)assets
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
