/*
 * Copyright 2018 Google
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

NS_ASSUME_NONNULL_BEGIN

/**
 * The services used in the logger.
 */
typedef NSString *const GULLoggerService;

#ifdef __cplusplus
extern "C" {
#endif  // __cplusplus

/**
 * Initialize GULLogger.
 */
extern void GULLoggerInitializeASL(void);

/**
 * Override log level to Debug.
 */
void GULLoggerForceDebug(void);

/**
 * Turn on logging to STDERR.
 */
extern void GULLoggerEnableSTDERR(void);

/**
 * Changes the default logging level of GULLoggerLevelNotice to a user-specified level.
 * The default level cannot be set above GULLoggerLevelNotice if the app is running from App Store.
 * (required) log level (one of the GULLoggerLevel enum values).
 */
extern void GULSetLoggerLevel(GULLoggerLevel loggerLevel);

/**
 * Checks if the specified logger level is loggable given the current settings.
 * (required) log level (one of the GULLoggerLevel enum values).
 */
extern BOOL GULIsLoggableLevel(GULLoggerLevel loggerLevel);

/**
 * Register version to include in logs.
 * (required) version
 */
extern void GULLoggerRegisterVersion(const char *version);

/**
 * Logs a message to the Xcode console and the device log. If running from AppStore, will
 * not log any messages with a level higher than GULLoggerLevelNotice to avoid log spamming.
 * (required) log level (one of the GULLoggerLevel enum values).
 * (required) service name of type GULLoggerService.
 * (required) message code starting with "I-" which means iOS, followed by a capitalized
 *            three-character service identifier and a six digit integer message ID that is unique
 *            within the service.
 *            An example of the message code is @"I-COR000001".
 * (required) message string which can be a format string.
 * (optional) variable arguments list obtained from calling va_start, used when message is a format
 *            string.
 */
extern void GULLogBasic(GULLoggerLevel level,
                        GULLoggerService service,
                        BOOL forceLog,
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
 * (required) service name of type GULLoggerService.
 * (required) message code starting from "I-" which means iOS, followed by a capitalized
 *            three-character service identifier and a six digit integer message ID that is unique
 *            within the service.
 *            An example of the message code is @"I-COR000001".
 *            See go/firebase-log-proposal for details.
 * (required) message string which can be a format string.
 * (optional) the list of arguments to substitute into the format string.
 * Example usage:
 * GULLogError(kGULLoggerCore, @"I-COR000001", @"Configuration of %@ failed.", app.name);
 */
extern void GULLogError(GULLoggerService service,
                        BOOL force,
                        NSString *messageCode,
                        NSString *message,
                        ...) NS_FORMAT_FUNCTION(4, 5);
extern void GULLogWarning(GULLoggerService service,
                          BOOL force,
                          NSString *messageCode,
                          NSString *message,
                          ...) NS_FORMAT_FUNCTION(4, 5);
extern void GULLogNotice(GULLoggerService service,
                         BOOL force,
                         NSString *messageCode,
                         NSString *message,
                         ...) NS_FORMAT_FUNCTION(4, 5);
extern void GULLogInfo(GULLoggerService service,
                       BOOL force,
                       NSString *messageCode,
                       NSString *message,
                       ...) NS_FORMAT_FUNCTION(4, 5);
extern void GULLogDebug(GULLoggerService service,
                        BOOL force,
                        NSString *messageCode,
                        NSString *message,
                        ...) NS_FORMAT_FUNCTION(4, 5);

#ifdef __cplusplus
}  // extern "C"
#endif  // __cplusplus

@interface GULLoggerWrapper : NSObject

/**
 * Objective-C wrapper for GULLogBasic to allow weak linking to GULLogger
 * (required) log level (one of the GULLoggerLevel enum values).
 * (required) service name of type GULLoggerService.
 * (required) message code starting with "I-" which means iOS, followed by a capitalized
 *            three-character service identifier and a six digit integer message ID that is unique
 *            within the service.
 *            An example of the message code is @"I-COR000001".
 * (required) message string which can be a format string.
 * (optional) variable arguments list obtained from calling va_start, used when message is a format
 *            string.
 */

+ (void)logWithLevel:(GULLoggerLevel)level
         withService:(GULLoggerService)service
            withCode:(NSString *)messageCode
         withMessage:(NSString *)message
            withArgs:(va_list)args;

@end

NS_ASSUME_NONNULL_END
