// Copyright 2018 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "Private/GULLogger.h"

#include <asl.h>

#import <GoogleUtilities/GULAppEnvironmentUtil.h>
#import "Public/GULLoggerLevel.h"

/// ASL client facility name used by GULLogger.
const char *kGULLoggerASLClientFacilityName = "com.google.utilities.logger";

static dispatch_once_t sGULLoggerOnceToken;

static aslclient sGULLoggerClient;

static dispatch_queue_t sGULClientQueue;

static BOOL sGULLoggerDebugMode;

static GULLoggerLevel sGULLoggerMaximumLevel;

// Allow clients to register a version to include in the log.
static const char *sVersion = "";

static GULLoggerService kGULLoggerLogger = @"[GULLogger]";

#ifdef DEBUG
/// The regex pattern for the message code.
static NSString *const kMessageCodePattern = @"^I-[A-Z]{3}[0-9]{6}$";
static NSRegularExpression *sMessageCodeRegex;
#endif

void GULLoggerInitializeASL(void) {
  dispatch_once(&sGULLoggerOnceToken, ^{
    NSInteger majorOSVersion = [[GULAppEnvironmentUtil systemVersion] integerValue];
    uint32_t aslOptions = ASL_OPT_STDERR;
#if TARGET_OS_SIMULATOR
    // The iOS 11 simulator doesn't need the ASL_OPT_STDERR flag.
    if (majorOSVersion >= 11) {
      aslOptions = 0;
    }
#else
    // Devices running iOS 10 or higher don't need the ASL_OPT_STDERR flag.
    if (majorOSVersion >= 10) {
      aslOptions = 0;
    }
#endif  // TARGET_OS_SIMULATOR

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"  // asl is deprecated
    // Initialize the ASL client handle.
    sGULLoggerClient = asl_open(NULL, kGULLoggerASLClientFacilityName, aslOptions);
    sGULLoggerMaximumLevel = GULLoggerLevelNotice;

    // Set the filter used by system/device log. Initialize in default mode.
    asl_set_filter(sGULLoggerClient, ASL_FILTER_MASK_UPTO(ASL_LEVEL_NOTICE));

    sGULClientQueue = dispatch_queue_create("GULLoggingClientQueue", DISPATCH_QUEUE_SERIAL);
    dispatch_set_target_queue(sGULClientQueue,
                              dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0));
#ifdef DEBUG
    sMessageCodeRegex = [NSRegularExpression regularExpressionWithPattern:kMessageCodePattern
                                                                  options:0
                                                                    error:NULL];
#endif
  });
}

void GULLoggerEnableSTDERR(void) {
  asl_add_log_file(sGULLoggerClient, STDERR_FILENO);
}

void GULLoggerForceDebug(void) {
  // We should enable debug mode if we're not running from App Store.
  if (![GULAppEnvironmentUtil isFromAppStore]) {
    sGULLoggerDebugMode = YES;
    GULSetLoggerLevel(GULLoggerLevelDebug);
  }
}

__attribute__((no_sanitize("thread"))) void GULSetLoggerLevel(GULLoggerLevel loggerLevel) {
  if (loggerLevel < GULLoggerLevelMin || loggerLevel > GULLoggerLevelMax) {
    GULLogError(kGULLoggerLogger, NO, @"I-COR000023", @"Invalid logger level, %ld",
                (long)loggerLevel);
    return;
  }
  GULLoggerInitializeASL();
  // We should not raise the logger level if we are running from App Store.
  if (loggerLevel >= GULLoggerLevelNotice && [GULAppEnvironmentUtil isFromAppStore]) {
    return;
  }

  sGULLoggerMaximumLevel = loggerLevel;
  dispatch_async(sGULClientQueue, ^{
    asl_set_filter(sGULLoggerClient, ASL_FILTER_MASK_UPTO(loggerLevel));
  });
}

/**
 * Check if the level is high enough to be loggable.
 */
__attribute__((no_sanitize("thread"))) BOOL GULIsLoggableLevel(GULLoggerLevel loggerLevel) {
  GULLoggerInitializeASL();
  if (sGULLoggerDebugMode) {
    return YES;
  }
  return (BOOL)(loggerLevel <= sGULLoggerMaximumLevel);
}

#ifdef DEBUG
void GULResetLogger() {
  sGULLoggerOnceToken = 0;
}

aslclient getGULLoggerClient() {
  return sGULLoggerClient;
}

dispatch_queue_t getGULClientQueue() {
  return sGULClientQueue;
}

BOOL getGULLoggerDebugMode() {
  return sGULLoggerDebugMode;
}
#endif

void GULLoggerRegisterVersion(const char *version) {
  sVersion = version;
}

void GULLogBasic(GULLoggerLevel level,
                 GULLoggerService service,
                 BOOL forceLog,
                 NSString *messageCode,
                 NSString *message,
                 va_list args_ptr) {
  GULLoggerInitializeASL();
  if (!(level <= sGULLoggerMaximumLevel || sGULLoggerDebugMode || forceLog)) {
    return;
  }

#ifdef DEBUG
  NSCAssert(messageCode.length == 11, @"Incorrect message code length.");
  NSRange messageCodeRange = NSMakeRange(0, messageCode.length);
  NSUInteger numberOfMatches = [sMessageCodeRegex numberOfMatchesInString:messageCode
                                                                  options:0
                                                                    range:messageCodeRange];
  NSCAssert(numberOfMatches == 1, @"Incorrect message code format.");
#endif
  NSString *logMsg = [[NSString alloc] initWithFormat:message arguments:args_ptr];
  logMsg = [NSString stringWithFormat:@"%s - %@[%@] %@", sVersion, service, messageCode, logMsg];
  dispatch_async(sGULClientQueue, ^{
    asl_log(sGULLoggerClient, NULL, (int)level, "%s", logMsg.UTF8String);
  });
}
#pragma clang diagnostic pop

/**
 * Generates the logging functions using macros.
 *
 * Calling GULLogError(kGULLoggerCore, @"I-COR000001", @"Configure %@ failed.", @"blah") shows:
 * yyyy-mm-dd hh:mm:ss.SSS sender[PID] <Error> [{service}][I-COR000001] Configure blah failed.
 * Calling GULLogDebug(kGULLoggerCore, @"I-COR000001", @"Configure succeed.") shows:
 * yyyy-mm-dd hh:mm:ss.SSS sender[PID] <Debug> [{service}][I-COR000001] Configure succeed.
 */
#define GUL_LOGGING_FUNCTION(level)                                                     \
  void GULLog##level(GULLoggerService service, BOOL force, NSString *messageCode,       \
                     NSString *message, ...) {                                          \
    va_list args_ptr;                                                                   \
    va_start(args_ptr, message);                                                        \
    GULLogBasic(GULLoggerLevel##level, service, force, messageCode, message, args_ptr); \
    va_end(args_ptr);                                                                   \
  }

GUL_LOGGING_FUNCTION(Error)
GUL_LOGGING_FUNCTION(Warning)
GUL_LOGGING_FUNCTION(Notice)
GUL_LOGGING_FUNCTION(Info)
GUL_LOGGING_FUNCTION(Debug)

#undef GUL_MAKE_LOGGER

#pragma mark - GULLoggerWrapper

@implementation GULLoggerWrapper

+ (void)logWithLevel:(GULLoggerLevel)level
         withService:(GULLoggerService)service
            withCode:(NSString *)messageCode
         withMessage:(NSString *)message
            withArgs:(va_list)args {
  GULLogBasic(level, service, NO, messageCode, message, args);
}

@end
