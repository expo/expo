//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>
#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesBareUpdate : NSObject

+ (ABI48_0_0EXUpdatesUpdate *)updateWithBareManifest:(ABI48_0_0EXManifestsBareManifest *)manifest
                                        config:(ABI48_0_0EXUpdatesConfig *)config
                                      database:(ABI48_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
