/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "RNCConnectionState.h"

NS_ASSUME_NONNULL_BEGIN

@class RNCConnectionStateWatcher;


@protocol RNCConnectionStateWatcherDelegate

- (void)connectionStateWatcher:(RNCConnectionStateWatcher *)connectionStateWatcher didUpdateState:(RNCConnectionState *)state;

@end

@interface RNCConnectionStateWatcher : NSObject

- (instancetype)initWithDelegate:(id<RNCConnectionStateWatcherDelegate>)delegate;
- (RNCConnectionState *)currentState;

@end

NS_ASSUME_NONNULL_END
