/*
 * Copyright 2017 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

#import "GULNetworkLoggerProtocol.h"

NS_ASSUME_NONNULL_BEGIN

typedef void (^GULNetworkCompletionHandler)(NSHTTPURLResponse *_Nullable response,
                                            NSData *_Nullable data,
                                            NSError *_Nullable error);
typedef void (^GULNetworkURLSessionCompletionHandler)(NSHTTPURLResponse *_Nullable response,
                                                      NSData *_Nullable data,
                                                      NSString *sessionID,
                                                      NSError *_Nullable error);
typedef void (^GULNetworkSystemCompletionHandler)(void);

/// The protocol that uses NSURLSession for iOS >= 7.0 to handle requests and responses.
@interface GULNetworkURLSession : NSObject

/// Indicates whether the background network is enabled. Default value is NO.
@property(nonatomic, getter=isBackgroundNetworkEnabled) BOOL backgroundNetworkEnabled;

/// The logger delegate to log message, errors or warnings that occur during the network operations.
@property(nonatomic, weak, nullable) id<GULNetworkLoggerDelegate> loggerDelegate;

/// Calls the system provided completion handler after the background session is finished.
+ (void)handleEventsForBackgroundURLSessionID:(NSString *)sessionID
                            completionHandler:(GULNetworkSystemCompletionHandler)completionHandler;

/// Initializes with logger delegate.
- (instancetype)initWithNetworkLoggerDelegate:
    (nullable id<GULNetworkLoggerDelegate>)networkLoggerDelegate NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;

/// Sends an asynchronous POST request and calls the provided completion handler when the request
/// completes or when errors occur, and returns an ID of the session/connection.
- (nullable NSString *)sessionIDFromAsyncPOSTRequest:(NSURLRequest *)request
                                   completionHandler:(GULNetworkURLSessionCompletionHandler)handler;

/// Sends an asynchronous GET request and calls the provided completion handler when the request
/// completes or when errors occur, and returns an ID of the session.
- (nullable NSString *)sessionIDFromAsyncGETRequest:(NSURLRequest *)request
                                  completionHandler:(GULNetworkURLSessionCompletionHandler)handler;

NS_ASSUME_NONNULL_END
@end
