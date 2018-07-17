/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI29_0_0/ABI29_0_0RCTDefines.h>

#if ABI29_0_0RCT_DEV

NS_ASSUME_NONNULL_BEGIN

@protocol ABI29_0_0RCTPackagerClientMethod;
@class ABI29_0_0RCTPackagerClientResponder;

typedef uint32_t ABI29_0_0RCTHandlerToken;
typedef void (^ABI29_0_0RCTNotificationHandler)(NSDictionary<NSString *, id> *);
typedef void (^ABI29_0_0RCTRequestHandler)(NSDictionary<NSString *, id> *, ABI29_0_0RCTPackagerClientResponder *);
typedef void (^ABI29_0_0RCTConnectedHandler)(void);

/** Encapsulates singleton connection to ReactABI29_0_0 Native packager. */
@interface ABI29_0_0RCTPackagerConnection : NSObject

+ (instancetype)sharedPackagerConnection;

/**
 * Registers a handler for a notification broadcast from the packager. An
 * example is "reload" - an instruction to reload from the packager.
 * If multiple notification handlers are registered for the same method, they
 * will all be invoked sequentially.
 */
- (ABI29_0_0RCTHandlerToken)addNotificationHandler:(ABI29_0_0RCTNotificationHandler)handler
                                    queue:(dispatch_queue_t)queue
                                forMethod:(NSString *)method;

/**
 * Registers a handler for a request from the packager. An example is
 * pokeSamplingProfiler; it asks for profile data from the client.
 * Only one handler can be registered for a given method; calling this
 * displaces any previous request handler registered for that method.
 */
- (ABI29_0_0RCTHandlerToken)addRequestHandler:(ABI29_0_0RCTRequestHandler)handler
                               queue:(dispatch_queue_t)queue
                           forMethod:(NSString *)method;

/**
 * Registers a handler that runs at most once, when the connection to the
 * packager has been established. The handler will be dispatched immediately
 * if the connection is already established.
 */
- (ABI29_0_0RCTHandlerToken)addConnectedHandler:(ABI29_0_0RCTConnectedHandler)handler
                                 queue:(dispatch_queue_t)queue;

/** Removes a handler. Silently does nothing if the token is not valid. */
- (void)removeHandler:(ABI29_0_0RCTHandlerToken)token;

/** Disconnects and removes all handlers. */
- (void)stop;

/**
 * Historically no distinction was made between notification and request
 * handlers. If you use this method, it will be registered as *both* a
 * notification handler *and* a request handler. You should migrate to the
 * new block-based API instead.
 */
- (void)addHandler:(id<ABI29_0_0RCTPackagerClientMethod>)handler
         forMethod:(NSString *)method __deprecated_msg("Use addRequestHandler or addNotificationHandler instead");

@end

NS_ASSUME_NONNULL_END

#endif
