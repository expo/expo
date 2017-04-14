/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI16_0_0/ABI16_0_0RCTDefines.h>
#import <ReactABI16_0_0/ABI16_0_0RCTPackagerClientResponder.h>

#if ABI16_0_0RCT_DEV // Only supported in dev mode

@protocol ABI16_0_0RCTPackagerClientMethod

- (void)handleRequest:(id)params withResponder:(ABI16_0_0RCTPackagerClientResponder *)responder;
- (void)handleNotification:(id)params;

@end

@interface ABI16_0_0RCTPackagerClient : NSObject

- (instancetype)initWithURL:(NSURL *)url;
- (void)addHandler:(id<ABI16_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)name;
- (void)start;
- (void)stop;

@end

#endif
