/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI47_0_0RNCConnectionState.h"

NS_ASSUME_NONNULL_BEGIN

@class ABI47_0_0RNCConnectionStateWatcher;


@protocol ABI47_0_0RNCConnectionStateWatcherDelegate

- (void)connectionStateWatcher:(ABI47_0_0RNCConnectionStateWatcher *)connectionStateWatcher didUpdateState:(ABI47_0_0RNCConnectionState *)state;

@end

@interface ABI47_0_0RNCConnectionStateWatcher : NSObject

- (instancetype)initWithDelegate:(id<ABI47_0_0RNCConnectionStateWatcherDelegate>)delegate;
- (ABI47_0_0RNCConnectionState *)currentState;

@end

NS_ASSUME_NONNULL_END
