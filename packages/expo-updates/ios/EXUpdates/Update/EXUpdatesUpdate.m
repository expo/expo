//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBareUpdate.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXManifests/EXManifestsBareManifest.h>
#import <EXManifests/EXManifestsManifestFactory.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const EXUpdatesUpdateErrorDomain = @"EXUpdatesUpdate";


@interface EXUpdatesUpdate ()

@property (nonatomic, strong, readwrite) EXManifestsManifest* manifest;

@end

@implementation EXUpdatesUpdate

- (instancetype)initWithManifest:(EXManifestsManifest *)manifest
                             config:(EXUpdatesConfig *)config
                           database:(nullable EXUpdatesDatabase *)database
{
  if (self = [super init]) {
    _manifest = manifest;
    _config = config;
    _database = database;
    _scopeKey = config.scopeKey;
    _status = EXUpdatesUpdateStatusPending;
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
                      status:(EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(EXUpdatesConfig *)config
                    database:(EXUpdatesDatabase *)database
{
  EXUpdatesUpdate *update = [[self alloc] initWithManifest:[EXManifestsManifestFactory manifestForManifestJSON:(manifest ?: @{})]
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
                   manifestHeaders:(EXUpdatesManifestHeaders *)manifestHeaders
                        extensions:(NSDictionary *)extensions
                            config:(EXUpdatesConfig *)config
                          database:(EXUpdatesDatabase *)database
                             error:(NSError ** _Nullable)error
{
  NSString *expoProtocolVersion = manifestHeaders.protocolVersion;

  if (expoProtocolVersion == nil) {
    return [EXUpdatesLegacyUpdate updateWithLegacyManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifest]
                                                    config:config
                                                  database:database];
  } else if (expoProtocolVersion.integerValue == 0) {
    return [EXUpdatesNewUpdate updateWithNewManifest:[[EXManifestsNewManifest alloc] initWithRawManifestJSON:manifest]
                                     manifestHeaders:manifestHeaders
                                          extensions:extensions
                                              config:config
                                            database:database];
  } else {
    if(error){
      *error = [NSError errorWithDomain:EXUpdatesUpdateErrorDomain
                                   code:1000
                               userInfo:@{NSLocalizedDescriptionKey:[NSString stringWithFormat:@"expo-protocol-version '%@' is invalid", expoProtocolVersion]}];
    }
    return nil;
  }
}

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(EXUpdatesConfig *)config
                                  database:(nullable EXUpdatesDatabase *)database
{
  if (manifest[@"releaseId"]) {
    return [EXUpdatesLegacyUpdate updateWithLegacyManifest:[[EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifest]
                                                    config:config
                                                  database:database];
  } else {
    return [EXUpdatesBareUpdate updateWithBareManifest:[[EXManifestsBareManifest alloc] initWithRawManifestJSON:manifest]
                                                   config:config
                                                 database:database];
  }
}

- (NSArray<EXUpdatesAsset *> *)assets
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

- (NSString * _Nullable)loggingId
{
  return [[[self updateId] UUIDString] lowercaseString];
}

@end

NS_ASSUME_NONNULL_END
