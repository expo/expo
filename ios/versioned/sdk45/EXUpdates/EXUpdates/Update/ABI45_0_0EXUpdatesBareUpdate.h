//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesUpdate.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesBareUpdate : NSObject

+ (ABI45_0_0EXUpdatesUpdate *)updateWithBareManifest:(ABI45_0_0EXManifestsBareManifest *)manifest
                                        config:(ABI45_0_0EXUpdatesConfig *)config
                                      database:(ABI45_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
