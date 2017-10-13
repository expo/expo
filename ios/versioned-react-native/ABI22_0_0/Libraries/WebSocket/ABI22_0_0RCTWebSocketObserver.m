/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTWebSocketObserver.h"

#import <ReactABI22_0_0/ABI22_0_0RCTConvert.h>
#import <ReactABI22_0_0/ABI22_0_0RCTDefines.h>
#import <ReactABI22_0_0/ABI22_0_0RCTLog.h>
#import <ReactABI22_0_0/ABI22_0_0RCTUtils.h>

#import "ABI22_0_0RCTReconnectingWebSocket.h"

#if ABI22_0_0RCT_DEV // Only supported in dev mode

@interface ABI22_0_0RCTWebSocketObserver () <ABI22_0_0RCTWebSocketProtocolDelegate>
@end

@implementation ABI22_0_0RCTWebSocketObserver {
  ABI22_0_0RCTReconnectingWebSocket *_socket;
}

@synthesize delegate = _delegate;

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _socket = [[ABI22_0_0RCTReconnectingWebSocket alloc] initWithURL:url];
    _socket.delegate = self;
  }
  return self;
}

- (void)setDelegateDispatchQueue:(dispatch_queue_t)queue
{
  [_socket setDelegateDispatchQueue:queue];
}

- (void)start
{
  _socket.delegate = self;
  [_socket start];
}

- (void)stop
{
  [_socket stop];
}

- (void)webSocket:(ABI22_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  if (_delegate) {
    NSError *error = nil;
    NSDictionary<NSString *, id> *msg = ABI22_0_0RCTJSONParse(message, &error);

    if (!error) {
      [_delegate didReceiveWebSocketMessage:msg];
    } else {
      ABI22_0_0RCTLogError(@"WebSocketManager failed to parse message with error %@\n<message>\n%@\n</message>", error, message);
    }
  }
}

- (void)webSocketDidOpen:(ABI22_0_0RCTSRWebSocket *)webSocket
{
}

- (void)webSocket:(ABI22_0_0RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
}

@end

#endif
