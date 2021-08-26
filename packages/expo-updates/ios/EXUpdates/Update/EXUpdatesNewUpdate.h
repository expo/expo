//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>
#import <EXRawManifests/EXRawManifestsNewRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesNewUpdate : NSObject

+ (EXUpdatesUpdate *)updateWithNewManifest:(EXRawManifestsNewRawManifest *)manifest
                                  response:(nullable NSURLResponse *)response
                                    config:(EXUpdatesConfig *)config
                                  database:(EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
