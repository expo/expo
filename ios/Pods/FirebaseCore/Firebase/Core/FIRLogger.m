// Copyright 2017 Google
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

#import "Private/FIRLogger.h"

#import "FIRLoggerLevel.h"
#import "Private/FIRVersion.h"
#import "third_party/FIRAppEnvironmentUtil.h"

#include <asl.h>
#include <assert.h>
#include <stdbool.h>
#include <sys/sysctl.h>
#include <sys/types.h>
#include <unistd.h>

FIRLoggerService kFIRLoggerABTesting = @"[Firebase/ABTesting]";
FIRLoggerService kFIRLoggerAdMob = @"[Firebase/AdMob]";
FIRLoggerService kFIRLoggerAnalytics = @"[Firebase/Analytics]";
FIRLoggerService kFIRLoggerAuth = @"[Firebase/Auth]";
FIRLoggerService kFIRLoggerCore = @"[Firebase/Core]";
FIRLoggerService kFIRLoggerCrash = @"[Firebase/Crash]";
FIRLoggerService kFIRLoggerDatabase = @"[Firebase/Database]";
FIRLoggerService kFIRLoggerDynamicLinks = @"[Firebase/DynamicLinks]";
FIRLoggerService kFIRLoggerFirestore = @"[Firebase/Firestore]";
FIRLoggerService kFIRLoggerInstanceID = @"[Firebase/InstanceID]";
FIRLoggerService kFIRLoggerInvites = @"[Firebase/Invites]";
FIRLoggerService kFIRLoggerMLKit = @"[Firebase/MLKit]";
FIRLoggerService kFIRLoggerMessaging = @"[Firebase/Messaging]";
FIRLoggerService kFIRLoggerPerf = @"[Firebase/Performance]";
FIRLoggerService kFIRLoggerRemoteConfig = @"[Firebase/RemoteConfig]";
FIRLoggerService kFIRLoggerStorage = @"[Firebase/Storage]";
FIRLoggerService kFIRLoggerSwizzler = @"[FirebaseSwizzlingUtilities]";

/// Arguments passed on launch.
NSString *const kFIRDisableDebugModeApplicationArgument = @"-FIRDebugDisabled";
NSString *const kFIREnableDebugModeApplicationArgument = @"-FIRDebugEnabled";
NSString *const kFIRLoggerForceSDTERRApplicationArgument = @"-FIRLoggerForceSTDERR";

/// Key for the debug mode bit in NSUserDefaults.
NSString *const kFIRPersistedDebugModeKey = @"/google/firebase/debug_mode";

/// ASL client facility name used by FIRLogger.
const char *kFIRLoggerASLClientFacilityName = "com.firebase.app.logger";

/// Keys for the number of errors and warnings logged.
NSString *const kFIRLoggerErrorCountKey = @"/google/firebase/count_of_errors_logged";
NSString *const kFIRLoggerWarningCountKey = @"/google/firebase/count_of_warnings_logged";

static dispatch_once_t sFIRLoggerOnceToken;

static aslclient sFIRLoggerClient;

static dispatch_queue_t sFIRClientQueue;

/// NSUserDefaults that should be used to store and read variables. If nil, `standardUserDefaults`
/// will be used.
static NSUserDefaults *sFIRLoggerUserDefaults;

static BOOL sFIRLoggerDebugMode;

// The sFIRAnalyticsDebugMode flag is here to support the -FIRDebugEnabled/-FIRDebugDisabled
// flags used by Analytics. Users who use those flags expect Analytics to log verbosely,
// while the rest of Firebase logs at the default level. This flag is introduced to support
// that behavior.
static BOOL sFIRAnalyticsDebugMode;

static FIRLoggerLevel sFIRLoggerMaximumLevel;

#ifdef DEBUG
/// The regex pattern for the message code.
static NSString *const kMessageCodePattern = @"^I-[A-Z]{3}[0-9]{6}$";
static NSRegularExpression *sMessageCodeRegex;
#endif

