//  Copyright © 2019 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesSelectionPolicy : NSObject

+ (NSDictionary * _Nullable)runnableUpdateFromUpdates:(NSArray<NSDictionary *>*)updates;

@end

NS_ASSUME_NONNULL_END
