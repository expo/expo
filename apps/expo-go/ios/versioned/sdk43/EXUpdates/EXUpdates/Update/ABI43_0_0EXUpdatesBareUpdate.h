//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXUpdatesUpdate.h>
#import <ABI43_0_0EXManifests/ABI43_0_0EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXUpdatesBareUpdate : NSObject

+ (ABI43_0_0EXUpdatesUpdate *)updateWithBareManifest:(ABI43_0_0EXManifestsBareManifest *)manifest
                                        config:(ABI43_0_0EXUpdatesConfig *)config
                                      database:(ABI43_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
