//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUpdate.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsNewManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesNewUpdate : NSObject

+ (ABI42_0_0EXUpdatesUpdate *)updateWithNewManifest:(ABI42_0_0EXManifestsNewManifest *)manifest
                                  response:(nullable NSURLResponse *)response
                                    config:(ABI42_0_0EXUpdatesConfig *)config
                                  database:(ABI42_0_0EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
