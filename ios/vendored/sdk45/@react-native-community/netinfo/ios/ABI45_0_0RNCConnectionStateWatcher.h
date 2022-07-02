/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI45_0_0RNCConnectionState.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI45_0_0RNCConnectionStateWatcher;


@protocol ABI45_0_0RNCConnectionStateWatcherDelegate

- (void)connectionStateWatcher:(ABI45_0_0RNCConnectionStateWatcher *)connectionStateWatcher didUpdateState:(ABI45_0_0RNCConnectionState *)state;

@end

@interface ABI45_0_0RNCConnectionStateWatcher : NSObject

- (instancetype)initWithDelegate:(id<ABI45_0_0RNCConnectionStateWatcherDelegate>)delegate;
- (ABI45_0_0RNCConnectionState *)currentState;

@end

NS_ASSUME_NONNULL_END
