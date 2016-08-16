/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTURLRequestHandler.h"
#import "ABI7_0_0RCTInvalidating.h"

/**
 * This is the default ABI7_0_0RCTURLRequestHandler implementation for HTTP requests.
 */
@interface ABI7_0_0RCTHTTPRequestHandler : NSObject <ABI7_0_0RCTURLRequestHandler, ABI7_0_0RCTInvalidating>

@end
