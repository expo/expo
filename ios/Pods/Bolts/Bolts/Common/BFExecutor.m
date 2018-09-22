/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import "BFExecutor.h"

#import <pthread.h>

NS_ASSUME_NONNULL_BEGIN

/*!
 Get the remaining stack-size of the current thread.

 @param totalSize The total stack size of the current thread.

 @return The remaining size, in bytes, available to the current thread.

 @note This function cannot be inlined, as otherwise the internal implementation could fail to report the proper
 remaining stack space.
 */
__attribute__((noinline)) static size_t remaining_stack_size(size_t *restrict totalSize) {
    pthread_t currentThread = pthread_self();

    // NOTE: We must store stack pointers as uint8_t so that the pointer math is well-defined
    uint8_t *endStack = pthread_get_stackaddr_np(currentThread);
    *totalSize = pthread_get_stacksize_np(currentThread);

    // NOTE: If the function is inlined, this value could be incorrect
    uint8_t *frameAddr = __builtin_frame_address(0);

    return (*totalSize) - (size_t)(endStack - frameAddr);
}

@interface BFExecutor ()

@property (nonatomic, copy) void(^block)(void(^block)(void));

@end

@implementation BFExecutor

#pragma mark - Executor methods

+ (instancetype)defaultExecutor {
    static BFExecutor *defaultExecutor = NULL;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        defaultExecutor = [self executorWithBlock:^void(void(^block)(void)) {
            // We prefer to run everything possible immediately, so that there is callstack information
            // when debugging. However, we don't want the stack to get too deep, so if the remaining stack space
            // is less than 10% of the total space, we dispatch to another GCD queue.
            size_t totalStackSize = 0;
            size_t remainingStackSize = remaining_stack_size(&totalStackSize);

            if (remainingStackSize < (totalStackSize / 10)) {
                dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), block);
            } else {
                @autoreleasepool {
                    block();
                }
            }
        }];
    });
    return defaultExecutor;
}

+ (instancetype)immediateExecutor {
    static BFExecutor *immediateExecutor = NULL;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        immediateExecutor = [self executorWithBlock:^void(void(^block)(void)) {
            block();
        }];
    });
    return immediateExecutor;
}

+ (instancetype)mainThreadExecutor {
    static BFExecutor *mainThreadExecutor = NULL;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        mainThreadExecutor = [self executorWithBlock:^void(void(^block)(void)) {
            if (![NSThread isMainThread]) {
                dispatch_async(dispatch_get_main_queue(), block);
            } else {
                @autoreleasepool {
                    block();
                }
            }
        }];
    });
    return mainThreadExecutor;
}

+ (instancetype)executorWithBlock:(void(^)(void(^block)(void)))block {
    return [[self alloc] initWithBlock:block];
}

+ (instancetype)executorWithDispatchQueue:(dispatch_queue_t)queue {
    return [self executorWithBlock:^void(void(^block)(void)) {
        dispatch_async(queue, block);
    }];
}

+ (instancetype)executorWithOperationQueue:(NSOperationQueue *)queue {
    return [self executorWithBlock:^void(void(^block)(void)) {
        [queue addOperation:[NSBlockOperation blockOperationWithBlock:block]];
    }];
}

#pragma mark - Initializer

- (instancetype)initWithBlock:(void(^)(void(^block)(void)))block {
    self = [super init];
    if (!self) return self;

    _block = block;

    return self;
}

#pragma mark - Execution

- (void)execute:(void(^)(void))block {
    self.block(block);
}

@end

NS_ASSUME_NONNULL_END
