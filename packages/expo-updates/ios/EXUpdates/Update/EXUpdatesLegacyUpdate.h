//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesUpdate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesLegacyUpdate : NSObject

+ (EXUpdatesUpdate *)updateWithLegacyManifest:(NSDictionary *)manifest;

@end

NS_ASSUME_NONNULL_END
