/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTWebSocketModule.h"

#import <objc/runtime.h>

#import <ReactABI25_0_0/ABI25_0_0RCTConvert.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUtils.h>

#import "ABI25_0_0RCTSRWebSocket.h"

@implementation ABI25_0_0RCTSRWebSocket (ReactABI25_0_0)

- (NSNumber *)ReactABI25_0_0Tag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactABI25_0_0Tag:(NSNumber *)ReactABI25_0_0Tag
{
  objc_setAssociatedObject(self, @selector(ReactABI25_0_0Tag), ReactABI25_0_0Tag, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@interface ABI25_0_0RCTWebSocketModule () <ABI25_0_0RCTSRWebSocketDelegate>

@end

@implementation ABI25_0_0RCTWebSocketModule
{
  NSMutableDictionary<NSNumber *, ABI25_0_0RCTSRWebSocket *> *_sockets;
  NSMutableDictionary<NSNumber *, id> *_contentHandlers;
}

ABI25_0_0RCT_EXPORT_MODULE()

// Used by ABI25_0_0RCTBlobModule
@synthesize methodQueue = _methodQueue;

- (NSArray *)supportedEvents
{
  return @[@"websocketMessage",
           @"websocketOpen",
           @"websocketFailed",
           @"websocketClosed"];
}

- (void)dealloc
{
  for (ABI25_0_0RCTSRWebSocket *socket in _sockets.allValues) {
    socket.delegate = nil;
    [socket close];
  }
}

ABI25_0_0RCT_EXPORT_METHOD(connect:(NSURL *)URL protocols:(NSArray *)protocols options:(NSDictionary *)options socketID:(nonnull NSNumber *)socketID)
{
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:URL];

  // We load cookies from sharedHTTPCookieStorage (shared with XHR and
  // fetch). To get secure cookies for wss URLs, replace wss with https
  // in the URL.
  NSURLComponents *components = [NSURLComponents componentsWithURL:URL resolvingAgainstBaseURL:true];
  if ([components.scheme.lowercaseString isEqualToString:@"wss"]) {
    components.scheme = @"https";
  }

  // Load and set the cookie header.
  NSArray<NSHTTPCookie *> *cookies = [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookiesForURL:components.URL];
  request.allHTTPHeaderFields = [NSHTTPCookie requestHeaderFieldsWithCookies:cookies];

  // Load supplied headers
  [options[@"headers"] enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
    [request addValue:[ABI25_0_0RCTConvert NSString:value] forHTTPHeaderField:key];
  }];

  ABI25_0_0RCTSRWebSocket *webSocket = [[ABI25_0_0RCTSRWebSocket alloc] initWithURLRequest:request protocols:protocols];
  webSocket.delegate = self;
  webSocket.ReactABI25_0_0Tag = socketID;
  if (!_sockets) {
    _sockets = [NSMutableDictionary new];
  }
  _sockets[socketID] = webSocket;
  [webSocket open];
}

ABI25_0_0RCT_EXPORT_METHOD(send:(NSString *)message forSocketID:(nonnull NSNumber *)socketID)
{
  [_sockets[socketID] send:message];
}

ABI25_0_0RCT_EXPORT_METHOD(sendBinary:(NSString *)base64String forSocketID:(nonnull NSNumber *)socketID)
{
  [self sendData:[[NSData alloc] initWithBase64EncodedString:base64String options:0] forSocketID:socketID];
}

- (void)sendData:(NSData *)data forSocketID:(nonnull NSNumber *)socketID
{
  [_sockets[socketID] send:data];
}

ABI25_0_0RCT_EXPORT_METHOD(ping:(nonnull NSNumber *)socketID)
{
  [_sockets[socketID] sendPing:NULL];
}

ABI25_0_0RCT_EXPORT_METHOD(close:(nonnull NSNumber *)socketID)
{
  [_sockets[socketID] close];
  [_sockets removeObjectForKey:socketID];
}

- (void)setContentHandler:(id<ABI25_0_0RCTWebSocketContentHandler>)handler forSocketID:(NSString *)socketID
{
  if (!_contentHandlers) {
    _contentHandlers = [NSMutableDictionary new];
  }
  _contentHandlers[socketID] = handler;
}

#pragma mark - ABI25_0_0RCTSRWebSocketDelegate methods

- (void)webSocket:(ABI25_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  NSString *type;

  NSNumber *socketID = [webSocket ReactABI25_0_0Tag];
  id contentHandler = _contentHandlers[socketID];
  if (contentHandler) {
    message = [contentHandler processMessage:message forSocketID:socketID withType:&type];
  } else {
    if ([message isKindOfClass:[NSData class]]) {
      type = @"binary";
      message = [message base64EncodedStringWithOptions:0];
    } else {
      type = @"text";
    }
  }

  [self sendEventWithName:@"websocketMessage" body:@{
    @"data": message,
    @"type": type,
    @"id": webSocket.ReactABI25_0_0Tag
  }];
}

- (void)webSocketDidOpen:(ABI25_0_0RCTSRWebSocket *)webSocket
{
  [self sendEventWithName:@"websocketOpen" body:@{
    @"id": webSocket.ReactABI25_0_0Tag
  }];
}

- (void)webSocket:(ABI25_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  NSNumber *socketID = [webSocket ReactABI25_0_0Tag];
  _contentHandlers[socketID] = nil;
  _sockets[socketID] = nil;
  [self sendEventWithName:@"websocketFailed" body:@{
    @"message": error.localizedDescription,
    @"id": socketID
  }];
}

- (void)webSocket:(ABI25_0_0RCTSRWebSocket *)webSocket
 didCloseWithCode:(NSInteger)code
           reason:(NSString *)reason
         wasClean:(BOOL)wasClean
{
  NSNumber *socketID = [webSocket ReactABI25_0_0Tag];
  _contentHandlers[socketID] = nil;
  _sockets[socketID] = nil;
  [self sendEventWithName:@"websocketClosed" body:@{
    @"code": @(code),
    @"reason": ABI25_0_0RCTNullIfNil(reason),
    @"clean": @(wasClean),
    @"id": socketID
  }];
}

@end

@implementation ABI25_0_0RCTBridge (ABI25_0_0RCTWebSocketModule)

- (ABI25_0_0RCTWebSocketModule *)webSocketModule
{
  return [self moduleForClass:[ABI25_0_0RCTWebSocketModule class]];
}

@end
