/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI20_0_0/ABI20_0_0RCTInvalidating.h>
#import <ReactABI20_0_0/ABI20_0_0RCTURLRequestHandler.h>

/**
 * This is the default ABI20_0_0RCTURLRequestHandler implementation for HTTP requests.
 */
@interface ABI20_0_0RCTHTTPRequestHandler : NSObject <ABI20_0_0RCTURLRequestHandler, ABI20_0_0RCTInvalidating>

@end