void FIRLoggerInitializeASL() {
  dispatch_once(&sFIRLoggerOnceToken, ^{
    NSInteger majorOSVersion = [[FIRAppEnvironmentUtil systemVersion] integerValue];
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

    // Override the aslOptions to ASL_OPT_STDERR if the override argument is passed in.
    NSArray *arguments = [NSProcessInfo processInfo].arguments;
    if ([arguments containsObject:kFIRLoggerForceSDTERRApplicationArgument]) {
      aslOptions = ASL_OPT_STDERR;
    }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"  // asl is deprecated
    // Initialize the ASL client handle.
    sFIRLoggerClient = asl_open(NULL, kFIRLoggerASLClientFacilityName, aslOptions);

    // Set the filter used by system/device log. Initialize in default mode.
    asl_set_filter(sFIRLoggerClient, ASL_FILTER_MASK_UPTO(ASL_LEVEL_NOTICE));
    sFIRLoggerDebugMode = NO;
    sFIRAnalyticsDebugMode = NO;
    sFIRLoggerMaximumLevel = FIRLoggerLevelNotice;

    // Use the standard NSUserDefaults if it hasn't been explicitly set.
    if (sFIRLoggerUserDefaults == nil) {
      sFIRLoggerUserDefaults = [NSUserDefaults standardUserDefaults];
    }

    BOOL debugMode = [sFIRLoggerUserDefaults boolForKey:kFIRPersistedDebugModeKey];
    if ([arguments containsObject:kFIRDisableDebugModeApplicationArgument]) {  // Default mode
      [sFIRLoggerUserDefaults removeObjectForKey:kFIRPersistedDebugModeKey];
    } else if ([arguments containsObject:kFIREnableDebugModeApplicationArgument] ||
               debugMode) {  // Debug mode
      [sFIRLoggerUserDefaults setBool:YES forKey:kFIRPersistedDebugModeKey];
      asl_set_filter(sFIRLoggerClient, ASL_FILTER_MASK_UPTO(ASL_LEVEL_DEBUG));
      sFIRLoggerDebugMode = YES;
    }

    // We should disable debug mode if we are running from App Store.
    if (sFIRLoggerDebugMode && [FIRAppEnvironmentUtil isFromAppStore]) {
      sFIRLoggerDebugMode = NO;
    }

    sFIRClientQueue = dispatch_queue_create("FIRLoggingClientQueue", DISPATCH_QUEUE_SERIAL);
    dispatch_set_target_queue(sFIRClientQueue,
                              dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0));

#ifdef DEBUG
    sMessageCodeRegex =
        [NSRegularExpression regularExpressionWithPattern:kMessageCodePattern options:0 error:NULL];
#endif
  });
}

void FIRSetAnalyticsDebugMode(BOOL analyticsDebugMode) {
  FIRLoggerInitializeASL();
  dispatch_async(sFIRClientQueue, ^{
    // We should not enable debug mode if we are running from App Store.
    if (analyticsDebugMode && [FIRAppEnvironmentUtil isFromAppStore]) {
      return;
    }
    sFIRAnalyticsDebugMode = analyticsDebugMode;
    asl_set_filter(sFIRLoggerClient, ASL_FILTER_MASK_UPTO(ASL_LEVEL_DEBUG));
  });
}

void FIRSetLoggerLevel(FIRLoggerLevel loggerLevel) {
  if (loggerLevel < FIRLoggerLevelMin || loggerLevel > FIRLoggerLevelMax) {
    FIRLogError(kFIRLoggerCore, @"I-COR000023", @"Invalid logger level, %ld", (long)loggerLevel);
    return;
  }
  FIRLoggerInitializeASL();
  // We should not raise the logger level if we are running from App Store.
  if (loggerLevel >= FIRLoggerLevelNotice && [FIRAppEnvironmentUtil isFromAppStore]) {
    return;
  }

  sFIRLoggerMaximumLevel = loggerLevel;
  dispatch_async(sFIRClientQueue, ^{
    asl_set_filter(sFIRLoggerClient, ASL_FILTER_MASK_UPTO(loggerLevel));
  });
}

/**
 * Check if the level is high enough to be loggable.
 *
 * Analytics can override the log level with an intentional race condition.
 * Add the attribute to get a clean thread sanitizer run.
 */
