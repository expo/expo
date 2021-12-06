//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>

#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesAsset.h>
#import <ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXUpdatesUtils : NSObject

+ (void)runBlockOnMainThread:(void (^)(void))block;
+ (NSString *)sha256WithData:(NSData *)data;
+ (nullable NSURL *)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error;
+ (void)sendEventToBridge:(nullable ABI44_0_0RCTBridge *)bridge withType:(NSString *)eventType body:(NSDictionary *)body;
+ (BOOL)shouldCheckForUpdateWithConfig:(ABI44_0_0EXUpdatesConfig *)config;
+ (NSString *)getRuntimeVersionWithConfig:(ABI44_0_0EXUpdatesConfig *)config;
+ (NSURL *)urlForBundledAsset:(ABI44_0_0EXUpdatesAsset *)asset;
+ (NSString *)pathForBundledAsset:(ABI44_0_0EXUpdatesAsset *)asset;

@end

NS_ASSUME_NONNULL_END
