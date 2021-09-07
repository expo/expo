//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesBareUpdate.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesDatabase.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesLegacyUpdate.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesNewUpdate.h>
#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate+Private.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsBareManifest.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsManifestFactory.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const ABI42_0_0EXUpdatesUpdateErrorDomain = @"ABI42_0_0EXUpdatesUpdate";


@interface ABI42_0_0EXUpdatesUpdate ()

@property (nonatomic, strong, readwrite) ABI42_0_0EXManifestsManifest* manifest;

@end

@implementation ABI42_0_0EXUpdatesUpdate

- (instancetype)initWithManifest:(ABI42_0_0EXManifestsManifest *)manifest
                             config:(ABI42_0_0EXUpdatesConfig *)config
                           database:(nullable ABI42_0_0EXUpdatesDatabase *)database
{
  if (self = [super init]) {
    _manifest = manifest;
    _config = config;
    _database = database;
    _scopeKey = config.scopeKey;
    _status = ABI42_0_0EXUpdatesUpdateStatusPending;
    _lastAccessed = [NSDate date];
    _isDevelopmentMode = NO;
  }
  return self;
}

+ (instancetype)updateWithId:(NSUUID *)updateId
                    scopeKey:(NSString *)scopeKey
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    manifest:(nullable NSDictionary *)manifest
                      status:(ABI42_0_0EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(ABI42_0_0EXUpdatesConfig *)config
                    database:(ABI42_0_0EXUpdatesDatabase *)database
{
  ABI42_0_0EXUpdatesUpdate *update = [[self alloc] initWithManifest:[ABI42_0_0EXManifestsManifestFactory manifestForManifestJSON:(manifest ?: @{})]
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
                          response:(nullable NSURLResponse *)response
                            config:(ABI42_0_0EXUpdatesConfig *)config
                          database:(ABI42_0_0EXUpdatesDatabase *)database
                             error:(NSError ** _Nullable)error
{
  if (![response isKindOfClass:[NSHTTPURLResponse class]]) {
    if(error){
      *error = [NSError errorWithDomain:ABI42_0_0EXUpdatesUpdateErrorDomain
                                   code:1001
                               userInfo:@{NSLocalizedDescriptionKey:@"response must be a NSHTTPURLResponse"}];
    }
    return nil;
  }

  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
  NSDictionary *headerDictionary = [httpResponse allHeaderFields];
  NSString *expoProtocolVersion = headerDictionary[@"expo-protocol-version"];

  if (expoProtocolVersion == nil) {
    return [ABI42_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:[[ABI42_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifest]
                                                    config:config
                                                  database:database];
  } else if (expoProtocolVersion.integerValue == 0) {
    return [ABI42_0_0EXUpdatesNewUpdate updateWithNewManifest:[[ABI42_0_0EXManifestsNewManifest alloc] initWithRawManifestJSON:manifest]
                                            response:response
                                              config:config
                                            database:database];
  } else {
    if(error){
      *error = [NSError errorWithDomain:ABI42_0_0EXUpdatesUpdateErrorDomain
                                   code:1000
                               userInfo:@{NSLocalizedDescriptionKey:[NSString stringWithFormat:@"expo-protocol-version '%@' is invalid", expoProtocolVersion]}];
    }
    return nil;
  }
}

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(ABI42_0_0EXUpdatesConfig *)config
                                  database:(nullable ABI42_0_0EXUpdatesDatabase *)database
{
  if (manifest[@"releaseId"]) {
    return [ABI42_0_0EXUpdatesLegacyUpdate updateWithLegacyManifest:[[ABI42_0_0EXManifestsLegacyManifest alloc] initWithRawManifestJSON:manifest]
                                                    config:config
                                                  database:database];
  } else {
    return [ABI42_0_0EXUpdatesBareUpdate updateWithBareManifest:[[ABI42_0_0EXManifestsBareManifest alloc] initWithRawManifestJSON:manifest]
                                                   config:config
                                                 database:database];
  }
}

- (NSArray<ABI42_0_0EXUpdatesAsset *> *)assets
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
