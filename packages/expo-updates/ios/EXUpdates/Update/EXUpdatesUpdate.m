//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesBareUpdate.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXUpdates/EXUpdatesLegacyUpdate.h>
#import <EXUpdates/EXUpdatesNewUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesUpdate ()

@property (nonatomic, strong, readwrite) NSString *projectIdentifier;
@property (nonatomic, strong, readwrite) NSDictionary *rawManifest;

@end

@implementation EXUpdatesUpdate

- (instancetype)initWithRawManifest:(NSDictionary *)manifest
{
  if (self = [super init]) {
    _rawManifest = manifest;
    _projectIdentifier = [EXUpdatesConfig sharedInstance].updateUrl.absoluteString;
  }
  return self;
}

+ (instancetype)updateWithId:(NSUUID *)updateId
                  commitTime:(NSDate *)commitTime
              runtimeVersion:(NSString *)runtimeVersion
                    metadata:(nullable NSDictionary *)metadata
                      status:(EXUpdatesUpdateStatus)status
                        keep:(BOOL)keep
{
  // for now, we store the entire managed manifest in the metadata field
  EXUpdatesUpdate *update = [[self alloc] initWithRawManifest:metadata ?: @{}];
  update.updateId = updateId;
  update.commitTime = commitTime;
  update.runtimeVersion = runtimeVersion;
  update.metadata = metadata;
  update.status = status;
  update.keep = keep;
  return update;
}

+ (instancetype)updateWithManifest:(NSDictionary *)manifest
{
  if ([EXUpdatesConfig sharedInstance].usesLegacyManifest) {
    return [EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest];
  } else {
    return [EXUpdatesNewUpdate updateWithNewManifest:manifest];
  }
}

+ (instancetype)updateWithEmbeddedManifest:(NSDictionary *)manifest
{
  if ([EXUpdatesConfig sharedInstance].usesLegacyManifest) {
    if (manifest[@"releaseId"]) {
      return [EXUpdatesLegacyUpdate updateWithLegacyManifest:manifest];
    } else {
      return [EXUpdatesBareUpdate updateWithBareManifest:manifest];
    }
  } else {
    if (manifest[@"runtimeVersion"]) {
      return [EXUpdatesNewUpdate updateWithNewManifest:manifest];
    } else {
      return [EXUpdatesBareUpdate updateWithBareManifest:manifest];
    }
  }
}

- (NSArray<EXUpdatesAsset *> *)assets
{
  if (!_assets) {
    EXUpdatesDatabase *db = [EXUpdatesAppController sharedInstance].database;
    dispatch_sync(db.databaseQueue, ^{
      NSError *error;
      self->_assets = [db assetsWithUpdateId:self->_updateId error:&error];
      NSAssert(self->_assets, @"Assets should be nonnull when selected from DB: %@", error.localizedDescription);
    });
  }
  return _assets;
}

@end

NS_ASSUME_NONNULL_END
