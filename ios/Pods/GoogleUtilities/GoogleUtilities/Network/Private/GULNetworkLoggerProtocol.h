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

#import <GoogleUtilities/GULLoggerLevel.h>

#import "GULNetworkMessageCode.h"

/// The log levels used by GULNetworkLogger.
typedef NS_ENUM(NSInteger, GULNetworkLogLevel) {
  kGULNetworkLogLevelError = GULLoggerLevelError,
  kGULNetworkLogLevelWarning = GULLoggerLevelWarning,
  kGULNetworkLogLevelInfo = GULLoggerLevelInfo,
  kGULNetworkLogLevelDebug = GULLoggerLevelDebug,
};

@protocol GULNetworkLoggerDelegate <NSObject>

@required
/// Tells the delegate to log a message with an array of contexts and the log level.
- (void)GULNetwork_logWithLevel:(GULNetworkLogLevel)logLevel
                    messageCode:(GULNetworkMessageCode)messageCode
                        message:(NSString *)message
                       contexts:(NSArray *)contexts;

/// Tells the delegate to log a message with a context and the log level.
- (void)GULNetwork_logWithLevel:(GULNetworkLogLevel)logLevel
                    messageCode:(GULNetworkMessageCode)messageCode
                        message:(NSString *)message
                        context:(id)context;

/// Tells the delegate to log a message with the log level.
- (void)GULNetwork_logWithLevel:(GULNetworkLogLevel)logLevel
                    messageCode:(GULNetworkMessageCode)messageCode
                        message:(NSString *)message;

@end
