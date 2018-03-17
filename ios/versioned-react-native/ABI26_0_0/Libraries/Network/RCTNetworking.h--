/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI26_0_0/ABI26_0_0RCTEventEmitter.h>
#import <ReactABI26_0_0/ABI26_0_0RCTNetworkTask.h>

@protocol ABI26_0_0RCTNetworkingRequestHandler <NSObject>

// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (BOOL)canHandleNetworkingRequest:(NSDictionary *)data;
// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (NSDictionary *)handleNetworkingRequest:(NSDictionary *)data;

@end

@protocol ABI26_0_0RCTNetworkingResponseHandler <NSObject>

- (BOOL)canHandleNetworkingResponse:(NSString *)responseType;
- (id)handleNetworkingResponse:(NSURLResponse *)response data:(NSData *)data;

@end

@interface ABI26_0_0RCTNetworking : ABI26_0_0RCTEventEmitter

/**
 * Does a handler exist for the specified request?
 */
- (BOOL)canHandleRequest:(NSURLRequest *)request;

/**
 * Return an ABI26_0_0RCTNetworkTask for the specified request. This is useful for
 * invoking the ReactABI26_0_0 Native networking stack from within native code.
 */
- (ABI26_0_0RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                           completionBlock:(ABI26_0_0RCTURLRequestCompletionBlock)completionBlock;

- (void)addRequestHandler:(id<ABI26_0_0RCTNetworkingRequestHandler>)handler;

- (void)addResponseHandler:(id<ABI26_0_0RCTNetworkingResponseHandler>)handler;

- (void)removeRequestHandler:(id<ABI26_0_0RCTNetworkingRequestHandler>)handler;

- (void)removeResponseHandler:(id<ABI26_0_0RCTNetworkingResponseHandler>)handler;

@end

@interface ABI26_0_0RCTBridge (ABI26_0_0RCTNetworking)

@property (nonatomic, readonly) ABI26_0_0RCTNetworking *networking;

@end
