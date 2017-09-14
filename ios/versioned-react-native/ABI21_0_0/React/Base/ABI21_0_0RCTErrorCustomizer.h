/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class ABI21_0_0RCTErrorInfo;

/**
 * Provides an interface to customize ReactABI21_0_0 Native error messages and stack
 * traces from exceptions.
 */
@protocol ABI21_0_0RCTErrorCustomizer <NSObject>

/**
 * Customizes the given error, returning the passed info argument if no
 * customization is required.
 */
- (nonnull ABI21_0_0RCTErrorInfo *)customizeErrorInfo:(nonnull ABI21_0_0RCTErrorInfo *)info;
@end
