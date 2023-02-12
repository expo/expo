//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUpdate.h>
#import <ABI47_0_0EXManifests/ABI47_0_0EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesBareUpdate : NSObject

+ (ABI47_0_0EXUpdatesUpdate *)updateWithBareManifest:(ABI47_0_0EXManifestsBareManifest *)manifest
                                        config:(ABI47_0_0EXUpdatesConfig *)config
                                      database:(ABI47_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
