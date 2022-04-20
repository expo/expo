//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesUpdate.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesManifestHeaders.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsNewManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesNewUpdate : NSObject

+ (ABI44_0_0EXUpdatesUpdate *)updateWithNewManifest:(ABI44_0_0EXManifestsNewManifest *)manifest
                           manifestHeaders:(ABI44_0_0EXUpdatesManifestHeaders *)manifestHeaders
                                extensions:(NSDictionary *)extensions
                                    config:(ABI44_0_0EXUpdatesConfig *)config
                                  database:(ABI44_0_0EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
