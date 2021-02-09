//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesLegacyUpdate : NSObject

+ (EXUpdatesUpdate *)updateWithLegacyManifest:(NSDictionary *)manifest
                                       config:(EXUpdatesConfig *)config
                                     database:(EXUpdatesDatabase *)database;

+ (NSURL *)bundledAssetBaseUrlWithManifest:(NSDictionary *)manifest config:(EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
