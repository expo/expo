/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI48_0_0RCTExceptionsManagerDelegate <NSObject>

- (void)handleSoftJSExceptionWithMessage:(nullable NSString *)message
                                   stack:(nullable NSArray *)stack
                             exceptionId:(NSNumber *)exceptionId
                         extraDataAsJSON:(nullable NSString *)extraDataAsJSON;
- (void)handleFatalJSExceptionWithMessage:(nullable NSString *)message
                                    stack:(nullable NSArray *)stack
                              exceptionId:(NSNumber *)exceptionId
                          extraDataAsJSON:(nullable NSString *)extraDataAsJSON;

@optional
- (void)updateJSExceptionWithMessage:(nullable NSString *)message
                               stack:(nullable NSArray *)stack
                         exceptionId:(NSNumber *)exceptionId;

@end

@interface ABI48_0_0RCTExceptionsManager : NSObject <ABI48_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI48_0_0RCTExceptionsManagerDelegate>)delegate;

- (void)reportSoftException:(nullable NSString *)message
                      stack:(nullable NSArray<NSDictionary *> *)stack
                exceptionId:(double)exceptionId;
- (void)reportFatalException:(nullable NSString *)message
                       stack:(nullable NSArray<NSDictionary *> *)stack
                 exceptionId:(double)exceptionId;
- (void)reportJsException:(nullable NSString *)message
                    stack:(nullable NSArray<NSDictionary *> *)stack
              exceptionId:(double)exceptionId
                  isFatal:(bool)isFatal;

@property (nonatomic, weak) id<ABI48_0_0RCTExceptionsManagerDelegate> delegate;

@property (nonatomic, assign) NSUInteger maxReloadAttempts;

@end

NS_ASSUME_NONNULL_END
