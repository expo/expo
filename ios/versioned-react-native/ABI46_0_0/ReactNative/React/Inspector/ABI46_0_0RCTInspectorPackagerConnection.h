/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>

#if ABI46_0_0RCT_DEV

@interface ABI46_0_0RCTBundleStatus : NSObject
@property (atomic, assign) BOOL isLastBundleDownloadSuccess;
@property (atomic, assign) NSTimeInterval bundleUpdateTimestamp;
@end

typedef ABI46_0_0RCTBundleStatus * (^ABI46_0_0RCTBundleStatusProvider)(void);

@interface ABI46_0_0RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;

- (bool)isConnected;
- (void)connect;
- (void)closeQuietly;
- (void)sendEventToAllConnections:(NSString *)event;
- (void)setBundleStatusProvider:(ABI46_0_0RCTBundleStatusProvider)bundleStatusProvider;
@end

@interface ABI46_0_0RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
