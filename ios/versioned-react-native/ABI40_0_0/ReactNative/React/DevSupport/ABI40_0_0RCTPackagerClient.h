/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTDefines.h>

#if ABI40_0_0RCT_DEV // Only supported in dev mode

@class ABI40_0_0RCTPackagerClientResponder;
@class ABI40_0_0RCTReconnectingWebSocket;

#if defined(__cplusplus)
extern "C" {
#endif

extern const int ABI40_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION;

#if defined(__cplusplus)
}
#endif

@protocol ABI40_0_0RCTPackagerClientMethod <NSObject>

- (void)handleRequest:(NSDictionary<NSString *, id> *)params withResponder:(ABI40_0_0RCTPackagerClientResponder *)responder;
- (void)handleNotification:(NSDictionary<NSString *, id> *)params;

@optional

/** By default object will receive its methods on the main queue, unless this method is overridden. */
- (dispatch_queue_t)methodQueue;

@end

@interface ABI40_0_0RCTPackagerClientResponder : NSObject

- (instancetype)initWithId:(id)msgId socket:(ABI40_0_0RCTReconnectingWebSocket *)socket;
- (void)respondWithResult:(id)result;
- (void)respondWithError:(id)error;

@end

#endif
