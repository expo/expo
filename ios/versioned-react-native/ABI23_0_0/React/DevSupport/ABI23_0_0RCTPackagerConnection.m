/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTPackagerConnection.h"

#import <objc/runtime.h>

#import <ReactABI23_0_0/ABI23_0_0RCTAssert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBundleURLProvider.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTDefines.h>
#import <ReactABI23_0_0/ABI23_0_0RCTLog.h>
#import <ReactABI23_0_0/ABI23_0_0RCTReconnectingWebSocket.h>
#import <ReactABI23_0_0/ABI23_0_0RCTSRWebSocket.h>
#import <ReactABI23_0_0/ABI23_0_0RCTUtils.h>

#import "ABI23_0_0RCTPackagerConnectionBridgeConfig.h"
#import "ABI23_0_0RCTReloadPackagerMethod.h"
#import "ABI23_0_0RCTSamplingProfilerPackagerMethod.h"

#if ABI23_0_0RCT_DEV

static dispatch_queue_t ABI23_0_0RCTPackagerConnectionQueue()
{
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.facebook.ABI23_0_0RCTPackagerConnectionQueue", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
};

@interface ABI23_0_0RCTPackagerConnection () <ABI23_0_0RCTWebSocketProtocolDelegate>
@end

@implementation ABI23_0_0RCTPackagerConnection {
  NSURL *_packagerURL;
  ABI23_0_0RCTReconnectingWebSocket *_socket;
  NSMutableDictionary<NSString *, id<ABI23_0_0RCTPackagerClientMethod>> *_handlers;
}

+ (void)checkDefaultConnectionWithCallback:(void (^)(BOOL isRunning))callback
                                     queue:(dispatch_queue_t)queue
{
  ABI23_0_0RCTBundleURLProvider *const settings = [ABI23_0_0RCTBundleURLProvider sharedSettings];
  NSURLComponents *components = [NSURLComponents new];
  components.scheme = @"http";
  components.host = settings.jsLocation ?: @"localhost";
  components.port = @(kABI23_0_0RCTBundleURLProviderDefaultPort);
  components.path = @"/status";
  [NSURLConnection sendAsynchronousRequest:[NSURLRequest requestWithURL:components.URL]
                                     queue:[NSOperationQueue mainQueue]
                         completionHandler:^(NSURLResponse *response, NSData *data, NSError *connectionError) {
                           NSString *const status = data != nil
                             ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]
                             : nil;
                           BOOL isRunning = [status isEqualToString:@"packager-status:running"];

                           dispatch_async(queue, ^{
                             callback(isRunning);
                           });
                         }];
}

+ (instancetype)connectionForBridge:(ABI23_0_0RCTBridge *)bridge
{
  ABI23_0_0RCTPackagerConnectionBridgeConfig *config = [[ABI23_0_0RCTPackagerConnectionBridgeConfig alloc] initWithBridge:bridge];
  return [[[self class] alloc] initWithConfig:config];
}

- (instancetype)initWithConfig:(id<ABI23_0_0RCTPackagerConnectionConfig>)config
{
  if (self = [super init]) {
    _packagerURL = [config packagerURL];
    _handlers = [[config defaultPackagerMethods] mutableCopy];
    [self connect];
  }
  return self;
}

- (void)connect
{
  ABI23_0_0RCTAssertMainQueue();

  NSURL *url = _packagerURL;
  if (!url) {
    return;
  }

  // The jsPackagerClient is a static map that holds different packager clients per the packagerURL
  // In case many instances of DevMenu are created, the latest instance that use the same URL as
  // previous instances will override given packager client's method handlers
  static NSMutableDictionary<NSString *, ABI23_0_0RCTReconnectingWebSocket *> *socketConnections = nil;
  if (socketConnections == nil) {
    socketConnections = [NSMutableDictionary new];
  }

  NSString *key = [url absoluteString];
  _socket = socketConnections[key];
  if (!_socket) {
    _socket = [[ABI23_0_0RCTReconnectingWebSocket alloc] initWithURL:url];
    _socket.delegateDispatchQueue = ABI23_0_0RCTPackagerConnectionQueue();
    [_socket start];
    socketConnections[key] = _socket;
  }

  _socket.delegate = self;
}

- (void)stop
{
  [_socket stop];
}


- (void)addHandler:(id<ABI23_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)name
{
  @synchronized(self) {
    _handlers[name] = handler;
  }
}

- (id<ABI23_0_0RCTPackagerClientMethod>)handlerForMethod:(NSString *)name
{
  @synchronized(self) {
    return _handlers[name];
  }
}

static BOOL isSupportedVersion(NSNumber *version)
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @(ABI23_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION) ];
  return [kSupportedVersions containsObject:version];
}

#pragma mark - ABI23_0_0RCTWebSocketProtocolDelegate

- (void)webSocket:(ABI23_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  NSError *error = nil;
  NSDictionary<NSString *, id> *msg = ABI23_0_0RCTJSONParse(message, &error);

  if (error) {
    ABI23_0_0RCTLogError(@"%@ failed to parse message with error %@\n<message>\n%@\n</message>", [self class], error, msg);
    return;
  }

  if (!isSupportedVersion(msg[@"version"])) {
    ABI23_0_0RCTLogError(@"%@ received message with not supported version %@", [self class], msg[@"version"]);
    return;
  }

  id<ABI23_0_0RCTPackagerClientMethod> methodHandler = [self handlerForMethod:msg[@"method"]];
  if (!methodHandler) {
    if (msg[@"id"]) {
      NSString *errorMsg = [NSString stringWithFormat:@"%@ no handler found for method %@", [self class], msg[@"method"]];
      ABI23_0_0RCTLogError(errorMsg, msg[@"method"]);
      [[[ABI23_0_0RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                               socket:webSocket] respondWithError:errorMsg];
    }
    return; // If it was a broadcast then we ignore it gracefully
  }

  dispatch_queue_t methodQueue = [methodHandler respondsToSelector:@selector(methodQueue)]
    ? [methodHandler methodQueue]
    : dispatch_get_main_queue();

  dispatch_async(methodQueue, ^{
    if (msg[@"id"]) {
      [methodHandler handleRequest:msg[@"params"]
                     withResponder:[[ABI23_0_0RCTPackagerClientResponder alloc] initWithId:msg[@"id"]
                                                                           socket:webSocket]];
    } else {
      [methodHandler handleNotification:msg[@"params"]];
    }
  });
}

- (void)webSocketDidOpen:(ABI23_0_0RCTSRWebSocket *)webSocket
{
}

- (void)webSocket:(ABI23_0_0RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
}

@end

#endif
