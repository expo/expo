//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate.h>
#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsBareRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXUpdatesBareUpdate : NSObject

+ (ABI40_0_0EXUpdatesUpdate *)updateWithBareRawManifest:(ABI40_0_0EXRawManifestsBareRawManifest *)manifest
                                        config:(ABI40_0_0EXUpdatesConfig *)config
                                      database:(ABI40_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
