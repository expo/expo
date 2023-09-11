//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAsset.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXUpdatesUtils : NSObject

+ (void)runBlockOnMainThread:(void (^)(void))block;
+ (NSString *)hexEncodedSHA256WithData:(NSData *)data;
+ (NSString *)base64UrlEncodedSHA256WithData:(NSData *)data;
+ (nullable NSURL *)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error;
+ (void)sendEventToBridge:(nullable ABI47_0_0RCTBridge *)bridge withType:(NSString *)eventType body:(NSDictionary *)body;
+ (BOOL)shouldCheckForUpdateWithConfig:(ABI47_0_0EXUpdatesConfig *)config;
+ (NSString *)getRuntimeVersionWithConfig:(ABI47_0_0EXUpdatesConfig *)config;
+ (NSURL *)urlForBundledAsset:(ABI47_0_0EXUpdatesAsset *)asset;
+ (NSString *)pathForBundledAsset:(ABI47_0_0EXUpdatesAsset *)asset;
+ (BOOL)isNativeDebuggingEnabled;
+ (void)purgeUpdatesLogsOlderThanOneDay;

@end

NS_ASSUME_NONNULL_END
