//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXSyncManifest.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSyncNewManifest : NSObject

+ (EXSyncManifest *)updateWithNewManifest:(NSDictionary *)rootManifest
                                  response:(nullable NSURLResponse *)response
                                    config:(EXSyncConfig *)config
                                  database:(EXSyncDatabase *)database;

+ (nullable NSDictionary *)dictionaryWithStructuredHeader:(NSString *)headerString;

@end

NS_ASSUME_NONNULL_END
