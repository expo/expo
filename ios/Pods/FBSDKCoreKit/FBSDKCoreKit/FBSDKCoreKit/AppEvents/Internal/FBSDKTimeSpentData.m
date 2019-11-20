// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKTimeSpentData.h"

#import "FBSDKAppEvents+Internal.h"
#import "FBSDKAppEventsUtility.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKServerConfiguration.h"
#import "FBSDKServerConfigurationManager.h"
#import "FBSDKSettings.h"


// Filename and keys for session length
NSString *const FBSDKTimeSpentFilename                                           = @"com-facebook-sdk-AppEventsTimeSpent.json";
static NSString *const FBSDKTimeSpentPersistKeySessionSecondsSpent               = @"secondsSpentInCurrentSession";
static NSString *const FBSDKTimeSpentPersistKeySessionNumInterruptions           = @"numInterruptions";
static NSString *const FBSDKTimeSpentPersistKeyLastSuspendTime                   = @"lastSuspendTime";
static NSString *const FBSDKTimeSpentPersistKeySessionID                         = @"sessionID";

static NSString *const FBSDKAppEventNameActivatedApp                             = @"fb_mobile_activate_app";
static NSString *const FBSDKAppEventNameDeactivatedApp                           = @"fb_mobile_deactivate_app";
static NSString *const FBSDKAppEventParameterNameSessionInterruptions            = @"fb_mobile_app_interruptions";
static NSString *const FBSDKAppEventParameterNameTimeBetweenSessions             = @"fb_mobile_time_between_sessions";
static NSString *const FBSDKAppEventParameterNameSessionID                       = @"_session_id";


static const int SECS_PER_MIN                       = 60;
static const int SECS_PER_HOUR                      = 60 * SECS_PER_MIN;
static const int SECS_PER_DAY                       = 24 * SECS_PER_HOUR;

static NSString *g_sourceApplication;
static BOOL g_isOpenedFromAppLink;

// Will be translated and displayed in App Insights.  Need to maintain same number and value of quanta on the server.
static const long INACTIVE_SECONDS_QUANTA[] =
{
  5 * SECS_PER_MIN,
  15 * SECS_PER_MIN,
  30 * SECS_PER_MIN,
  1 * SECS_PER_HOUR,
  6 * SECS_PER_HOUR,
  12 * SECS_PER_HOUR,
  1 * SECS_PER_DAY,
  2 * SECS_PER_DAY,
  3 * SECS_PER_DAY,
  7 * SECS_PER_DAY,
  14 * SECS_PER_DAY,
  21 * SECS_PER_DAY,
  28 * SECS_PER_DAY,
  60 * SECS_PER_DAY,
  90 * SECS_PER_DAY,
  120 * SECS_PER_DAY,
  150 * SECS_PER_DAY,
  180 * SECS_PER_DAY,
  365 * SECS_PER_DAY,
  LONG_MAX,   // keep as LONG_MAX to guarantee loop will terminate
};

/**
 * This class encapsulates the notion of an app 'session' - the length of time that the user has
 * spent in the app that can be considered a single usage of the app.  Apps may be frequently interrupted
 * do to other device activity, like a text message, so this class allows those interruptions to be smoothed
 * out and the time actually spent in the app excluding this interruption time to be accumulated.  Also,
 * once a certain amount of time has gone by where the app is not in the foreground, we consider the
 * session to be complete, and a new session beginning.  When this occurs, we log a 'deactivate app' event
 * with the duration of the previous session as the 'value' of this event, along with the number of
 * interruptions from that previous session as an event parameter.
 */
@implementation FBSDKTimeSpentData
{
  BOOL _isCurrentlyLoaded;
  BOOL _shouldLogActivateEvent;
  BOOL _shouldLogDeactivateEvent;
  long  _secondsSpentInCurrentSession;
  long  _timeSinceLastSuspend;
  int  _numInterruptionsInCurrentSession;
  long _lastRestoreTime;
  long _lastSuspendTime;
  NSString *_sessionID;
}

//
// Public methods
//

+ (void)suspend
{
  [self.singleton instanceSuspend];
}

+ (void)restore:(BOOL)calledFromActivateApp
{
  [self.singleton instanceRestore:calledFromActivateApp];
}

