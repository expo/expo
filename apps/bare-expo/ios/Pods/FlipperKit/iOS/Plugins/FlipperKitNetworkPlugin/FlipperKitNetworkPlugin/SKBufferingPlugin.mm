/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import <vector>

#import <FlipperKit/FlipperConnection.h>
#import "SKBufferingPlugin+CPPInitialization.h"
#import "SKBufferingPlugin.h"
#import "SKDispatchQueue.h"

static const NSUInteger bufferSize = 500;

@interface SKBufferingPlugin ()

@property(assign, nonatomic) std::vector<CachedEvent> ringBuffer;
@property(assign, nonatomic) std::shared_ptr<facebook::flipper::DispatchQueue>
    connectionAccessQueue;
@property(strong, nonatomic) id<FlipperConnection> connection;

@end

@implementation SKBufferingPlugin
// {
//   std::vector<CachedEvent> _ringBuffer;
//   std::shared_ptr<facebook::flipper::DispatchQueue> _connectionAccessQueue;
//
//   id<FlipperConnection> _connection;
// }

- (instancetype)initWithQueue:(dispatch_queue_t)queue {
  if (self = [super init]) {
    _ringBuffer.reserve(bufferSize);
    _connectionAccessQueue =
        std::make_shared<facebook::flipper::GCDQueue>(queue);
  }
  return self;
}

- (NSString*)identifier {
  // Note: This must match with the javascript pulgin identifier!!
  return @"Network";
}

- (void)didConnect:(id<FlipperConnection>)connection {
  _connectionAccessQueue->async(^{
    self->_connection = connection;
    [self sendBufferedEvents];
  });
}

- (void)didDisconnect {
  _connectionAccessQueue->async(^{
    self->_connection = nil;
  });
}

- (BOOL)runInBackground {
  return YES;
}

- (void)send:(NSString*)method
    sonarObject:(NSDictionary<NSString*, id>*)sonarObject {
  _connectionAccessQueue->async(^{
    if (self->_connection) {
      [self->_connection send:method withParams:sonarObject];
    } else {
      if (self->_ringBuffer.size() == bufferSize) {
        return;
      }
      self->_ringBuffer.push_back(
          {.method = method, .sonarObject = sonarObject});
    }
  });
}

- (void)sendBufferedEvents {
  NSAssert(_connection, @"connection object cannot be nil");
  for (const auto& event : _ringBuffer) {
    [_connection send:event.method withParams:event.sonarObject];
  }
  _ringBuffer.clear();
}

@end

@implementation SKBufferingPlugin (CPPInitialization)

- (instancetype)initWithVectorEventSize:(NSUInteger)size
                  connectionAccessQueue:
                      (std::shared_ptr<facebook::flipper::DispatchQueue>)
                          connectionAccessQueue {
  if (self = [super init]) {
    _ringBuffer.reserve(size);
    _connectionAccessQueue = connectionAccessQueue;
  }
  return self;
}
- (instancetype)initWithDispatchQueue:
    (std::shared_ptr<facebook::flipper::DispatchQueue>)queue {
  return [self initWithVectorEventSize:bufferSize connectionAccessQueue:queue];
}

@end

#endif
