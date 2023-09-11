/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTInvalidating.h>
#import <ABI48_0_0React/ABI48_0_0RCTURLRequestHandler.h>

/**
 * This is the default ABI48_0_0RCTURLRequestHandler implementation for data URL requests.
 */
@interface ABI48_0_0RCTDataRequestHandler : NSObject <ABI48_0_0RCTURLRequestHandler, ABI48_0_0RCTInvalidating>

@end