__attribute__((no_sanitize("thread"))) BOOL FIRIsLoggableLevel(FIRLoggerLevel loggerLevel,
                                                               BOOL analyticsComponent) {
  FIRLoggerInitializeASL();
  if (sFIRLoggerDebugMode) {
    return YES;
  } else if (sFIRAnalyticsDebugMode && analyticsComponent) {
    return YES;
  }
  return (BOOL)(loggerLevel <= sFIRLoggerMaximumLevel);
}

#ifdef DEBUG
void FIRResetLogger() {
  sFIRLoggerOnceToken = 0;
  [sFIRLoggerUserDefaults removeObjectForKey:kFIRPersistedDebugModeKey];
  sFIRLoggerUserDefaults = nil;
}

void FIRSetLoggerUserDefaults(NSUserDefaults *defaults) {
  sFIRLoggerUserDefaults = defaults;
}

aslclient getFIRLoggerClient() {
  return sFIRLoggerClient;
}

dispatch_queue_t getFIRClientQueue() {
  return sFIRClientQueue;
}

BOOL getFIRLoggerDebugMode() {
  return sFIRLoggerDebugMode;
}
#endif

void FIRLogBasic(FIRLoggerLevel level,
                 FIRLoggerService service,
                 NSString *messageCode,
                 NSString *message,
                 va_list args_ptr) {
  FIRLoggerInitializeASL();
  BOOL canLog = level <= sFIRLoggerMaximumLevel;

  if (sFIRLoggerDebugMode) {
    canLog = YES;
  } else if (sFIRAnalyticsDebugMode && [kFIRLoggerAnalytics isEqualToString:service]) {
    canLog = YES;
  }

  if (!canLog) {
    return;
  }
#ifdef DEBUG
  NSCAssert(messageCode.length == 11, @"Incorrect message code length.");
  NSRange messageCodeRange = NSMakeRange(0, messageCode.length);
  NSUInteger numberOfMatches =
      [sMessageCodeRegex numberOfMatchesInString:messageCode options:0 range:messageCodeRange];
  NSCAssert(numberOfMatches == 1, @"Incorrect message code format.");
#endif
  NSString *logMsg = [[NSString alloc] initWithFormat:message arguments:args_ptr];
  logMsg =
      [NSString stringWithFormat:@"%s - %@[%@] %@", FIRVersionString, service, messageCode, logMsg];
  dispatch_async(sFIRClientQueue, ^{
    asl_log(sFIRLoggerClient, NULL, level, "%s", logMsg.UTF8String);
  });
}
#pragma clang diagnostic pop

/**
 * Generates the logging functions using macros.
 *
 * Calling FIRLogError(kFIRLoggerCore, @"I-COR000001", @"Configure %@ failed.", @"blah") shows:
 * yyyy-mm-dd hh:mm:ss.SSS sender[PID] <Error> [Firebase/Core][I-COR000001] Configure blah failed.
 * Calling FIRLogDebug(kFIRLoggerCore, @"I-COR000001", @"Configure succeed.") shows:
 * yyyy-mm-dd hh:mm:ss.SSS sender[PID] <Debug> [Firebase/Core][I-COR000001] Configure succeed.
 */
#define FIR_LOGGING_FUNCTION(level)                                                             \
  void FIRLog##level(FIRLoggerService service, NSString *messageCode, NSString *message, ...) { \
    va_list args_ptr;                                                                           \
    va_start(args_ptr, message);                                                                \
    FIRLogBasic(FIRLoggerLevel##level, service, messageCode, message, args_ptr);                \
    va_end(args_ptr);                                                                           \
  }

FIR_LOGGING_FUNCTION(Error)
FIR_LOGGING_FUNCTION(Warning)
FIR_LOGGING_FUNCTION(Notice)
FIR_LOGGING_FUNCTION(Info)
FIR_LOGGING_FUNCTION(Debug)

#undef FIR_MAKE_LOGGER

#pragma mark - FIRLoggerWrapper

@implementation FIRLoggerWrapper

+ (void)logWithLevel:(FIRLoggerLevel)level
         withService:(FIRLoggerService)service
            withCode:(NSString *)messageCode
         withMessage:(NSString *)message
            withArgs:(va_list)args {
  FIRLogBasic(level, service, messageCode, message, args);
}

@end
