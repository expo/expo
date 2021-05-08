//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesUpdate.h>
#import <ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesNewRawManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI39_0_0EXUpdatesNewUpdate : NSObject

+ (ABI39_0_0EXUpdatesUpdate *)updateWithNewManifest:(ABI39_0_0EXUpdatesNewRawManifest *)manifest
                                  response:(nullable NSURLResponse *)response
                                    config:(ABI39_0_0EXUpdatesConfig *)config
                                  database:(ABI39_0_0EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
