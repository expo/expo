//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesBareUpdate.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesDatabase.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesLegacyUpdate.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesNewUpdate.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate+Private.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsBareManifest.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsManifestFactory.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI44_0_0EXUpdatesUpdateErrorDomain = @"ABI44_0_0EXUpdatesUpdate";


@interface ABI44_0_0EXUpdatesUpdate ()

@property (nonatomic, strong, readwrite) ABI44_0_0EXManifestsManifest* manifest;

@end

@implementation ABI44_0_0EXUpdatesUpdate

- (instancetype)initWithManifest:(ABI44_0_0EXManifestsManifest *)manifest
                             config:(ABI44_0_0EXUpdatesConfig *)config
                           database:(nullable ABI44_0_0EXUpdatesDatabase *)database
{
  if (self = [super init]) {
    _manifest = manifest;
    _config = config;
    _database = database;
    _scopeKey = config.scopeKey;
    _status = ABI44_0_0EXUpdatesUpdateStatusPending;
    _lastAccessed = [NSDate date];
    _successfulLaunchCount = 0;
    _failedLaunchCount = 0;
    _isDevelopmentMode = NO;
  }
  return self;
}

+ (instancetype)updateWithId:(NSUUID *)updateId
                    scopeKey:(NSString *)scopeKey
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    manifest:(nullable NSDictionary *)manifest
                      status:(ABI44_0_0EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(ABI44_0_0EXUpdatesConfig *)config
                    database:(ABI44_0_0EXUpdatesDatabase *)database
{
  ABI44_0_0EXUpdatesUpdate *update = [[self alloc] initWithManifest:[ABI44_0_0EXManifestsManifestFactory manifestForManifestJSON:(manifest ?: @{})]
                                                       config:config
                                                     database:database];
  update.updateId = updateId;
  update.scopeKey = scopeKey;
  update.commitTime = commitTime;
  update.runtimeVersion = runtimeVersion;
  update.manifestJSON = manifest;
  update.status = status;
  update.keep = keep;
  return update;
}

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
                   manifestHeaders:(ABI44_0_0EXUpdatesManifestHeaders *)manifestHeaders
                        extensions:(NSDictionary *)extensions
                            config:(ABI44_0_0EXUpdatesConfig *)config
                          database:(ABI44_0_0EXUpdatesDatabase *)database
                             error:(NSError ** _Nullable)error
{
  NSString *expoProtocolVersion = manifestHeaders.protocolVersion;

  if (expoProtocolVersion == nil) {
    return [ABI44_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:[[ABI44_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifest]
                                                    config:config
                                                  database:database];
  } else if (expoProtocolVersion.integerValue == 0) {
    return [ABI44_0_0EXUpdatesNewUpdate updateWithNewManifest:[[ABI44_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:manifest]
                                     manifestHeaders:manifestHeaders
                                          extensions:extensions
                                              config:config
                                            database:database];
  } else {
    if(error){
      *error = [NSError errorWithDomain:ABI44_0_0EXUpdatesUpdateErrorDomain
                                   code:1000
                               userInfo:@{NSLocalizedDescriptionKey:[NSString stringWithFormat:@"expo-protocol-version '%@' is invalid", expoProtocolVersion]}];
    }
    return nil;
  }
}

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI44_0_0EXUpdatesConfig *)config
                                  database:(nullable ABI44_0_0EXUpdatesDatabase *)database
{
  if (manifest[@"releaseId"]) {
    return [ABI44_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:[[ABI44_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifest]
                                                    config:config
                                                  database:database];
  } else {
    return [ABI44_0_0EXUpdatesBareUpdate updateWithBareManifest:[[ABI44_0_0EXManifestsBareManifest alloc] initWithRawManifestJSON:manifest]
                                                   config:config
                                                 database:database];
  }
}

- (NSArray<ABI44_0_0EXUpdatesAsset *> *)assets
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
