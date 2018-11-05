/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI30_0_0/ABI30_0_0RCTDefines.h>

#if ABI30_0_0RCT_DEV // Only supported in dev mode

@class ABI30_0_0RCTReconnectingWebSocket;

@protocol ABI30_0_0RCTReconnectingWebSocketDelegate
- (void)reconnectingWebSocketDidOpen:(ABI30_0_0RCTReconnectingWebSocket *)webSocket;
- (void)reconnectingWebSocket:(ABI30_0_0RCTReconnectingWebSocket *)webSocket didReceiveMessage:(id)message;
/** Sent when the socket has closed due to error or clean shutdown. An automatic reconnect will start shortly. */
- (void)reconnectingWebSocketDidClose:(ABI30_0_0RCTReconnectingWebSocket *)webSocket;
@end

@interface ABI30_0_0RCTReconnectingWebSocket : NSObject

/** Delegate will be messaged on the given queue (required). */
- (instancetype)initWithURL:(NSURL *)url queue:(dispatch_queue_t)queue;

@property (nonatomic, weak) id<ABI30_0_0RCTReconnectingWebSocketDelegate> delegate;
- (void)send:(id)data;
- (void)start;
- (void)stop;

- (instancetype)initWithURL:(NSURL *)url __deprecated_msg("Use initWithURL:queue: instead");
/** @brief Must be set before -start to have effect */
@property (nonatomic, strong) dispatch_queue_t delegateDispatchQueue __deprecated_msg("Use initWithURL:queue: instead");

@end

#endif
