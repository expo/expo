/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTEventEmitter.h>
#import <ABI49_0_0React/ABI49_0_0RCTNetworkTask.h>
#import <ABI49_0_0React/ABI49_0_0RCTURLRequestHandler.h>

@protocol ABI49_0_0RCTNetworkingRequestHandler <NSObject>

// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (BOOL)canHandleNetworkingRequest:(NSDictionary *)data;
// @lint-ignore FBOBJCUNTYPEDCOLLECTION1
- (NSDictionary *)handleNetworkingRequest:(NSDictionary *)data;

@end

@protocol ABI49_0_0RCTNetworkingResponseHandler <NSObject>

- (BOOL)canHandleNetworkingResponse:(NSString *)responseType;
- (id)handleNetworkingResponse:(NSURLResponse *)response data:(NSData *)data;

@end

@interface ABI49_0_0RCTNetworking : ABI49_0_0RCTEventEmitter

/**
 * Allows ABI49_0_0RCTNetworking instances to be initialized with handlers.
 * The handlers will be requested via the bridge's moduleForName method when required.
 */
- (instancetype)initWithHandlersProvider:(NSArray<id<ABI49_0_0RCTURLRequestHandler>> * (^)(ABI49_0_0RCTModuleRegistry *))getHandlers;

/**
 * Does a handler exist for the specified request?
 */
- (BOOL)canHandleRequest:(NSURLRequest *)request;

/**
 * Return an ABI49_0_0RCTNetworkTask for the specified request. This is useful for
 * invoking the ABI49_0_0React Native networking stack from within native code.
 */
- (ABI49_0_0RCTNetworkTask *)networkTaskWithRequest:(NSURLRequest *)request
                           completionBlock:(ABI49_0_0RCTURLRequestCompletionBlock)completionBlock;

- (void)addRequestHandler:(id<ABI49_0_0RCTNetworkingRequestHandler>)handler;

- (void)addResponseHandler:(id<ABI49_0_0RCTNetworkingResponseHandler>)handler;

- (void)removeRequestHandler:(id<ABI49_0_0RCTNetworkingRequestHandler>)handler;

- (void)removeResponseHandler:(id<ABI49_0_0RCTNetworkingResponseHandler>)handler;

@end

@interface ABI49_0_0RCTBridge (ABI49_0_0RCTNetworking)

@property (nonatomic, readonly) ABI49_0_0RCTNetworking *networking;

@end

// HACK: When uploading images/video from PHAssetLibrary, we change the URL scheme to be
// ph-upload://. This is to ensure that we upload a full video when given a ph-upload:// URL,
// instead of just the thumbnail. Consider the following problem:
// The user has a video in their camera roll with URL ph://1B3E2DDB-0AD3-4E33-A7A1-9F4AA9A762AA/L0/001
// 1. We want to display that video in an <Image> and show the thumbnail
// 2. We later want to upload that video.
// At this point, if we use the same URL for both uses, there is no way to distinguish the intent
// and we will either upload the thumbnail (bad!) or try to show the video in an <Image> (bad!).
// Our solution is to change the URL scheme in the uploader.
extern NSString *const ABI49_0_0RCTNetworkingPHUploadHackScheme;
