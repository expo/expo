/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FKPortForwardingServer.h"

#import <UIKit/UIKit.h>

#import <CocoaAsyncSocket/GCDAsyncSocket.h>
#import <peertalk/PTChannel.h>

#import "FKPortForwardingCommon.h"

@interface FKPortForwardingServer ()<
    PTChannelDelegate,
    GCDAsyncSocketDelegate> {
  __weak PTChannel* _serverChannel;
  __weak PTChannel* _peerChannel;

  GCDAsyncSocket* _serverSocket;
  NSMutableDictionary* _clientSockets;
  UInt32 _lastClientSocketTag;
  dispatch_queue_t _socketQueue;
  PTProtocol* _protocol;
}

@end

@implementation FKPortForwardingServer

- (instancetype)init {
  if (self = [super init]) {
    _socketQueue =
        dispatch_queue_create("FKPortForwardingServer", DISPATCH_QUEUE_SERIAL);
    _lastClientSocketTag = 0;
    _clientSockets = [NSMutableDictionary dictionary];
    _protocol = [[PTProtocol alloc] initWithDispatchQueue:_socketQueue];
  }
  return self;
}

- (void)dealloc {
  [self close];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)forwardConnectionsFromPort:(NSUInteger)port {
  [self _forwardConnectionsFromPort:port reportError:YES];
  [[NSNotificationCenter defaultCenter]
      addObserverForName:UIApplicationDidBecomeActiveNotification
                  object:nil
                   queue:nil
              usingBlock:^(NSNotification* note) {
                [self _forwardConnectionsFromPort:port reportError:NO];
              }];
}

- (void)_forwardConnectionsFromPort:(NSUInteger)port
                        reportError:(BOOL)shouldReportError {
  GCDAsyncSocket* serverSocket =
      [[GCDAsyncSocket alloc] initWithDelegate:self delegateQueue:_socketQueue];
  NSError* listenError;
  if ([serverSocket acceptOnPort:port error:&listenError]) {
    _serverSocket = serverSocket;
  } else {
    if (shouldReportError) {
      FBPFLog(@"Failed to listen: %@", listenError);
    }
  }
}

- (void)listenForMultiplexingChannelOnPort:(NSUInteger)port {
  [self _listenForMultiplexingChannelOnPort:port reportError:YES];
  [[NSNotificationCenter defaultCenter]
      addObserverForName:UIApplicationDidBecomeActiveNotification
                  object:nil
                   queue:nil
              usingBlock:^(NSNotification* note) {
                [self _listenForMultiplexingChannelOnPort:port reportError:NO];
              }];
}

- (void)_listenForMultiplexingChannelOnPort:(NSUInteger)port
                                reportError:(BOOL)shouldReportError {
  PTChannel* channel = [[PTChannel alloc] initWithProtocol:_protocol
                                                  delegate:self];
  [channel
      listenOnPort:port
       IPv4Address:INADDR_LOOPBACK
          callback:^(NSError* error) {
            if (error) {
              if (shouldReportError) {
                FBPFLog(
                    @"Failed to listen on 127.0.0.1:%lu: %@",
                    (unsigned long)port,
                    error);
              }
            } else {
              FBPFTrace(@"Listening on 127.0.0.1:%lu", (unsigned long)port);
              self->_serverChannel = channel;
            }
          }];
}

- (void)close {
  if (_serverChannel) {
    [_serverChannel close];
    _serverChannel = nil;
  }
  [_serverSocket disconnect];
}

#pragma mark - PTChannelDelegate

- (void)ioFrameChannel:(PTChannel*)channel
    didAcceptConnection:(PTChannel*)otherChannel
            fromAddress:(PTAddress*)address {
  // Cancel any other connection. We are FIFO, so the last connection
  // established will cancel any previous connection and "take its place".
  if (_peerChannel) {
    [_peerChannel cancel];
  }

  // Weak pointer to current connection. Connection objects live by themselves
  // (owned by its parent dispatch queue) until they are closed.
  _peerChannel = otherChannel;
  _peerChannel.userInfo = address;
  FBPFTrace(@"Connected to %@", address);
}

