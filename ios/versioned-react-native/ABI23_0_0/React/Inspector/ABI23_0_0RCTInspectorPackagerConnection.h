// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTDefines.h>
#import <ReactABI23_0_0/ABI23_0_0RCTInspector.h>

#if ABI23_0_0RCT_DEV

@interface ABI23_0_0RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;
- (void)connect;
- (void)closeQuietly;
- (void)sendEventToAllConnections:(NSString *)event;
@end

@interface ABI23_0_0RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
