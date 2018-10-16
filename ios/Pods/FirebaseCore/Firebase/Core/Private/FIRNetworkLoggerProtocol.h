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

#import "FIRLoggerLevel.h"
#import "FIRNetworkMessageCode.h"

/// The log levels used by FIRNetworkLogger.
typedef NS_ENUM(NSInteger, FIRNetworkLogLevel) {
  kFIRNetworkLogLevelError = FIRLoggerLevelError,
  kFIRNetworkLogLevelWarning = FIRLoggerLevelWarning,
  kFIRNetworkLogLevelInfo = FIRLoggerLevelInfo,
  kFIRNetworkLogLevelDebug = FIRLoggerLevelDebug,
};

@protocol FIRNetworkLoggerDelegate <NSObject>

@required
/// Tells the delegate to log a message with an array of contexts and the log level.
- (void)firNetwork_logWithLevel:(FIRNetworkLogLevel)logLevel
                    messageCode:(FIRNetworkMessageCode)messageCode
                        message:(NSString *)message
                       contexts:(NSArray *)contexts;

/// Tells the delegate to log a message with a context and the log level.
- (void)firNetwork_logWithLevel:(FIRNetworkLogLevel)logLevel
                    messageCode:(FIRNetworkMessageCode)messageCode
                        message:(NSString *)message
                        context:(id)context;

/// Tells the delegate to log a message with the log level.
- (void)firNetwork_logWithLevel:(FIRNetworkLogLevel)logLevel
                    messageCode:(FIRNetworkMessageCode)messageCode
                        message:(NSString *)message;

@end
