/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI29_0_0/ABI29_0_0RCTEventEmitter.h>
#import <ReactABI29_0_0/ABI29_0_0RCTNetworkTask.h>

@protocol ABI29_0_0RCTNetworkingRequestHandler <NSObject>

// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (BOOL)canHandleNetworkingRequest:(NSDictionary *)data;
// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (NSDictionary *)handleNetworkingRequest:(NSDictionary *)data;

@end

@protocol ABI29_0_0RCTNetworkingResponseHandler <NSObject>

- (BOOL)canHandleNetworkingResponse:(NSString *)responseType;
- (id)handleNetworkingResponse:(NSURLResponse *)response data:(NSData *)data;

@end

@interface ABI29_0_0RCTNetworking : ABI29_0_0RCTEventEmitter

/**
 * Does a handler exist for the specified request?
 */
- (BOOL)canHandleRequest:(NSURLRequest *)request;

/**
 * Return an ABI29_0_0RCTNetworkTask for the specified request. This is useful for
 * invoking the ReactABI29_0_0 Native networking stack from within native code.
 */
- (ABI29_0_0RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                           completionBlock:(ABI29_0_0RCTURLRequestCompletionBlock)completionBlock;

- (void)addRequestHandler:(id<ABI29_0_0RCTNetworkingRequestHandler>)handler;

- (void)addResponseHandler:(id<ABI29_0_0RCTNetworkingResponseHandler>)handler;

- (void)removeRequestHandler:(id<ABI29_0_0RCTNetworkingRequestHandler>)handler;

- (void)removeResponseHandler:(id<ABI29_0_0RCTNetworkingResponseHandler>)handler;

@end

@interface ABI29_0_0RCTBridge (ABI29_0_0RCTNetworking)

@property (nonatomic, readonly) ABI29_0_0RCTNetworking *networking;

@end
