//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXUpdatesUtils : NSObject

+ (void)runBlockOnMainThread:(void (^)(void))block;
+ (NSString *)sha256WithData:(NSData *)data;
+ (nullable NSURL *)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error;
+ (void)sendEventToBridge:(nullable ABI42_0_0RCTBridge *)bridge withType:(NSString *)eventType body:(NSDictionary *)body;
+ (BOOL)shouldCheckForUpdateWithConfig:(ABI42_0_0EXUpdatesConfig *)config;
+ (NSString *)getRuntimeVersionWithConfig:(ABI42_0_0EXUpdatesConfig *)config;

@end

NS_ASSUME_NONNULL_END
