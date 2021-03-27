//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXSyncBareManifest : NSObject

+ (ABI41_0_0EXSyncManifest *)updateWithBareManifest:(NSDictionary *)manifest
                                     config:(ABI41_0_0EXSyncConfig *)config
                                   database:(ABI41_0_0EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
