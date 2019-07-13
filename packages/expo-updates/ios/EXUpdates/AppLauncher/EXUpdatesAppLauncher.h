//  Copyright © 2019 650 Industries. All rights reserved.

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesAppLauncher : NSObject

- (NSDictionary *)launchUpdate;
- (NSUUID * _Nullable)launchedUpdateId;

@end

NS_ASSUME_NONNULL_END
