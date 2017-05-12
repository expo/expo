/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTWebSocketModule.h"

#import <objc/runtime.h>

#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>

#import "ABI17_0_0RCTSRWebSocket.h"

@implementation ABI17_0_0RCTSRWebSocket (ReactABI17_0_0)

- (NSNumber *)ReactABI17_0_0Tag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI17_0_0Tag:(NSNumber *)ReactABI17_0_0Tag
{
  objc_setAssociatedObject(self, @selector(ReactABI17_0_0Tag), ReactABI17_0_0Tag, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@interface ABI17_0_0RCTWebSocketModule () <ABI17_0_0RCTSRWebSocketDelegate>

@end

@implementation ABI17_0_0RCTWebSocketModule
{
    NSMutableDictionary<NSNumber *, ABI17_0_0RCTSRWebSocket *> *_sockets;
}

ABI17_0_0RCT_EXPORT_MODULE()

- (NSArray *)supportedEvents
{
  return @[@"websocketMessage",
           @"websocketOpen",
           @"websocketFailed",
           @"websocketClosed"];
}

- (void)dealloc
{
  for (ABI17_0_0RCTSRWebSocket *socket in _sockets.allValues) {
    socket.delegate = nil;
    [socket close];
  }
}

ABI17_0_0RCT_EXPORT_METHOD(connect:(NSURL *)URL protocols:(NSArray *)protocols headers:(NSDictionary *)headers socketID:(nonnull NSNumber *)socketID)
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
    [request addValue:[ABI17_0_0RCTConvert NSString:value] forHTTPHeaderField:key];
  }];

  ABI17_0_0RCTSRWebSocket *webSocket = [[ABI17_0_0RCTSRWebSocket alloc] initWithURLRequest:request protocols:protocols];
  webSocket.delegate = self;
  webSocket.ReactABI17_0_0Tag = socketID;
  if (!_sockets) {
    _sockets = [NSMutableDictionary new];
  }
  _sockets[socketID] = webSocket;
  [webSocket open];
}

ABI17_0_0RCT_EXPORT_METHOD(send:(NSString *)message socketID:(nonnull NSNumber *)socketID)
{
  [_sockets[socketID] send:message];
}

ABI17_0_0RCT_EXPORT_METHOD(sendBinary:(NSString *)base64String socketID:(nonnull NSNumber *)socketID)
{
  NSData *message = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
  [_sockets[socketID] send:message];
}

ABI17_0_0RCT_EXPORT_METHOD(ping:(nonnull NSNumber *)socketID)
{
  [_sockets[socketID] sendPing:NULL];
}

ABI17_0_0RCT_EXPORT_METHOD(close:(nonnull NSNumber *)socketID)
{
  [_sockets[socketID] close];
  [_sockets removeObjectForKey:socketID];
}

#pragma mark - ABI17_0_0RCTSRWebSocketDelegate methods

- (void)webSocket:(ABI17_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  BOOL binary = [message isKindOfClass:[NSData class]];
  [self sendEventWithName:@"websocketMessage" body:@{
    @"data": binary ? [message base64EncodedStringWithOptions:0] : message,
    @"type": binary ? @"binary" : @"text",
    @"id": webSocket.ReactABI17_0_0Tag
  }];
}

- (void)webSocketDidOpen:(ABI17_0_0RCTSRWebSocket *)webSocket
{
  [self sendEventWithName:@"websocketOpen" body:@{
    @"id": webSocket.ReactABI17_0_0Tag
  }];
}

- (void)webSocket:(ABI17_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [self sendEventWithName:@"websocketFailed" body:@{
    @"message":error.localizedDescription,
    @"id": webSocket.ReactABI17_0_0Tag
  }];
}

- (void)webSocket:(ABI17_0_0RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code
           reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  [self sendEventWithName:@"websocketClosed" body:@{
    @"code": @(code),
    @"reason": ABI17_0_0RCTNullIfNil(reason),
    @"clean": @(wasClean),
    @"id": webSocket.ReactABI17_0_0Tag
  }];
}

@end
