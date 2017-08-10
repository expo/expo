/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI20_0_0/ABI20_0_0RCTDefines.h>

#if ABI20_0_0RCT_DEV // Only supported in dev mode

@class ABI20_0_0RCTSRWebSocket;

@protocol ABI20_0_0RCTWebSocketProtocolDelegate

- (void)webSocket:(ABI20_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message;

@end

@interface ABI20_0_0RCTReconnectingWebSocket : NSObject

- (instancetype)initWithURL:(NSURL *)url;
@property (nonatomic, weak) id<ABI20_0_0RCTWebSocketProtocolDelegate> delegate;
- (void)send:(id)data;
- (void)start;
- (void)stop;

@end

#endif
