/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI19_0_0/ABI19_0_0RCTDefines.h>

#if ABI19_0_0RCT_DEV

@class ABI19_0_0RCTBridge;
@protocol ABI19_0_0RCTPackagerClientMethod;

/**
 * Encapsulates connection to ReactABI19_0_0 Native packager
 */
@interface ABI19_0_0RCTPackagerConnection : NSObject

- (instancetype)initWithBridge:(ABI19_0_0RCTBridge *)bridge;
- (void)addHandler:(id<ABI19_0_0RCTPackagerClientMethod>)handler forMethod:(NSString *)name;

@end

#endif
