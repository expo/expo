//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncBareManifest : NSObject

+ (EXSyncManifest *)updateWithBareManifest:(NSDictionary *)manifest
                                     config:(EXSyncConfig *)config
                                   database:(EXSyncDatabase *)database;

@end

NS_ASSUME_NONNULL_END
