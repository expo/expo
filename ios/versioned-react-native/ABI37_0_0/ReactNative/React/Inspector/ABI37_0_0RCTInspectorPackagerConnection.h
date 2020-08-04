// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#import <Foundation/Foundation.h>
#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>

#if ABI37_0_0RCT_DEV && !TARGET_OS_UIKITFORMAC

@interface ABI37_0_0RCTBundleStatus : NSObject
@property (atomic, assign) BOOL isLastBundleDownloadSuccess;
@property (atomic, assign) NSTimeInterval bundleUpdateTimestamp;
@end

typedef ABI37_0_0RCTBundleStatus *(^ABI37_0_0RCTBundleStatusProvider)(void);

@interface ABI37_0_0RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;

- (void)connect;
- (void)closeQuietly;
- (void)sendEventToAllConnections:(NSString *)event;
- (void)setBundleStatusProvider:(ABI37_0_0RCTBundleStatusProvider)bundleStatusProvider;
@end

@interface ABI37_0_0RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
