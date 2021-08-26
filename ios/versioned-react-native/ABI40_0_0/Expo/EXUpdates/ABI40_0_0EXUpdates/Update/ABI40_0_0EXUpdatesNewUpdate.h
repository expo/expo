//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesUpdate.h>
#import <ABI40_0_0EXManifests/ABI40_0_0EXManifestsNewRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI40_0_0EXUpdatesNewUpdate : NSObject

+ (ABI40_0_0EXUpdatesUpdate *)updateWithNewManifest:(ABI40_0_0EXManifestsNewRawManifest *)manifest
                                  response:(nullable NSURLResponse *)response
                                    config:(ABI40_0_0EXUpdatesConfig *)config
                                  database:(ABI40_0_0EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
