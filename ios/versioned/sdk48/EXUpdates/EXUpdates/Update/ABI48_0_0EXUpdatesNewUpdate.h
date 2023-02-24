//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUpdate.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesManifestHeaders.h>
#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsNewManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI48_0_0EXUpdatesNewUpdate : NSObject

+ (ABI48_0_0EXUpdatesUpdate *)updateWithNewManifest:(ABI48_0_0EXManifestsNewManifest *)manifest
                           manifestHeaders:(ABI48_0_0EXUpdatesManifestHeaders *)manifestHeaders
                                extensions:(NSDictionary *)extensions
                                    config:(ABI48_0_0EXUpdatesConfig *)config
                                  database:(ABI48_0_0EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
