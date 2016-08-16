/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTDefines.h"

#if ABI7_0_0RCT_DEV // Only supported in dev mode

#import "ABI7_0_0RCTWebSocketManager.h"

#import "ABI7_0_0RCTConvert.h"
#import "ABI7_0_0RCTLog.h"
#import "ABI7_0_0RCTUtils.h"
#import "ABI7_0_0RCTSRWebSocket.h"

#pragma mark - ABI7_0_0RCTWebSocketObserver

@interface ABI7_0_0RCTWebSocketObserver : NSObject <ABI7_0_0RCTSRWebSocketDelegate>

@property (nonatomic, strong) ABI7_0_0RCTSRWebSocket *socket;
@property (nonatomic, weak) id<ABI7_0_0RCTWebSocketProxyDelegate> delegate;
@property (nonatomic, strong) dispatch_semaphore_t socketOpenSemaphore;

- (instancetype)initWithURL:(NSURL *)url delegate:(id<ABI7_0_0RCTWebSocketProxyDelegate>)delegate;

@end

@implementation ABI7_0_0RCTWebSocketObserver

- (instancetype)initWithURL:(NSURL *)url delegate:(id<ABI7_0_0RCTWebSocketProxyDelegate>)delegate
{
  if ((self = [self init])) {
    _socket = [[ABI7_0_0RCTSRWebSocket alloc] initWithURL:url];
    _socket.delegate = self;

    _delegate = delegate;
}
  return self;
}

- (void)start
{
  _socketOpenSemaphore = dispatch_semaphore_create(0);
  [_socket open];
  dispatch_semaphore_wait(_socketOpenSemaphore, dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC * 2));
}

- (void)stop
{
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (void)webSocket:(ABI7_0_0RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  if (_delegate) {
    NSError *error = nil;
    NSDictionary<NSString *, id> *msg = ABI7_0_0RCTJSONParse(message, &error);

    if (!error) {
      [_delegate socketProxy:[ABI7_0_0RCTWebSocketManager sharedInstance] didReceiveMessage:msg];
    } else {
      ABI7_0_0RCTLogError(@"WebSocketManager failed to parse message with error %@\n<message>\n%@\n</message>", error, message);
    }
  }
}

- (void)webSocketDidOpen:(ABI7_0_0RCTSRWebSocket *)webSocket
{
  dispatch_semaphore_signal(_socketOpenSemaphore);
}

- (void)webSocket:(ABI7_0_0RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  dispatch_semaphore_signal(_socketOpenSemaphore);
  dispatch_async(dispatch_get_main_queue(), ^{
    // Give the setUp method an opportunity to report an error first
    ABI7_0_0RCTLogError(@"WebSocket connection failed with error %@", error);
  });
}

@end

#pragma mark - ABI7_0_0RCTWebSocketManager

@interface ABI7_0_0RCTWebSocketManager()

@property (nonatomic, strong) NSMutableDictionary *sockets;
@property (nonatomic, strong) dispatch_queue_t queue;

@end

@implementation ABI7_0_0RCTWebSocketManager

+ (instancetype)sharedInstance
{
  static ABI7_0_0RCTWebSocketManager *sharedInstance = nil;
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
  });

  return sharedInstance;
}

- (void)setDelegate:(id<ABI7_0_0RCTWebSocketProxyDelegate>)delegate forURL:(NSURL *)url
{
  NSString *key = [url absoluteString];
  ABI7_0_0RCTWebSocketObserver *observer = _sockets[key];

  if (observer) {
    if (!delegate) {
      [observer stop];
      [_sockets removeObjectForKey:key];
    } else {
      observer.delegate = delegate;
    }
  } else {
    ABI7_0_0RCTWebSocketObserver *newObserver = [[ABI7_0_0RCTWebSocketObserver alloc] initWithURL:url delegate:delegate];
    [newObserver start];
    _sockets[key] = newObserver;
  }
}

- (instancetype)init
{
  if ((self = [super init])) {
    _sockets = [NSMutableDictionary new];
    _queue = dispatch_queue_create("com.facebook.ReactABI7_0_0.WebSocketManager", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

@end

#endif
