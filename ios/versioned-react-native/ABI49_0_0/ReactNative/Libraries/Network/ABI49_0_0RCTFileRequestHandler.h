/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTInvalidating.h>
#import <ABI49_0_0React/ABI49_0_0RCTURLRequestHandler.h>

/**
 * This is the default ABI49_0_0RCTURLRequestHandler implementation for file requests.
 */
@interface ABI49_0_0RCTFileRequestHandler : NSObject <ABI49_0_0RCTURLRequestHandler, ABI49_0_0RCTInvalidating>

@end
