/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI18_0_0/ABI18_0_0RCTEventEmitter.h>
#import <ReactABI18_0_0/ABI18_0_0RCTNetworkTask.h>

@interface ABI18_0_0RCTNetworking : ABI18_0_0RCTEventEmitter

/**
 * Does a handler exist for the specified request?
 */
- (BOOL)canHandleRequest:(NSURLRequest *)request;

/**
 * Return an ABI18_0_0RCTNetworkTask for the specified request. This is useful for
 * invoking the ReactABI18_0_0 Native networking stack from within native code.
 */
- (ABI18_0_0RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                           completionBlock:(ABI18_0_0RCTURLRequestCompletionBlock)completionBlock;

@end

@interface ABI18_0_0RCTBridge (ABI18_0_0RCTNetworking)

@property (nonatomic, readonly) ABI18_0_0RCTNetworking *networking;

@end
