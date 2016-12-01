/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class ABI12_0_0RCTJSStackFrame;

/**
 * An ObjC wrapper for ReactABI12_0_0 Native errors.
 */
@interface ABI12_0_0RCTErrorInfo : NSObject
@property (nonatomic, copy, readonly) NSString *errorMessage;
@property (nonatomic, copy, readonly) NSArray<ABI12_0_0RCTJSStackFrame *> *stack;


- (instancetype)initWithErrorMessage:(NSString *)errorMessage
                               stack:(NSArray<ABI12_0_0RCTJSStackFrame *> *)stack;

@end
