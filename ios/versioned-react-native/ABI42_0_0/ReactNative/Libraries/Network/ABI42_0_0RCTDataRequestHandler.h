/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTInvalidating.h>
#import <ABI42_0_0React/ABI42_0_0RCTURLRequestHandler.h>

/**
 * This is the default ABI42_0_0RCTURLRequestHandler implementation for data URL requests.
 */
@interface ABI42_0_0RCTDataRequestHandler : NSObject <ABI42_0_0RCTURLRequestHandler, ABI42_0_0RCTInvalidating>

@end
