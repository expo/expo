/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@class ABI47_0_0RCTErrorInfo;

/**
 * Provides an interface to customize ABI47_0_0React Native error messages and stack
 * traces from exceptions.
 */
@protocol ABI47_0_0RCTErrorCustomizer <NSObject>

/**
 * Customizes the given error, returning the passed info argument if no
 * customization is required.
 */
- (nonnull ABI47_0_0RCTErrorInfo *)customizeErrorInfo:(nonnull ABI47_0_0RCTErrorInfo *)info;
@end
