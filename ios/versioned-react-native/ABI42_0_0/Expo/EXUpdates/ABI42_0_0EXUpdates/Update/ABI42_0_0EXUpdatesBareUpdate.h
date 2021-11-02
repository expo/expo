//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesBareUpdate : NSObject

+ (ABI42_0_0EXUpdatesUpdate *)updateWithBareManifest:(ABI42_0_0EXManifestsBareManifest *)manifest
                                        config:(ABI42_0_0EXUpdatesConfig *)config
                                      database:(ABI42_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
