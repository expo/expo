//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesUpdate.h>
#import <ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesManifestHeaders.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsNewManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXUpdatesNewUpdate : NSObject

+ (ABI45_0_0EXUpdatesUpdate *)updateWithNewManifest:(ABI45_0_0EXManifestsNewManifest *)manifest
                           manifestHeaders:(ABI45_0_0EXUpdatesManifestHeaders *)manifestHeaders
                                extensions:(NSDictionary *)extensions
                                    config:(ABI45_0_0EXUpdatesConfig *)config
                                  database:(ABI45_0_0EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
