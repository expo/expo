/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTInvalidating.h>
#import <ABI40_0_0React/ABI40_0_0RCTURLRequestHandler.h>

/**
 * This is the default ABI40_0_0RCTURLRequestHandler implementation for file requests.
 */
@interface ABI40_0_0RCTFileRequestHandler : NSObject <ABI40_0_0RCTURLRequestHandler, ABI40_0_0RCTInvalidating>

@end
