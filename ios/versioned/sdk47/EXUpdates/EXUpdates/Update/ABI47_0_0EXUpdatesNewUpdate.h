//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesUpdate.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesManifestHeaders.h>
#import <ABI47_0_0EXManifests/ABI47_0_0EXManifestsNewManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesNewUpdate : NSObject

+ (ABI47_0_0EXUpdatesUpdate *)updateWithNewManifest:(ABI47_0_0EXManifestsNewManifest *)manifest
                           manifestHeaders:(ABI47_0_0EXUpdatesManifestHeaders *)manifestHeaders
                                extensions:(NSDictionary *)extensions
                                    config:(ABI47_0_0EXUpdatesConfig *)config
                                  database:(ABI47_0_0EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
