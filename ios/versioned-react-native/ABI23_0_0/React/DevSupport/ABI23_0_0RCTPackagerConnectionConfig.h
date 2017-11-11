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

NS_ASSUME_NONNULL_BEGIN

@protocol ABI23_0_0RCTPackagerClientMethod;

@protocol ABI23_0_0RCTPackagerConnectionConfig

@property (nonatomic, copy, readonly) NSURL *packagerURL;
@property (nonatomic, copy, readonly) NSDictionary<NSString *, id<ABI23_0_0RCTPackagerClientMethod>> *defaultPackagerMethods;

@end

NS_ASSUME_NONNULL_END

#endif
