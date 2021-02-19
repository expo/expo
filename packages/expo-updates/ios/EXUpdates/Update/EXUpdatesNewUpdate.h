//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesNewUpdate : NSObject

+ (EXUpdatesUpdate *)updateWithNewManifest:(NSDictionary *)rootManifest
                                  response:(nullable NSURLResponse *)response
                                    config:(EXUpdatesConfig *)config
                                  database:(EXUpdatesDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
