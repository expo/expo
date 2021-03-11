//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesBareUpdate.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const EXUpdatesUpdateErrorDomain = @"EXUpdatesUpdate";


@interface EXUpdatesUpdate ()

@property (nonatomic, strong, readwrite) NSDictionary *rawManifest;

@end

@implementation EXUpdatesUpdate

- (instancetype)initWithRawManifest:(NSDictionary *)manifest
                             config:(EXUpdatesConfig *)config
                           database:(nullable EXUpdatesDatabase *)database
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
                      status:(EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
                      config:(EXUpdatesConfig *)config
                    database:(EXUpdatesDatabase *)database
{
  // for now, we store the entire managed manifest in the metadata field
  EXUpdatesUpdate *update = [[self alloc] initWithRawManifest:metadata ?: @{}
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
                            config:(EXUpdatesConfig *)config
                          database:(EXUpdatesDatabase *)database
                             error:(NSError **)error
{
  if (![response isKindOfClass:[NSHTTPURLResponse class]]) {
    *error = [NSError errorWithDomain:EXUpdatesUpdateErrorDomain
                                code:1001
                            userInfo:@{NSLocalizedDescriptionKey:@"response must be a NSHTTPURLResponse"}];
    return nil;
  }
  
  NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
  NSDictionary *headerDictionary = [httpResponse allHeaderFields];
  NSNumber *expoProtocolVersion = headerDictionary[@"expo-protocol-version"];

  if (expoProtocolVersion == nil) {
    return [EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest
                                                    config:config
                                                  database:database];
  } else if (expoProtocolVersion.integerValue == 0) {
    return [EXUpdatesNewUpdate updateWithNewManifest:manifest
                                            response:response
                                              config:config
                                            database:database];
  } else {
    *error = [NSError errorWithDomain:EXUpdatesUpdateErrorDomain
                                code:1000
                            userInfo:@{NSLocalizedDescriptionKey:[NSString stringWithFormat:@"expo-protocol-version '%@' is invalid", expoProtocolVersion]}];
    return nil;
  }
}

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
                                    config:(EXUpdatesConfig *)config
                                  database:(nullable EXUpdatesDatabase *)database
{
  if (manifest[@"releaseId"]) {
    return [EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest
                                                    config:config
                                                  database:database];
  } else {
    return [EXUpdatesBareUpdate updateWithBareManifest:manifest
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

@end

NS_ASSUME_NONNULL_END
