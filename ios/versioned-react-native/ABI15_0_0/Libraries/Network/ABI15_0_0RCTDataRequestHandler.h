/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI15_0_0/ABI15_0_0RCTInvalidating.h>
#import <ReactABI15_0_0/ABI15_0_0RCTURLRequestHandler.h>

/**
 * This is the default ABI15_0_0RCTURLRequestHandler implementation for data URL requests.
 */
@interface ABI15_0_0RCTDataRequestHandler : NSObject <ABI15_0_0RCTURLRequestHandler, ABI15_0_0RCTInvalidating>

@end
