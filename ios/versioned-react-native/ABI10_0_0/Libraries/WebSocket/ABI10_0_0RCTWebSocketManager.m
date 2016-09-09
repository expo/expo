/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTDefines.h"

#if ABI10_0_0RCT_DEV // Only supported in dev mode

#import "ABI10_0_0RCTWebSocketManager.h"

#import "ABI10_0_0RCTConvert.h"
#import "ABI10_0_0RCTLog.h"
#import "ABI10_0_0RCTUtils.h"
#import "ABI10_0_0RCTSRWebSocket.h"

#pragma mark - ABI10_0_0RCTWebSocketObserver

@interface ABI10_0_0RCTWebSocketObserver : NSObject <ABI10_0_0RCTSRWebSocketDelegate> {
  NSURL *_url;
}

@property (nonatomic, strong) ABI10_0_0RCTSRWebSocket *socket;
@property (nonatomic, weak) id<ABI10_0_0RCTWebSocketProxyDelegate> delegate;
@property (nonatomic, strong) dispatch_semaphore_t socketOpenSemaphore;

- (instancetype)initWithURL:(NSURL *)url delegate:(id<ABI10_0_0RCTWebSocketProxyDelegate>)delegate;

@end

@implementation ABI10_0_0RCTWebSocketObserver

- (instancetype)initWithURL:(NSURL *)url delegate:(id<ABI10_0_0RCTWebSocketProxyDelegate>)delegate
{
  if ((self = [self init])) {
    _url = url;
    _delegate = delegate;
}
  return self;
}

- (void)start
{
  [self stop];
  _socket = [[ABI10_0_0RCTSRWebSocket alloc] initWithURL:_url];
  _socket.delegate = self;

  [_socket open];
}

- (void)stop
{
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (void)webSocket:(ABI10_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  if (_delegate) {
    NSError *error = nil;
    NSDictionary<NSString *, id> *msg = ABI10_0_0RCTJSONParse(message, &error);

    if (!error) {
      [_delegate socketProxy:[ABI10_0_0RCTWebSocketManager sharedInstance] didReceiveMessage:msg];
    } else {
      ABI10_0_0RCTLogError(@"WebSocketManager failed to parse message with error %@\n<message>\n%@\n</message>", error, message);
    }
  }
}

- (void)reconnect
{
  __weak ABI10_0_0RCTSRWebSocket *socket = _socket;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    // Only reconnect if the observer wasn't stoppped while we were waiting
    if (socket) {
      [self start];
    }
  });
}

- (void)webSocket:(ABI10_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [self reconnect];
}

- (void)webSocket:(ABI10_0_0RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  [self reconnect];
}

@end

#pragma mark - ABI10_0_0RCTWebSocketManager

@interface ABI10_0_0RCTWebSocketManager()

@property (nonatomic, strong) NSMutableDictionary *sockets;
@property (nonatomic, strong) dispatch_queue_t queue;

@end

@implementation ABI10_0_0RCTWebSocketManager

+ (instancetype)sharedInstance
{
  static ABI10_0_0RCTWebSocketManager *sharedInstance = nil;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
  });

  return sharedInstance;
}

- (void)setDelegate:(id<ABI10_0_0RCTWebSocketProxyDelegate>)delegate forURL:(NSURL *)url
{
  NSString *key = [url absoluteString];
  ABI10_0_0RCTWebSocketObserver *observer = _sockets[key];

  if (observer) {
    if (!delegate) {
      [observer stop];
      [_sockets removeObjectForKey:key];
    } else {
      observer.delegate = delegate;
    }
  } else {
    ABI10_0_0RCTWebSocketObserver *newObserver = [[ABI10_0_0RCTWebSocketObserver alloc] initWithURL:url delegate:delegate];
    [newObserver start];
    _sockets[key] = newObserver;
  }
}

- (instancetype)init
{
  if ((self = [super init])) {
    _sockets = [NSMutableDictionary new];
    _queue = dispatch_queue_create("com.facebook.ReactABI10_0_0.WebSocketManager", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

@end

#endif
