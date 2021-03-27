//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXSyncBareManifest : NSObject

+ (ABI39_0_0EXSyncManifest *)updateWithBareManifest:(NSDictionary *)manifest
                                     config:(ABI39_0_0EXSyncConfig *)config
                                   database:(ABI39_0_0EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
