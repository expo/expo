/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTReconnectingWebSocket.h>

#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

#import <ABI48_0_0React/ABI48_0_0RCTSRWebSocket.h>

#if ABI48_0_0RCT_DEV // Only supported in dev mode

@interface ABI48_0_0RCTReconnectingWebSocket () <ABI48_0_0RCTSRWebSocketDelegate>
@end

@implementation ABI48_0_0RCTReconnectingWebSocket {
  NSURL *_url;
  ABI48_0_0RCTSRWebSocket *_socket;
  BOOL _stopped;
}

- (instancetype)initWithURL:(NSURL *)url queue:(dispatch_queue_t)queue
{
  if (self = [super init]) {
    _url = url;
    _delegateDispatchQueue = queue;
  }
  return self;
}

- (instancetype)initWithURL:(NSURL *)url
{
  return [self initWithURL:url queue:dispatch_get_main_queue()];
}

- (void)send:(id)data
{
  [_socket send:data];
}

- (void)start
{
  [self stop];
  _stopped = NO;
  _socket = [[ABI48_0_0RCTSRWebSocket alloc] initWithURL:_url];
  _socket.delegate = self;
  [_socket setDelegateDispatchQueue:_delegateDispatchQueue];
  [_socket open];
}

- (void)stop
{
  _stopped = YES;
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (void)webSocket:(ABI48_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  [_delegate reconnectingWebSocket:self didReceiveMessage:message];
}

- (void)reconnect
{
  if (_stopped) {
    return;
  }

  __weak ABI48_0_0RCTSRWebSocket *socket = _socket;
  __weak __typeof(self) weakSelf = self;

  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [weakSelf start];
    if (!socket) {
      [weakSelf reconnect];
    }
  });
}

- (void)webSocketDidOpen:(ABI48_0_0RCTSRWebSocket *)webSocket
{
  [_delegate reconnectingWebSocketDidOpen:self];
}

- (void)webSocket:(ABI48_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [_delegate reconnectingWebSocketDidClose:self];
  if ([error code] != ECONNREFUSED) {
    [self reconnect];
  }
}

- (void)webSocket:(ABI48_0_0RCTSRWebSocket *)webSocket
    didCloseWithCode:(NSInteger)code
              reason:(NSString *)reason
            wasClean:(BOOL)wasClean
{
  [_delegate reconnectingWebSocketDidClose:self];
  [self reconnect];
}

@end

#endif
