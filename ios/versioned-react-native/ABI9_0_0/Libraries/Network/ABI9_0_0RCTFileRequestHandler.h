/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTURLRequestHandler.h"
#import "ABI9_0_0RCTInvalidating.h"

/**
 * This is the default ABI9_0_0RCTURLRequestHandler implementation for file requests.
 */
@interface ABI9_0_0RCTFileRequestHandler : NSObject <ABI9_0_0RCTURLRequestHandler, ABI9_0_0RCTInvalidating>

@end
