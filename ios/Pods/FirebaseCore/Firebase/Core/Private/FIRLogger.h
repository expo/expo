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

NS_ASSUME_NONNULL_BEGIN

/**
 * The Firebase services used in Firebase logger.
 */
typedef NSString *const FIRLoggerService;

extern FIRLoggerService kFIRLoggerABTesting;
extern FIRLoggerService kFIRLoggerAdMob;
extern FIRLoggerService kFIRLoggerAnalytics;
extern FIRLoggerService kFIRLoggerAuth;
extern FIRLoggerService kFIRLoggerCore;
extern FIRLoggerService kFIRLoggerCrash;
extern FIRLoggerService kFIRLoggerDatabase;
extern FIRLoggerService kFIRLoggerDynamicLinks;
extern FIRLoggerService kFIRLoggerFirestore;
extern FIRLoggerService kFIRLoggerInstanceID;
extern FIRLoggerService kFIRLoggerInvites;
extern FIRLoggerService kFIRLoggerMLKit;
extern FIRLoggerService kFIRLoggerMessaging;
extern FIRLoggerService kFIRLoggerPerf;
extern FIRLoggerService kFIRLoggerRemoteConfig;
extern FIRLoggerService kFIRLoggerStorage;
extern FIRLoggerService kFIRLoggerSwizzler;

/**
 * The key used to store the logger's error count.
 */
extern NSString *const kFIRLoggerErrorCountKey;

/**
 * The key used to store the logger's warning count.
 */
extern NSString *const kFIRLoggerWarningCountKey;

#ifdef __cplusplus
extern "C" {
#endif  // __cplusplus

/**
 * Enables or disables Analytics debug mode.
 * If set to YES, the logging level for Analytics will be set to FIRLoggerLevelDebug.
 * Enabling the debug mode has no effect if the app is running from App Store.
 * (required) analytics debug mode flag.
 */
void FIRSetAnalyticsDebugMode(BOOL analyticsDebugMode);

/**
 * Changes the default logging level of FIRLoggerLevelNotice to a user-specified level.
 * The default level cannot be set above FIRLoggerLevelNotice if the app is running from App Store.
 * (required) log level (one of the FIRLoggerLevel enum values).
 */
void FIRSetLoggerLevel(FIRLoggerLevel loggerLevel);

/**
 * Checks if the specified logger level is loggable given the current settings.
 * (required) log level (one of the FIRLoggerLevel enum values).
 * (required) whether or not this function is called from the Analytics component.
 */
BOOL FIRIsLoggableLevel(FIRLoggerLevel loggerLevel, BOOL analyticsComponent);

/**
 * Logs a message to the Xcode console and the device log. If running from AppStore, will
 * not log any messages with a level higher than FIRLoggerLevelNotice to avoid log spamming.
 * (required) log level (one of the FIRLoggerLevel enum values).
 * (required) service name of type FIRLoggerService.
 * (required) message code starting with "I-" which means iOS, followed by a capitalized
 *            three-character service identifier and a six digit integer message ID that is unique
 *            within the service.
 *            An example of the message code is @"I-COR000001".
 * (required) message string which can be a format string.
 * (optional) variable arguments list obtained from calling va_start, used when message is a format
 *            string.
 */
extern void FIRLogBasic(FIRLoggerLevel level,
                        FIRLoggerService service,
                        NSString *messageCode,
                        NSString *message,
// On 64-bit simulators, va_list is not a pointer, so cannot be marked nullable
// See: http://stackoverflow.com/q/29095469
#if __LP64__ && TARGET_OS_SIMULATOR || TARGET_OS_OSX
                        va_list args_ptr
#else
                        va_list _Nullable args_ptr
#endif
);

/**
 * The following functions accept the following parameters in order:
 * (required) service name of type FIRLoggerService.
 * (required) message code starting from "I-" which means iOS, followed by a capitalized
 *            three-character service identifier and a six digit integer message ID that is unique
 *            within the service.
 *            An example of the message code is @"I-COR000001".
 *            See go/firebase-log-proposal for details.
 * (required) message string which can be a format string.
 * (optional) the list of arguments to substitute into the format string.
 * Example usage:
 * FIRLogError(kFIRLoggerCore, @"I-COR000001", @"Configuration of %@ failed.", app.name);
 */
extern void FIRLogError(FIRLoggerService service, NSString *messageCode, NSString *message, ...)
    NS_FORMAT_FUNCTION(3, 4);
extern void FIRLogWarning(FIRLoggerService service, NSString *messageCode, NSString *message, ...)
    NS_FORMAT_FUNCTION(3, 4);
extern void FIRLogNotice(FIRLoggerService service, NSString *messageCode, NSString *message, ...)
    NS_FORMAT_FUNCTION(3, 4);
extern void FIRLogInfo(FIRLoggerService service, NSString *messageCode, NSString *message, ...)
    NS_FORMAT_FUNCTION(3, 4);
extern void FIRLogDebug(FIRLoggerService service, NSString *messageCode, NSString *message, ...)
    NS_FORMAT_FUNCTION(3, 4);

#ifdef __cplusplus
}  // extern "C"
#endif  // __cplusplus

@interface FIRLoggerWrapper : NSObject

/**
 * Objective-C wrapper for FIRLogBasic to allow weak linking to FIRLogger
 * (required) log level (one of the FIRLoggerLevel enum values).
 * (required) service name of type FIRLoggerService.
 * (required) message code starting with "I-" which means iOS, followed by a capitalized
 *            three-character service identifier and a six digit integer message ID that is unique
 *            within the service.
 *            An example of the message code is @"I-COR000001".
 * (required) message string which can be a format string.
 * (optional) variable arguments list obtained from calling va_start, used when message is a format
 *            string.
 */

+ (void)logWithLevel:(FIRLoggerLevel)level
         withService:(FIRLoggerService)service
            withCode:(NSString *)messageCode
         withMessage:(NSString *)message
            withArgs:(va_list)args;

@end

NS_ASSUME_NONNULL_END
