/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTInvalidating.h>
#import <ABI46_0_0React/ABI46_0_0RCTURLRequestHandler.h>

/**
 * This is the default ABI46_0_0RCTURLRequestHandler implementation for data URL requests.
 */
@interface ABI46_0_0RCTDataRequestHandler : NSObject <ABI46_0_0RCTURLRequestHandler, ABI46_0_0RCTInvalidating>

@end
