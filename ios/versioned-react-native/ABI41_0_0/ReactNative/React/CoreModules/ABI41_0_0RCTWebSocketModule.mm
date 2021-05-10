/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTWebSocketModule.h>

#import <objc/runtime.h>

#import <ABI41_0_0FBReactNativeSpec/ABI41_0_0FBReactNativeSpec.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>
#import <ABI41_0_0React/ABI41_0_0RCTSRWebSocket.h>
#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>

#import "ABI41_0_0CoreModulesPlugins.h"

@implementation ABI41_0_0RCTSRWebSocket (ABI41_0_0React)

- (NSNumber *)ABI41_0_0ReactTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setABI41_0_0ReactTag:(NSNumber *)ABI41_0_0ReactTag
{
  objc_setAssociatedObject(self, @selector(ABI41_0_0ReactTag), ABI41_0_0ReactTag, OBJC_ASSOCIATION_COPY_NONATOMIC);
}

@end

@interface ABI41_0_0RCTWebSocketModule () <ABI41_0_0RCTSRWebSocketDelegate, ABI41_0_0NativeWebSocketModuleSpec>

@end

@implementation ABI41_0_0RCTWebSocketModule {
  NSMutableDictionary<NSNumber *, ABI41_0_0RCTSRWebSocket *> *_sockets;
  NSMutableDictionary<NSNumber *, id<ABI41_0_0RCTWebSocketContentHandler>> *_contentHandlers;
}

ABI41_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSArray *)supportedEvents
{
  return @[ @"websocketMessage", @"websocketOpen", @"websocketFailed", @"websocketClosed" ];
}

- (void)invalidate
{
  _contentHandlers = nil;
  for (ABI41_0_0RCTSRWebSocket *socket in _sockets.allValues) {
    socket.delegate = nil;
    [socket close];
  }
}

ABI41_0_0RCT_EXPORT_METHOD(connect
                  : (NSURL *)URL protocols
                  : (NSArray *)protocols options
                  : (JS::NativeWebSocketModule::SpecConnectOptions &)options socketID
                  : (double)socketID)
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
  if ([options.headers() isKindOfClass:NSDictionary.class]) {
    NSDictionary *headers = (NSDictionary *)options.headers();
    [headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
      [request addValue:[ABI41_0_0RCTConvert NSString:value] forHTTPHeaderField:key];
    }];
  }

  ABI41_0_0RCTSRWebSocket *webSocket = [[ABI41_0_0RCTSRWebSocket alloc] initWithURLRequest:request protocols:protocols];
  [webSocket setDelegateDispatchQueue:[self methodQueue]];
  webSocket.delegate = self;
  webSocket.ABI41_0_0ReactTag = @(socketID);
  if (!_sockets) {
    _sockets = [NSMutableDictionary new];
  }
  _sockets[@(socketID)] = webSocket;
  [webSocket open];
}

ABI41_0_0RCT_EXPORT_METHOD(send : (NSString *)message forSocketID : (double)socketID)
{
  [_sockets[@(socketID)] send:message];
}

ABI41_0_0RCT_EXPORT_METHOD(sendBinary : (NSString *)base64String forSocketID : (double)socketID)
{
  [self sendData:[[NSData alloc] initWithBase64EncodedString:base64String options:0] forSocketID:@(socketID)];
}

- (void)sendData:(NSData *)data forSocketID:(NSNumber *__nonnull)socketID
{
  [_sockets[socketID] send:data];
}

ABI41_0_0RCT_EXPORT_METHOD(ping : (double)socketID)
{
  [_sockets[@(socketID)] sendPing:NULL];
}

ABI41_0_0RCT_EXPORT_METHOD(close : (double)code reason : (NSString *)reason socketID : (double)socketID)
{
  [_sockets[@(socketID)] closeWithCode:code reason:reason];
  [_sockets removeObjectForKey:@(socketID)];
}

- (void)setContentHandler:(id<ABI41_0_0RCTWebSocketContentHandler>)handler forSocketID:(NSString *)socketID
{
  if (!_contentHandlers) {
    _contentHandlers = [NSMutableDictionary new];
  }
  _contentHandlers[socketID] = handler;
}

#pragma mark - ABI41_0_0RCTSRWebSocketDelegate methods

- (void)webSocket:(ABI41_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  NSString *type;

  NSNumber *socketID = [webSocket ABI41_0_0ReactTag];
  id contentHandler = _contentHandlers[socketID];
  if (contentHandler) {
    message = [contentHandler processWebsocketMessage:message forSocketID:socketID withType:&type];
  } else {
    if ([message isKindOfClass:[NSData class]]) {
      type = @"binary";
      message = [message base64EncodedStringWithOptions:0];
    } else {
      type = @"text";
    }
  }

  [self sendEventWithName:@"websocketMessage" body:@{@"data" : message, @"type" : type, @"id" : webSocket.ABI41_0_0ReactTag}];
}

- (void)webSocketDidOpen:(ABI41_0_0RCTSRWebSocket *)webSocket
{
  [self sendEventWithName:@"websocketOpen"
                     body:@{@"id" : webSocket.ABI41_0_0ReactTag, @"protocol" : webSocket.protocol ? webSocket.protocol : @""}];
}

- (void)webSocket:(ABI41_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  NSNumber *socketID = [webSocket ABI41_0_0ReactTag];
  _contentHandlers[socketID] = nil;
  _sockets[socketID] = nil;
  NSDictionary *body =
      @{@"message" : error.localizedDescription ?: @"Undefined, error is nil", @"id" : socketID ?: @(-1)};
  [self sendEventWithName:@"websocketFailed" body:body];
}

- (void)webSocket:(ABI41_0_0RCTSRWebSocket *)webSocket
    didCloseWithCode:(NSInteger)code
              reason:(NSString *)reason
            wasClean:(BOOL)wasClean
{
  NSNumber *socketID = [webSocket ABI41_0_0ReactTag];
  _contentHandlers[socketID] = nil;
  _sockets[socketID] = nil;
  [self sendEventWithName:@"websocketClosed"
                     body:@{
                       @"code" : @(code),
                       @"reason" : ABI41_0_0RCTNullIfNil(reason),
                       @"clean" : @(wasClean),
                       @"id" : socketID
                     }];
}

- (std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI41_0_0facebook::ABI41_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<ABI41_0_0facebook::ABI41_0_0React::NativeWebSocketModuleSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

@implementation ABI41_0_0RCTBridge (ABI41_0_0RCTWebSocketModule)

- (ABI41_0_0RCTWebSocketModule *)webSocketModule
{
  return [self moduleForClass:[ABI41_0_0RCTWebSocketModule class]];
}

@end

Class ABI41_0_0RCTWebSocketModuleCls(void)
{
  return ABI41_0_0RCTWebSocketModule.class;
}
