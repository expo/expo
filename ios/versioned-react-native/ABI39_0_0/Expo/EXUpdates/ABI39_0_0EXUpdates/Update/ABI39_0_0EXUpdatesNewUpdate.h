//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXUpdatesNewUpdate : NSObject

+ (ABI39_0_0EXUpdatesUpdate *)updateWithNewManifest:(NSDictionary *)manifest
                                    config:(ABI39_0_0EXUpdatesConfig *)config
                                  database:(ABI39_0_0EXUpdatesDatabase *)database;

@end

NS_ASSUME_NONNULL_END
