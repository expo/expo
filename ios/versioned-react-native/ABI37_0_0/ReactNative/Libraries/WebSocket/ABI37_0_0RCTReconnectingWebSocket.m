/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTReconnectingWebSocket.h>

#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>

#import <ABI37_0_0React/ABI37_0_0RCTSRWebSocket.h>

#if ABI37_0_0RCT_DEV // Only supported in dev mode

@interface ABI37_0_0RCTReconnectingWebSocket () <ABI37_0_0RCTSRWebSocketDelegate>
@end

@implementation ABI37_0_0RCTReconnectingWebSocket {
  NSURL *_url;
  ABI37_0_0RCTSRWebSocket *_socket;
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
  _socket = [[ABI37_0_0RCTSRWebSocket alloc] initWithURL:_url];
  _socket.delegate = self;
  [_socket setDelegateDispatchQueue:_delegateDispatchQueue];
  [_socket open];
}

- (void)stop
{
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (void)webSocket:(ABI37_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  [_delegate reconnectingWebSocket:self didReceiveMessage:message];
}

- (void)reconnect
{
  __weak ABI37_0_0RCTSRWebSocket *socket = _socket;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self start];
    if (!socket) {
      [self reconnect];
    }
  });
}

- (void)webSocketDidOpen:(ABI37_0_0RCTSRWebSocket *)webSocket
{
  [_delegate reconnectingWebSocketDidOpen:self];
}

- (void)webSocket:(ABI37_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [_delegate reconnectingWebSocketDidClose:self];
  if ([error code] != ECONNREFUSED) {
    [self reconnect];
  }
}

- (void)webSocket:(ABI37_0_0RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  [_delegate reconnectingWebSocketDidClose:self];
  [self reconnect];
}

@end

#endif
