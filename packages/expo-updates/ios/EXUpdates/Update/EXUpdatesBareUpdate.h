//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>
#import <EXManifests/EXManifestsBareManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBareUpdate : NSObject

+ (EXUpdatesUpdate *)updateWithBareManifest:(EXManifestsBareManifest *)manifest
                                        config:(EXUpdatesConfig *)config
                                      database:(EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
