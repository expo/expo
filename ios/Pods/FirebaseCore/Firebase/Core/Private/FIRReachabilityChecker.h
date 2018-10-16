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
#import <SystemConfiguration/SystemConfiguration.h>

/// Reachability Status
typedef enum {
  kFIRReachabilityUnknown,  ///< Have not yet checked or been notified whether host is reachable.
  kFIRReachabilityNotReachable,  ///< Host is not reachable.
  kFIRReachabilityViaWifi,       ///< Host is reachable via Wifi.
  kFIRReachabilityViaCellular,   ///< Host is reachable via cellular.
} FIRReachabilityStatus;

const NSString *FIRReachabilityStatusString(FIRReachabilityStatus status);

@class FIRReachabilityChecker;
@protocol FIRNetworkLoggerDelegate;

/// Google Analytics iOS Reachability Checker.
@protocol FIRReachabilityDelegate
@required
/// Called when network status has changed.
- (void)reachability:(FIRReachabilityChecker *)reachability
       statusChanged:(FIRReachabilityStatus)status;
@end

/// Google Analytics iOS Network Status Checker.
@interface FIRReachabilityChecker : NSObject

/// The last known reachability status, or FIRReachabilityStatusUnknown if the
/// checker is not active.
@property(nonatomic, readonly) FIRReachabilityStatus reachabilityStatus;
/// The host to which reachability status is to be checked.
@property(nonatomic, copy, readonly) NSString *host;
/// The delegate to be notified of reachability status changes.
@property(nonatomic, weak) id<FIRReachabilityDelegate> reachabilityDelegate;
/// The delegate to be notified to log messages.
@property(nonatomic, weak) id<FIRNetworkLoggerDelegate> loggerDelegate;
/// `YES` if the reachability checker is active, `NO` otherwise.
@property(nonatomic, readonly) BOOL isActive;

/// Initialize the reachability checker. Note that you must call start to begin checking for and
/// receiving notifications about network status changes.
///
/// @param reachabilityDelegate The delegate to be notified when reachability status to host
/// changes.
///
/// @param loggerDelegate The delegate to send log messages to.
///
/// @param host The name of the host.
///
- (instancetype)initWithReachabilityDelegate:(id<FIRReachabilityDelegate>)reachabilityDelegate
                              loggerDelegate:(id<FIRNetworkLoggerDelegate>)loggerDelegate
                                    withHost:(NSString *)host;

- (instancetype)init NS_UNAVAILABLE;

/// Start checking for reachability to the specified host. This has no effect if the status
/// checker is already checking for connectivity.
///
/// @return `YES` if initiating status checking was successful or the status checking has already
/// been initiated, `NO` otherwise.
- (BOOL)start;

/// Stop checking for reachability to the specified host. This has no effect if the status
/// checker is not checking for connectivity.
- (void)stop;

@end
