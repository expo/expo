//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesBareUpdate : NSObject

+ (ABI44_0_0EXUpdatesUpdate *)updateWithBareManifest:(ABI44_0_0EXManifestsBareManifest *)manifest
                                        config:(ABI44_0_0EXUpdatesConfig *)config
                                      database:(ABI44_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
