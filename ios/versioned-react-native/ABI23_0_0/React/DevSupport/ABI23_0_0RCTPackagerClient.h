/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI23_0_0/ABI23_0_0RCTDefines.h>

#if ABI23_0_0RCT_DEV // Only supported in dev mode

@class ABI23_0_0RCTPackagerClientResponder;
@class ABI23_0_0RCTSRWebSocket;

extern const int ABI23_0_0RCT_PACKAGER_CLIENT_PROTOCOL_VERSION;

@protocol ABI23_0_0RCTPackagerClientMethod <NSObject>

- (void)handleRequest:(id)params withResponder:(ABI23_0_0RCTPackagerClientResponder *)responder;
- (void)handleNotification:(id)params;

@optional

/** By default object will receive its methods on the main queue, unless this method is overriden. */
- (dispatch_queue_t)methodQueue;

@end

@interface ABI23_0_0RCTPackagerClientResponder : NSObject

- (instancetype)initWithId:(id)msgId socket:(ABI23_0_0RCTSRWebSocket *)socket;
- (void)respondWithResult:(id)result;
- (void)respondWithError:(id)error;

@end

#endif
