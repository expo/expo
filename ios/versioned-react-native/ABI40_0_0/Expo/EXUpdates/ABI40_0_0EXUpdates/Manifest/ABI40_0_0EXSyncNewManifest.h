//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXSyncNewManifest : NSObject

+ (ABI40_0_0EXSyncManifest *)updateWithNewManifest:(NSDictionary *)manifest
                                    config:(ABI40_0_0EXSyncConfig *)config
                                  database:(ABI40_0_0EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
