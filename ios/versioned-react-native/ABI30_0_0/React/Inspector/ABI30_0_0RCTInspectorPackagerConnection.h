// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTDefines.h>

#if ABI30_0_0RCT_DEV

@interface ABI30_0_0RCTBundleStatus : NSObject
@property (atomic, assign) BOOL isLastBundleDownloadSuccess;
@property (atomic, assign) NSTimeInterval bundleUpdateTimestamp;
@end

typedef ABI30_0_0RCTBundleStatus *(^ABI30_0_0RCTBundleStatusProvider)(void);

@interface ABI30_0_0RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;

- (void)connect;
- (void)closeQuietly;
- (void)sendEventToAllConnections:(NSString *)event;
- (void)setBundleStatusProvider:(ABI30_0_0RCTBundleStatusProvider)bundleStatusProvider;
@end

@interface ABI30_0_0RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
