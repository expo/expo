//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>
#import <EXUpdates/EXUpdatesBareRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesBareUpdate : NSObject

+ (EXUpdatesUpdate *)updateWithBareRawManifest:(EXUpdatesBareRawManifest *)manifest
                                        config:(EXUpdatesConfig *)config
                                      database:(EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
