/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTPackagerClient.h"

#import <ReactABI16_0_0/ABI16_0_0RCTConvert.h>
#import <ReactABI16_0_0/ABI16_0_0RCTDefines.h>
#import <ReactABI16_0_0/ABI16_0_0RCTLog.h>
#import <ReactABI16_0_0/ABI16_0_0RCTReconnectingWebSocket.h>
#import <ReactABI16_0_0/ABI16_0_0RCTSRWebSocket.h>
#import <ReactABI16_0_0/ABI16_0_0RCTUtils.h>

#import "ABI16_0_0RCTPackagerClientResponder.h"

#if ABI16_0_0RCT_DEV // Only supported in dev mode

@interface ABI16_0_0RCTPackagerClient () <ABI16_0_0RCTWebSocketProtocolDelegate>
@end

@implementation ABI16_0_0RCTPackagerClient {
  ABI16_0_0RCTReconnectingWebSocket *_socket;
  NSMutableDictionary<NSString *, id<ABI16_0_0RCTPackagerClientMethod>> *_handlers;
}

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _socket = [[ABI16_0_0RCTReconnectingWebSocket alloc] initWithURL:url];
    _socket.delegate = self;
    _handlers = [NSMutableDictionary new];
  }
  return self;
}

- (void)addHandler:(id<ABI16_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)name
{
  _handlers[name] = handler;
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

- (BOOL)isSupportedVersion:(NSNumber *)version
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @(ABI16_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION) ];
  return [kSupportedVersions containsObject:version];
}

- (void)webSocket:(ABI16_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  if (!_handlers) {
    return;
  }

  NSError *error = nil;
  NSDictionary<NSString *, id> *msg = ABI16_0_0RCTJSONParse(message, &error);

  if (error) {
    ABI16_0_0RCTLogError(@"%@ failed to parse message with error %@\n<message>\n%@\n</message>", [self class], error, msg);
    return;
  }

  if (![self isSupportedVersion:msg[@"version"]]) {
    ABI16_0_0RCTLogError(@"%@ received message with not supported version %@", [self class], msg[@"version"]);
    return;
  }

  id<ABI16_0_0RCTPackagerClientMethod> methodHandler = _handlers[msg[@"method"]];
  if (!methodHandler) {
    if (msg[@"id"]) {
      NSString *errorMsg = [NSString stringWithFormat:@"%@ no handler found for method %@", [self class], msg[@"method"]];
      ABI16_0_0RCTLogError(errorMsg, msg[@"method"]);
      [[[ABI16_0_0RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                               socket:webSocket] respondWithError:errorMsg];
    }
    return; // If it was a broadcast then we ignore it gracefully
  }

  if (msg[@"id"]) {
    [methodHandler handleRequest:msg[@"params"]
                   withResponder:[[ABI16_0_0RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                                                         socket:webSocket]];
  } else {
    [methodHandler handleNotification:msg[@"params"]];
  }
}
@end

#endif
