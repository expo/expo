/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>

@protocol ABI31_0_0RCTExceptionsManagerDelegate <NSObject>

- (void)handleSoftJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;
- (void)handleFatalJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;

@optional
- (void)updateJSExceptionWithMessage:(NSString *)message stack:(NSArray *)stack exceptionId:(NSNumber *)exceptionId;

@end

@interface ABI31_0_0RCTExceptionsManager : NSObject <ABI31_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI31_0_0RCTExceptionsManagerDelegate>)delegate;

- (void)reportSoftException:(NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(nonnull NSNumber *)exceptionId;
- (void)reportFatalException:(NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(nonnull NSNumber *)exceptionId;

@property (nonatomic, weak) id<ABI31_0_0RCTExceptionsManagerDelegate> delegate;

@property (nonatomic, assign) NSUInteger maxReloadAttempts;

@end
