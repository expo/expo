// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI25_0_0/ABI25_0_0RCTDefines.h>
#import <ReactABI25_0_0/ABI25_0_0RCTInspector.h>

#if ABI25_0_0RCT_DEV

@interface ABI25_0_0RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;
- (void)connect;
- (void)closeQuietly;
- (void)sendEventToAllConnections:(NSString *)event;
@end

@interface ABI25_0_0RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
