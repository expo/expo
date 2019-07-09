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

#import <FirebaseCore/FIRLoggerLevel.h>
#import <GoogleUtilities/GULAppEnvironmentUtil.h>
#import <GoogleUtilities/GULLogger.h>

#import "Private/FIRVersion.h"

FIRLoggerService kFIRLoggerCore = @"[Firebase/Core]";

// All the FIRLoggerService definitions should be migrated to clients. Do not add new ones!
FIRLoggerService kFIRLoggerABTesting = @"[Firebase/ABTesting]";
FIRLoggerService kFIRLoggerAdMob = @"[Firebase/AdMob]";
FIRLoggerService kFIRLoggerAnalytics = @"[Firebase/Analytics]";
FIRLoggerService kFIRLoggerAuth = @"[Firebase/Auth]";
FIRLoggerService kFIRLoggerCrash = @"[Firebase/Crash]";
FIRLoggerService kFIRLoggerMLKit = @"[Firebase/MLKit]";
FIRLoggerService kFIRLoggerPerf = @"[Firebase/Performance]";
FIRLoggerService kFIRLoggerRemoteConfig = @"[Firebase/RemoteConfig]";

/// Arguments passed on launch.
NSString *const kFIRDisableDebugModeApplicationArgument = @"-FIRDebugDisabled";
NSString *const kFIREnableDebugModeApplicationArgument = @"-FIRDebugEnabled";
NSString *const kFIRLoggerForceSDTERRApplicationArgument = @"-FIRLoggerForceSTDERR";

/// Key for the debug mode bit in NSUserDefaults.
NSString *const kFIRPersistedDebugModeKey = @"/google/firebase/debug_mode";

/// NSUserDefaults that should be used to store and read variables. If nil, `standardUserDefaults`
/// will be used.
static NSUserDefaults *sFIRLoggerUserDefaults;

static dispatch_once_t sFIRLoggerOnceToken;

// The sFIRAnalyticsDebugMode flag is here to support the -FIRDebugEnabled/-FIRDebugDisabled
// flags used by Analytics. Users who use those flags expect Analytics to log verbosely,
// while the rest of Firebase logs at the default level. This flag is introduced to support
// that behavior.
static BOOL sFIRAnalyticsDebugMode;

#ifdef DEBUG
/// The regex pattern for the message code.
static NSString *const kMessageCodePattern = @"^I-[A-Z]{3}[0-9]{6}$";
static NSRegularExpression *sMessageCodeRegex;
#endif

void FIRLoggerInitializeASL() {
  dispatch_once(&sFIRLoggerOnceToken, ^{
    // Register Firebase Version with GULLogger.
    GULLoggerRegisterVersion(FIRVersionString);

    // Override the aslOptions to ASL_OPT_STDERR if the override argument is passed in.
    NSArray *arguments = [NSProcessInfo processInfo].arguments;
    BOOL overrideSTDERR = [arguments containsObject:kFIRLoggerForceSDTERRApplicationArgument];

    // Use the standard NSUserDefaults if it hasn't been explicitly set.
    if (sFIRLoggerUserDefaults == nil) {
      sFIRLoggerUserDefaults = [NSUserDefaults standardUserDefaults];
    }

    BOOL forceDebugMode = NO;
    BOOL debugMode = [sFIRLoggerUserDefaults boolForKey:kFIRPersistedDebugModeKey];
    if ([arguments containsObject:kFIRDisableDebugModeApplicationArgument]) {  // Default mode
      [sFIRLoggerUserDefaults removeObjectForKey:kFIRPersistedDebugModeKey];
    } else if ([arguments containsObject:kFIREnableDebugModeApplicationArgument] ||
               debugMode) {  // Debug mode
      [sFIRLoggerUserDefaults setBool:YES forKey:kFIRPersistedDebugModeKey];
      forceDebugMode = YES;
    }
    GULLoggerInitializeASL();
    if (overrideSTDERR) {
      GULLoggerEnableSTDERR();
    }
    if (forceDebugMode) {
      GULLoggerForceDebug();
    }
  });
}

__attribute__((no_sanitize("thread"))) void FIRSetAnalyticsDebugMode(BOOL analyticsDebugMode) {
  sFIRAnalyticsDebugMode = analyticsDebugMode;
}

void FIRSetLoggerLevel(FIRLoggerLevel loggerLevel) {
  FIRLoggerInitializeASL();
  GULSetLoggerLevel((GULLoggerLevel)loggerLevel);
}

#ifdef DEBUG
void FIRResetLogger() {
  extern void GULResetLogger(void);
  sFIRLoggerOnceToken = 0;
  [sFIRLoggerUserDefaults removeObjectForKey:kFIRPersistedDebugModeKey];
  sFIRLoggerUserDefaults = nil;
  GULResetLogger();
}

void FIRSetLoggerUserDefaults(NSUserDefaults *defaults) {
  sFIRLoggerUserDefaults = defaults;
}
#endif

/**
 * Check if the level is high enough to be loggable.
 *
 * Analytics can override the log level with an intentional race condition.
 * Add the attribute to get a clean thread sanitizer run.
 */
__attribute__((no_sanitize("thread"))) BOOL FIRIsLoggableLevel(FIRLoggerLevel loggerLevel,
                                                               BOOL analyticsComponent) {
  FIRLoggerInitializeASL();
  if (sFIRAnalyticsDebugMode && analyticsComponent) {
    return YES;
  }
  return GULIsLoggableLevel((GULLoggerLevel)loggerLevel);
}

void FIRLogBasic(FIRLoggerLevel level,
                 FIRLoggerService service,
                 NSString *messageCode,
                 NSString *message,
                 va_list args_ptr) {
  FIRLoggerInitializeASL();
  GULLogBasic((GULLoggerLevel)level, service,
              sFIRAnalyticsDebugMode && [kFIRLoggerAnalytics isEqualToString:service], messageCode,
              message, args_ptr);
}

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
