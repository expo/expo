/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTWebSocketModule.h"

#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTEventDispatcher.h"
#import "ABI5_0_0RCTConvert.h"
#import "ABI5_0_0RCTUtils.h"

@implementation ABI5_0_0RCTSRWebSocket (ReactABI5_0_0)

- (NSNumber *)ReactABI5_0_0Tag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI5_0_0Tag:(NSNumber *)ReactABI5_0_0Tag
{
  objc_setAssociatedObject(self, @selector(ReactABI5_0_0Tag), ReactABI5_0_0Tag, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@implementation ABI5_0_0RCTWebSocketModule
{
    NSMutableDictionary<NSNumber *, ABI5_0_0RCTSRWebSocket *> *_sockets;
}

ABI5_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (void)dealloc
{
  for (ABI5_0_0RCTSRWebSocket *socket in _sockets.allValues) {
    socket.delegate = nil;
    [socket close];
  }
}

ABI5_0_0RCT_EXPORT_METHOD(connect:(NSURL *)URL protocols:(NSArray *)protocols headers:(NSDictionary *)headers socketID:(nonnull NSNumber *)socketID)
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];
  [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
    [request addValue:[ABI5_0_0RCTConvert NSString:value] forHTTPHeaderField:key];
  }];

  ABI5_0_0RCTSRWebSocket *webSocket = [[ABI5_0_0RCTSRWebSocket alloc] initWithURLRequest:request protocols:protocols];
  webSocket.delegate = self;
  webSocket.ReactABI5_0_0Tag = socketID;
  if (!_sockets) {
    _sockets = [NSMutableDictionary new];
  }
  _sockets[socketID] = webSocket;
  [webSocket open];
}

ABI5_0_0RCT_EXPORT_METHOD(send:(NSString *)message socketID:(nonnull NSNumber *)socketID)
{
  [_sockets[socketID] send:message];
}

ABI5_0_0RCT_EXPORT_METHOD(close:(nonnull NSNumber *)socketID)
{
  [_sockets[socketID] close];
  [_sockets removeObjectForKey:socketID];
}

#pragma mark - ABI5_0_0RCTSRWebSocketDelegate methods

- (void)webSocket:(ABI5_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  BOOL binary = [message isKindOfClass:[NSData class]];
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketMessage" body:@{
    @"data": binary ? [message base64EncodedStringWithOptions:0] : message,
    @"type": binary ? @"binary" : @"text",
    @"id": webSocket.ReactABI5_0_0Tag
  }];
}

- (void)webSocketDidOpen:(ABI5_0_0RCTSRWebSocket *)webSocket
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketOpen" body:@{
    @"id": webSocket.ReactABI5_0_0Tag
  }];
}

- (void)webSocket:(ABI5_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketFailed" body:@{
    @"message":error.localizedDescription,
    @"id": webSocket.ReactABI5_0_0Tag
  }];
}

- (void)webSocket:(ABI5_0_0RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code
           reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"websocketClosed" body:@{
    @"code": @(code),
    @"reason": ABI5_0_0RCTNullIfNil(reason),
    @"clean": @(wasClean),
    @"id": webSocket.ReactABI5_0_0Tag
  }];
}

@end
