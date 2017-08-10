// Copyright 2004-present Facebook. All Rights Reserved.

#import <Foundation/Foundation.h>
#import <ReactABI20_0_0/ABI20_0_0RCTDefines.h>
#import <ReactABI20_0_0/ABI20_0_0RCTInspector.h>

#if ABI20_0_0RCT_DEV

@interface ABI20_0_0RCTInspectorPackagerConnection : NSObject
- (instancetype)initWithURL:(NSURL *)url;
- (void)connect;
- (void)closeQuietly;
- (void)sendOpenEvent:(NSString *)pageId;
@end

@interface ABI20_0_0RCTInspectorRemoteConnection : NSObject
- (void)onMessage:(NSString *)message;
- (void)onDisconnect;
@end

#endif
