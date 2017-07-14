/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTPackagerConnection.h"

#import <objc/runtime.h>

#import <ReactABI19_0_0/ABI19_0_0RCTAssert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTBridge.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>
#import <ReactABI19_0_0/ABI19_0_0RCTDefines.h>
#import <ReactABI19_0_0/ABI19_0_0RCTLog.h>
#import <ReactABI19_0_0/ABI19_0_0RCTReconnectingWebSocket.h>
#import <ReactABI19_0_0/ABI19_0_0RCTSRWebSocket.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUtils.h>
#import <ReactABI19_0_0/ABI19_0_0RCTWebSocketObserverProtocol.h>

#import "ABI19_0_0RCTReloadPackagerMethod.h"
#import "ABI19_0_0RCTSamplingProfilerPackagerMethod.h"

#if ABI19_0_0RCT_DEV

@interface ABI19_0_0RCTPackagerConnection () <ABI19_0_0RCTWebSocketProtocolDelegate>
@end

@implementation ABI19_0_0RCTPackagerConnection {
  ABI19_0_0RCTBridge *_bridge;
  ABI19_0_0RCTReconnectingWebSocket *_socket;
  NSMutableDictionary<NSString *, id<ABI19_0_0RCTPackagerClientMethod>> *_handlers;
}

- (instancetype)initWithBridge:(ABI19_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;

    _handlers = [NSMutableDictionary new];
    _handlers[@"reload"] = [[ABI19_0_0RCTReloadPackagerMethod alloc] initWithBridge:bridge];
    _handlers[@"pokeSamplingProfiler"] = [[ABI19_0_0RCTSamplingProfilerPackagerMethod alloc] initWithBridge:bridge];

    [self connect];
  }
  return self;
}

- (void)connect
{
  ABI19_0_0RCTAssertMainQueue();

  NSURL *url = [self packagerURL];
  if (!url) {
    return;
  }

  // The jsPackagerClient is a static map that holds different packager clients per the packagerURL
  // In case many instances of DevMenu are created, the latest instance that use the same URL as
  // previous instances will override given packager client's method handlers
  static NSMutableDictionary<NSString *, ABI19_0_0RCTReconnectingWebSocket *> *socketConnections = nil;
  if (socketConnections == nil) {
    socketConnections = [NSMutableDictionary new];
  }

  NSString *key = [url absoluteString];
  ABI19_0_0RCTReconnectingWebSocket *webSocket = socketConnections[key];
  if (!webSocket) {
    webSocket = [[ABI19_0_0RCTReconnectingWebSocket alloc] initWithURL:url];
    [webSocket start];
    socketConnections[key] = webSocket;
  }

  webSocket.delegate = self;
}

- (NSURL *)packagerURL
{
  NSString *host = [_bridge.bundleURL host];
  NSString *scheme = [_bridge.bundleURL scheme];
  if (!host) {
    host = @"localhost";
    scheme = @"http";
  }

  NSNumber *port = [_bridge.bundleURL port];
  if (!port) {
    port = @8081; // Packager default port
  }
  return [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@:%@/message?role=ios-rn-rctdevmenu", scheme, host, port]];
}


- (void)addHandler:(id<ABI19_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)name
{
  _handlers[name] = handler;
}

static BOOL isSupportedVersion(NSNumber *version)
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @(ABI19_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION) ];
  return [kSupportedVersions containsObject:version];
}

#pragma mark - ABI19_0_0RCTWebSocketProtocolDelegate

- (void)webSocket:(ABI19_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  if (!_handlers) {
    return;
  }

  NSError *error = nil;
  NSDictionary<NSString *, id> *msg = ABI19_0_0RCTJSONParse(message, &error);

  if (error) {
    ABI19_0_0RCTLogError(@"%@ failed to parse message with error %@\n<message>\n%@\n</message>", [self class], error, msg);
    return;
  }

  if (!isSupportedVersion(msg[@"version"])) {
    ABI19_0_0RCTLogError(@"%@ received message with not supported version %@", [self class], msg[@"version"]);
    return;
  }

  id<ABI19_0_0RCTPackagerClientMethod> methodHandler = _handlers[msg[@"method"]];
  if (!methodHandler) {
    if (msg[@"id"]) {
      NSString *errorMsg = [NSString stringWithFormat:@"%@ no handler found for method %@", [self class], msg[@"method"]];
      ABI19_0_0RCTLogError(errorMsg, msg[@"method"]);
      [[[ABI19_0_0RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                               socket:webSocket] respondWithError:errorMsg];
    }
    return; // If it was a broadcast then we ignore it gracefully
  }

  if (msg[@"id"]) {
    [methodHandler handleRequest:msg[@"params"]
                   withResponder:[[ABI19_0_0RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                                                         socket:webSocket]];
  } else {
    [methodHandler handleNotification:msg[@"params"]];
  }
}

@end

#endif
