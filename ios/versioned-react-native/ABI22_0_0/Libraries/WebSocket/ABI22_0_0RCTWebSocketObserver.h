/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI22_0_0/ABI22_0_0RCTDefines.h>

#if ABI22_0_0RCT_DEV // Only supported in dev mode

@protocol ABI22_0_0RCTWebSocketObserverDelegate

- (void)didReceiveWebSocketMessage:(NSDictionary<NSString *, id> *)message;

@end

@interface ABI22_0_0RCTWebSocketObserver : NSObject

- (instancetype)initWithURL:(NSURL *)url;
- (void)setDelegateDispatchQueue:(dispatch_queue_t)queue;

@property (nonatomic, weak) id<ABI22_0_0RCTWebSocketObserverDelegate> delegate;

- (void)start;
- (void)stop;

@end

#endif
