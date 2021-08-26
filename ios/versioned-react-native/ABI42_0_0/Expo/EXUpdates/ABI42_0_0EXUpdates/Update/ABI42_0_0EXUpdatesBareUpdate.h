//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>
#import <ABI42_0_0EXRawManifests/ABI42_0_0EXUpdatesBareRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesBareUpdate : NSObject

+ (ABI42_0_0EXUpdatesUpdate *)updateWithBareRawManifest:(ABI42_0_0EXUpdatesBareRawManifest *)manifest
                                        config:(ABI42_0_0EXUpdatesConfig *)config
                                      database:(ABI42_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