//
// Internal methods
//
+ (FBSDKTimeSpentData *)singleton
{
  static dispatch_once_t pred;
  static FBSDKTimeSpentData *shared = nil;

  dispatch_once(&pred, ^{
    shared = [[FBSDKTimeSpentData alloc] init];
  });
  return shared;
}

// Calculate and persist time spent data for this instance of the app activation.
- (void)instanceSuspend
{

  [FBSDKAppEventsUtility ensureOnMainThread:NSStringFromSelector(_cmd) className:NSStringFromClass([self class])];
  if (!_isCurrentlyLoaded) {
    FBSDKConditionalLog(YES, FBSDKLoggingBehaviorInformational, @"[FBSDKTimeSpentData suspend] invoked without corresponding restore");
    return;
  }

  long now = [FBSDKAppEventsUtility unixTimeNow];
  long timeSinceRestore = now - _lastRestoreTime;

  // Can happen if the clock on the device is changed
  if (timeSinceRestore < 0) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAppEvents
                       formatString:@"Clock skew detected"];
    timeSinceRestore = 0;
  }

  _secondsSpentInCurrentSession += timeSinceRestore;

  NSDictionary *timeSpentData =
  @{
    FBSDKTimeSpentPersistKeySessionSecondsSpent : @(_secondsSpentInCurrentSession),
    FBSDKTimeSpentPersistKeySessionNumInterruptions : @(_numInterruptionsInCurrentSession),
    FBSDKTimeSpentPersistKeyLastSuspendTime : @(now),
    FBSDKTimeSpentPersistKeySessionID : _sessionID,
    };

  NSString *content = [FBSDKBasicUtility JSONStringForObject:timeSpentData error:NULL invalidObjectHandler:NULL];

  [content writeToFile:[FBSDKBasicUtility persistenceFilePath:FBSDKTimeSpentFilename]
            atomically:YES
              encoding:NSASCIIStringEncoding
                 error:nil];

  [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAppEvents
                     formatString:@"FBSDKTimeSpentData Persist: %@", content];

  _isCurrentlyLoaded = NO;
}


// Called during activation - either through an explicit 'activateApp' call or implicitly when the app is foregrounded.
// In both cases, we restore the persisted event data.  In the case of the activateApp, we log an 'app activated'
// event if there's been enough time between the last deactivation and now.
- (void)instanceRestore:(BOOL)calledFromActivateApp
{

  [FBSDKAppEventsUtility ensureOnMainThread:NSStringFromSelector(_cmd) className:NSStringFromClass([self class])];

  // It's possible to call this multiple times during the time the app is in the foreground.  If this is the case,
  // just restore persisted data the first time.
  if (!_isCurrentlyLoaded) {

    NSString *content =
    [[NSString alloc] initWithContentsOfFile:[FBSDKBasicUtility persistenceFilePath:FBSDKTimeSpentFilename]
                                usedEncoding:nil
                                       error:nil];

    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAppEvents
                       formatString:@"FBSDKTimeSpentData Restore: %@", content];

    long now = [FBSDKAppEventsUtility unixTimeNow];
    if (!content) {

      // Nothing persisted, so this is the first launch.
      _sessionID = [NSUUID UUID].UUIDString;
      _secondsSpentInCurrentSession = 0;
      _numInterruptionsInCurrentSession = 0;
      _lastSuspendTime = 0;

      // We want to log the app activation event on the first launch, but not the deactivate event
      _shouldLogActivateEvent = YES;
      _shouldLogDeactivateEvent = NO;

    } else {

      NSDictionary<id, id> *results = [FBSDKBasicUtility objectForJSONString:content error:NULL];

      _lastSuspendTime = [results[FBSDKTimeSpentPersistKeyLastSuspendTime] longValue];

      _timeSinceLastSuspend = now - _lastSuspendTime;
      _secondsSpentInCurrentSession = [results[FBSDKTimeSpentPersistKeySessionSecondsSpent] intValue];
      _sessionID = results[FBSDKTimeSpentPersistKeySessionID] ? : [NSUUID UUID].UUIDString;
      _numInterruptionsInCurrentSession = [results[FBSDKTimeSpentPersistKeySessionNumInterruptions] intValue];
      _shouldLogActivateEvent = (_timeSinceLastSuspend > [FBSDKServerConfigurationManager cachedServerConfiguration].sessionTimoutInterval);

      // Other than the first launch, we always log the last session's deactivate with this session's activate.
      _shouldLogDeactivateEvent = _shouldLogActivateEvent;

      if (!_shouldLogDeactivateEvent) {
        // If we're not logging, then the time we spent deactivated is considered another interruption.  But cap it
        // so errant or test uses doesn't blow out the cardinality on the backend processing
        _numInterruptionsInCurrentSession = MIN(_numInterruptionsInCurrentSession + 1, 200);
      }

    }

    _lastRestoreTime = now;
    _isCurrentlyLoaded = YES;

    if (calledFromActivateApp) {
      // It's important to log deactivate first to reset sessionID
      if (_shouldLogDeactivateEvent) {
        [FBSDKAppEvents logEvent:FBSDKAppEventNameDeactivatedApp
                      valueToSum:_secondsSpentInCurrentSession
                      parameters:[self appEventsParametersForDeactivate]];

        // We've logged the session stats, now reset.
        _secondsSpentInCurrentSession = 0;
        _numInterruptionsInCurrentSession = 0;
        _sessionID = [NSUUID UUID].UUIDString;
      }

      if (_shouldLogActivateEvent) {
        [FBSDKAppEvents logEvent:FBSDKAppEventNameActivatedApp
                      parameters:[self appEventsParametersForActivate]];
        // Unless the behavior is set to only allow explicit flushing, we go ahead and flush. App launch
        // events are critical to Analytics so we don't want to lose them.
        if ([FBSDKAppEvents flushBehavior] != FBSDKAppEventsFlushBehaviorExplicitOnly) {
          [[FBSDKAppEvents singleton] flushForReason:FBSDKAppEventsFlushReasonEagerlyFlushingEvent];
        }
      }
    }
  }
}

