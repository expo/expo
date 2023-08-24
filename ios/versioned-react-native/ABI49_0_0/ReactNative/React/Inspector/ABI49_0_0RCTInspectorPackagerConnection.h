/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

#if ABI49_0_0RCT_DEV || ABI49_0_0RCT_REMOTE_PROFILE

@interface ABI49_0_0RCTBundleStatus : NSObject
@property (atomic, assign) BOOL isLastBundleDownloadSuccess;
@property (atomic, assign) NSTimeInterval bundleUpdateTimestamp;
@end

typedef ABI49_0_0RCTBundleStatus * (^ABI49_0_0RCTBundleStatusProvider)(void);

@interface ABI49_0_0RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;

- (bool)isConnected;
- (void)connect;
- (void)closeQuietly;
- (void)sendEventToAllConnections:(NSString *)event;
- (void)setBundleStatusProvider:(ABI49_0_0RCTBundleStatusProvider)bundleStatusProvider;
@end

@interface ABI49_0_0RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