- (void)ioFrameChannel:(PTChannel*)channel
    didReceiveFrameOfType:(uint32_t)type
                      tag:(uint32_t)tag
                  payload:(PTData*)payload {
  // NSLog(@"didReceiveFrameOfType: %u, %u, %@", type, tag, payload);
  if (type == FKPortForwardingFrameTypeWriteToPipe) {
    GCDAsyncSocket* sock = _clientSockets[@(tag)];
    [sock writeData:[NSData dataWithBytes:payload.data length:payload.length]
        withTimeout:-1
                tag:0];
    FBPFTrace(@"channel -> socket (%d), %zu bytes", tag, payload.length);
  }

  if (type == FKPortForwardingFrameTypeClosePipe) {
    GCDAsyncSocket* sock = _clientSockets[@(tag)];
    [sock disconnectAfterWriting];
  }
}

- (void)ioFrameChannel:(PTChannel*)channel didEndWithError:(NSError*)error {
  for (GCDAsyncSocket* sock in [_clientSockets objectEnumerator]) {
    [sock setDelegate:nil];
    [sock disconnect];
  }
  [_clientSockets removeAllObjects];
  FBPFTrace(@"Disconnected from %@, error = %@", channel.userInfo, error);
}

#pragma mark - GCDAsyncSocketDelegate

- (void)socket:(GCDAsyncSocket*)sock
    didAcceptNewSocket:(GCDAsyncSocket*)newSocket {
  dispatch_block_t block = ^() {
    if (!self->_peerChannel) {
      [newSocket setDelegate:nil];
      [newSocket disconnect];
    }

    UInt32 tag = ++self->_lastClientSocketTag;
    newSocket.userData = @(tag);
    newSocket.delegate = self;
    self->_clientSockets[@(tag)] = newSocket;
    [self->_peerChannel
        sendFrameOfType:FKPortForwardingFrameTypeOpenPipe
                    tag:self->_lastClientSocketTag
            withPayload:nil
               callback:^(NSError* error) {
                 FBPFTrace(
                     @"open socket (%d), error = %@", (unsigned int)tag, error);
                 [newSocket readDataWithTimeout:-1 tag:0];
               }];
  };

  if (_peerChannel) {
    block();
  } else {
    dispatch_after(
        dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1 * NSEC_PER_SEC)),
        _socketQueue,
        block);
  }
}

- (void)socket:(GCDAsyncSocket*)sock didReadData:(NSData*)data withTag:(long)_ {
  UInt32 tag = [[sock userData] unsignedIntValue];
  FBPFTrace(
      @"Incoming data on socket (%d) - %lu bytes",
      (unsigned int)tag,
      (unsigned long)data.length);
  [_peerChannel sendFrameOfType:FKPortForwardingFrameTypeWriteToPipe
                            tag:tag
                    withPayload:NSDataToGCDData(data)
                       callback:^(NSError* error) {
                         FBPFTrace(
                             @"socket (%d) -> channel %lu bytes, error = %@",
                             (unsigned int)tag,
                             (unsigned long)data.length,
                             error);
                         [sock readDataWithTimeout:-1 tag:_];
                       }];
}

- (void)socketDidDisconnect:(GCDAsyncSocket*)sock withError:(NSError*)err {
  UInt32 tag = [sock.userData unsignedIntValue];
  [_clientSockets removeObjectForKey:@(tag)];
  [_peerChannel
      sendFrameOfType:FKPortForwardingFrameTypeClosePipe
                  tag:tag
          withPayload:nil
             callback:^(NSError* error) {
               FBPFTrace(
                   @"socket (%d) disconnected, err = %@, peer error = %@",
                   (unsigned int)tag,
                   err,
                   error);
             }];
}

@end