- (NSDictionary *)appEventsParametersForActivate
{
  return @{
           FBSDKAppEventParameterLaunchSource: [[self class] getSourceApplication],
           FBSDKAppEventParameterNameSessionID: _sessionID,
           };
}

- (NSDictionary *)appEventsParametersForDeactivate
{
  int quantaIndex = 0;
  while (_timeSinceLastSuspend > INACTIVE_SECONDS_QUANTA[quantaIndex]) {
    quantaIndex++;
  }

  NSMutableDictionary *params = [@{ FBSDKAppEventParameterNameSessionInterruptions : @(_numInterruptionsInCurrentSession),
                                    FBSDKAppEventParameterNameTimeBetweenSessions : [NSString stringWithFormat:@"session_quanta_%d", quantaIndex],
                                    FBSDKAppEventParameterLaunchSource: [[self class] getSourceApplication],
                                    FBSDKAppEventParameterNameSessionID : _sessionID ?: @"",
                                    } mutableCopy];
  if (_lastSuspendTime) {
    params[FBSDKAppEventParameterLogTime] = @(_lastSuspendTime);
  }
  return [params copy];
}

+ (void)setSourceApplication:(NSString *)sourceApplication openURL:(NSURL *)url
{
  [self setSourceApplication:sourceApplication
               isFromAppLink:[FBSDKInternalUtility dictionaryFromFBURL:url][@"al_applink_data"] != nil];
}

+ (void)setSourceApplication:(NSString *)sourceApplication isFromAppLink:(BOOL)isFromAppLink
{
  g_isOpenedFromAppLink = isFromAppLink;
  g_sourceApplication = sourceApplication;
}

+ (NSString *)getSourceApplication
{
  NSString *openType = @"Unclassified";
  if (g_isOpenedFromAppLink) {
    openType = @"AppLink";
  }
  return (g_sourceApplication ?
          [NSString stringWithFormat:@"%@(%@)", openType, g_sourceApplication]
          : openType);
}

+ (void)resetSourceApplication
{
  g_sourceApplication = nil;
  g_isOpenedFromAppLink = NO;
}

+ (void)registerAutoResetSourceApplication
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(resetSourceApplication)
                                               name:UIApplicationDidEnterBackgroundNotification
                                             object:nil];
}

@end
