//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate.h>
#import <ABI40_0_0EXManifests/ABI40_0_0EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXUpdatesBareUpdate : NSObject

+ (ABI40_0_0EXUpdatesUpdate *)updateWithBareManifest:(ABI40_0_0EXManifestsBareManifest *)manifest
                                        config:(ABI40_0_0EXUpdatesConfig *)config
                                      database:(ABI40_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
