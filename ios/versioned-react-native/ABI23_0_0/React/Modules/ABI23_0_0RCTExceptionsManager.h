/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>

@protocol ABI23_0_0RCTExceptionsManagerDelegate <NSObject>

- (void)handleSoftJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;
- (void)handleFatalJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;

@optional
- (void)updateJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;

@end

@interface ABI23_0_0RCTExceptionsManager : NSObject <ABI23_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI23_0_0RCTExceptionsManagerDelegate>)delegate;

@property (nonatomic, weak) id<ABI23_0_0RCTExceptionsManagerDelegate> delegate;

@property (nonatomic, assign) NSUInteger maxReloadAttempts;

@end
