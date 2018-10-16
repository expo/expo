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

#import "FIRNetworkConstants.h"
#import "FIRNetworkLoggerProtocol.h"
#import "FIRNetworkURLSession.h"

/// Delegate protocol for FIRNetwork events.
@protocol FIRNetworkReachabilityDelegate

/// Tells the delegate to handle events when the network reachability changes to connected or not
/// connected.
- (void)reachabilityDidChange;

@end

/// The Network component that provides network status and handles network requests and responses.
/// This is not thread safe.
///
/// NOTE:
/// User must add FIRAnalytics handleEventsForBackgroundURLSessionID:completionHandler to the
/// AppDelegate application:handleEventsForBackgroundURLSession:completionHandler:
@interface FIRNetwork : NSObject

/// Indicates if network connectivity is available.
@property(nonatomic, readonly, getter=isNetworkConnected) BOOL networkConnected;

/// Indicates if there are any uploads in progress.
@property(nonatomic, readonly, getter=hasUploadInProgress) BOOL uploadInProgress;

/// An optional delegate that can be used in the event when network reachability changes.
@property(nonatomic, weak) id<FIRNetworkReachabilityDelegate> reachabilityDelegate;

/// An optional delegate that can be used to log messages, warnings or errors that occur in the
/// network operations.
@property(nonatomic, weak) id<FIRNetworkLoggerDelegate> loggerDelegate;

/// Indicates whether the logger should display debug messages.
@property(nonatomic, assign) BOOL isDebugModeEnabled;

/// The time interval in seconds for the network request to timeout.
@property(nonatomic, assign) NSTimeInterval timeoutInterval;

/// Initializes with the default reachability host.
- (instancetype)init;

/// Initializes with a custom reachability host.
- (instancetype)initWithReachabilityHost:(NSString *)reachabilityHost;

/// Handles events when background session with the given ID has finished.
+ (void)handleEventsForBackgroundURLSessionID:(NSString *)sessionID
                            completionHandler:(FIRNetworkSystemCompletionHandler)completionHandler;

/// Compresses and sends a POST request with the provided data to the URL. The session will be
/// background session if usingBackgroundSession is YES. Otherwise, the POST session is default
/// session. Returns a session ID or nil if an error occurs.
- (NSString *)postURL:(NSURL *)url
                   payload:(NSData *)payload
                     queue:(dispatch_queue_t)queue
    usingBackgroundSession:(BOOL)usingBackgroundSession
         completionHandler:(FIRNetworkCompletionHandler)handler;

/// Sends a GET request with the provided data to the URL. The session will be background session
/// if usingBackgroundSession is YES. Otherwise, the GET session is default session. Returns a
/// session ID or nil if an error occurs.
- (NSString *)getURL:(NSURL *)url
                   headers:(NSDictionary *)headers
                     queue:(dispatch_queue_t)queue
    usingBackgroundSession:(BOOL)usingBackgroundSession
         completionHandler:(FIRNetworkCompletionHandler)handler;

@end
