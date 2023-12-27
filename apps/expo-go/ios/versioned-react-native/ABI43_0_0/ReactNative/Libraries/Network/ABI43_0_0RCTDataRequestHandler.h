/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTInvalidating.h>
#import <ABI43_0_0React/ABI43_0_0RCTURLRequestHandler.h>

/**
 * This is the default ABI43_0_0RCTURLRequestHandler implementation for data URL requests.
 */
@interface ABI43_0_0RCTDataRequestHandler : NSObject <ABI43_0_0RCTURLRequestHandler, ABI43_0_0RCTInvalidating>

@end
