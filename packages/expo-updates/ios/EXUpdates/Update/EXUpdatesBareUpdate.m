//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesBareUpdate.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesUpdate+Private.h>
#import <EXUpdates/EXUpdatesUtils.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesBareUpdate

+ (EXUpdatesUpdate *)updateWithBareManifest:(NSDictionary *)manifest
{
  EXUpdatesUpdate *update = [[EXUpdatesUpdate alloc] initWithRawManifest:manifest];

  id updateId = manifest[@"id"];
  id commitTime = manifest[@"commitTime"];
  id metadata = manifest[@"metadata"];
  id assets = manifest[@"assets"];

  NSAssert([updateId isKindOfClass:[NSString class]], @"update ID should be a string");
  NSAssert([commitTime isKindOfClass:[NSNumber class]], @"commitTime should be a number");
  NSAssert(!metadata || [metadata isKindOfClass:[NSDictionary class]], @"metadata should be null or an object");
  NSAssert(assets && [assets isKindOfClass:[NSArray class]], @"assets should be a nonnull array");

  NSUUID *uuid = [[NSUUID alloc] initWithUUIDString:(NSString *)updateId];
  NSAssert(uuid, @"update ID should be a valid UUID");

  update.updateId = uuid;
  update.commitTime = [NSDate dateWithTimeIntervalSince1970:[(NSNumber *)commitTime doubleValue] / 1000];
  update.runtimeVersion = [EXUpdatesUtils getRuntimeVersion];
  if (metadata) {
    update.metadata = (NSDictionary *)metadata;
  }
  update.status = EXUpdatesUpdateStatusEmbedded;
  update.keep = YES;
  update.assets = [NSMutableArray new];

  return update;
}

@end

NS_ASSUME_NONNULL_END

