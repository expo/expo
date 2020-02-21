/*
 * Copyright 2019 Google
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

#import "FIRInstanceIDAuthService.h"

#import "FIRInstanceIDCheckinPreferences+Internal.h"
#import "FIRInstanceIDCheckinPreferences.h"
#import "FIRInstanceIDCheckinPreferences_Private.h"
#import "FIRInstanceIDConstants.h"
#import "FIRInstanceIDDefines.h"
#import "FIRInstanceIDLogger.h"
#import "FIRInstanceIDStore.h"
#import "NSError+FIRInstanceID.h"

// Max time interval between checkin retry in seconds.
static const int64_t kMaxCheckinRetryIntervalInSeconds = 1 << 5;

@interface FIRInstanceIDAuthService ()

// Used to retrieve and cache the checkin info to disk and Keychain.
@property(nonatomic, readwrite, strong) FIRInstanceIDStore *store;
// Used to perform single checkin fetches.
@property(nonatomic, readwrite, strong) FIRInstanceIDCheckinService *checkinService;
// The current checkin info. It will be compared to what is retrieved to determine whether it is
// different than what is in the cache.
@property(nonatomic, readwrite, strong) FIRInstanceIDCheckinPreferences *checkinPreferences;

// This array will track multiple handlers waiting for checkin to be performed. When a checkin
// request completes, all the handlers will be notified.
// Changes to the checkinHandlers array should happen in a thread-safe manner.
@property(nonatomic, readonly, strong)
    NSMutableArray<FIRInstanceIDDeviceCheckinCompletion> *checkinHandlers;

// This is set to true if there is a checkin request in-flight.
@property(atomic, readwrite, assign) BOOL isCheckinInProgress;
// This timer is used a perform checkin retries. It is cancellable.
@property(atomic, readwrite, strong) NSTimer *scheduledCheckinTimer;
// The number of times checkin has been retried during a scheduled checkin.
@property(atomic, readwrite, assign) int checkinRetryCount;

@end

@implementation FIRInstanceIDAuthService

- (instancetype)initWithCheckinService:(FIRInstanceIDCheckinService *)checkinService
                                 store:(FIRInstanceIDStore *)store {
  self = [super init];
  if (self) {
    _store = store;
    _checkinPreferences = [_store cachedCheckinPreferences];
    _checkinService = checkinService;
    _checkinHandlers = [NSMutableArray array];
  }
  return self;
}

- (void)dealloc {
  [_scheduledCheckinTimer invalidate];
}

- (instancetype)initWithStore:(FIRInstanceIDStore *)store {
  FIRInstanceIDCheckinService *checkinService = [[FIRInstanceIDCheckinService alloc] init];
  return [self initWithCheckinService:checkinService store:store];
}

#pragma mark - Schedule Checkin

- (void)scheduleCheckin:(BOOL)immediately {
  // Checkin is still valid, so a remote checkin is not required.
  if ([self.checkinPreferences hasValidCheckinInfo]) {
    return;
  }

  // Checkin is already scheduled, so this (non-immediate) request can be ignored.
  if (!immediately && [self.scheduledCheckinTimer isValid]) {
    FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeAuthService000,
                             @"Checkin sync already scheduled. Will not schedule.");
    return;
  }

  if (immediately) {
    [self performScheduledCheckin];
  } else {
    int64_t checkinRetryDuration = [self calculateNextCheckinRetryIntervalInSeconds];
    [self startCheckinTimerWithDuration:(NSTimeInterval)checkinRetryDuration];
  }
}

- (void)startCheckinTimerWithDuration:(NSTimeInterval)timerDuration {
  self.scheduledCheckinTimer =
      [NSTimer scheduledTimerWithTimeInterval:timerDuration
                                       target:self
                                     selector:@selector(onScheduledCheckinTimerFired:)
                                     userInfo:nil
                                      repeats:NO];
  // Add some tolerance to the timer, to allow iOS to be more flexible with this timer
  self.scheduledCheckinTimer.tolerance = 0.5;
}

- (void)clearScheduledCheckinTimer {
  [self.scheduledCheckinTimer invalidate];
  self.scheduledCheckinTimer = nil;
}

- (void)onScheduledCheckinTimerFired:(NSTimer *)timer {
  [self performScheduledCheckin];
}

- (void)performScheduledCheckin {
  // No checkin scheduled as of now.
  [self clearScheduledCheckinTimer];

  // Checkin is still valid, so a remote checkin is not required.
  if ([self.checkinPreferences hasValidCheckinInfo]) {
    return;
  }

  FIRInstanceID_WEAKIFY(self);
  [self
      fetchCheckinInfoWithHandler:^(FIRInstanceIDCheckinPreferences *preferences, NSError *error) {
        FIRInstanceID_STRONGIFY(self);
        self.checkinRetryCount++;

        if (error) {
          FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeAuthService001, @"Checkin error %@.",
                                   error);

          dispatch_async(dispatch_get_main_queue(), ^{
            // Schedule another checkin
            [self scheduleCheckin:NO];
          });

        } else {
          FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeAuthService002, @"Checkin success.");
        }
      }];
}

- (int64_t)calculateNextCheckinRetryIntervalInSeconds {
  // persistent failures can lead to overflow prevent that.
  if (self.checkinRetryCount >= 10) {
    return kMaxCheckinRetryIntervalInSeconds;
  }
  return MIN(1 << self.checkinRetryCount, kMaxCheckinRetryIntervalInSeconds);
}

#pragma mark - Checkin Service

- (BOOL)hasValidCheckinInfo {
  return [self.checkinPreferences hasValidCheckinInfo];
}

- (void)fetchCheckinInfoWithHandler:(nonnull FIRInstanceIDDeviceCheckinCompletion)handler {
  // Perform any changes to self.checkinHandlers and _isCheckinInProgress in a thread-safe way.
  @synchronized(self) {
    [self.checkinHandlers addObject:handler];

    if (_isCheckinInProgress) {
      // Nothing more to do until our checkin request is done
      FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeAuthServiceCheckinInProgress,
                               @"Checkin is in progress\n");
      return;
    }
  }

  // Checkin is still valid, so a remote checkin is not required.
  if ([self.checkinPreferences hasValidCheckinInfo]) {
    [self notifyCheckinHandlersWithCheckin:self.checkinPreferences error:nil];
    return;
  }

  @synchronized(self) {
    _isCheckinInProgress = YES;
  }
  [self.checkinService
      checkinWithExistingCheckin:self.checkinPreferences
                      completion:^(FIRInstanceIDCheckinPreferences *checkinPreferences,
                                   NSError *error) {
                        @synchronized(self) {
                          self->_isCheckinInProgress = NO;
                        }
                        if (error) {
                          FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeAuthService003,
                                                   @"Failed to checkin device %@", error);
                          [self notifyCheckinHandlersWithCheckin:nil error:error];
                          return;
                        }

                        FIRInstanceIDLoggerDebug(kFIRInstanceIDMessageCodeAuthService004,
                                                 @"Successfully got checkin credentials");
                        BOOL hasSameCachedPreferences =
                            [self cachedCheckinMatchesCheckin:checkinPreferences];
                        checkinPreferences.hasPreCachedAuthCredentials = hasSameCachedPreferences;

                        // Update to the most recent checkin preferences
                        self.checkinPreferences = checkinPreferences;

                        // Save the checkin info to disk
                        // Keychain might not be accessible, so confirm that checkin preferences can
                        // be saved
                        [self.store
                            saveCheckinPreferences:checkinPreferences
                                           handler:^(NSError *checkinSaveError) {
                                             if (checkinSaveError && !hasSameCachedPreferences) {
                                               // The checkin info was new, but it couldn't be
                                               // written to the Keychain. Delete any stuff that was
                                               // cached in memory. This doesn't delete any
                                               // previously persisted preferences.
                                               FIRInstanceIDLoggerError(
                                                   kFIRInstanceIDMessageCodeService004,
                                                   @"Unable to save checkin info, resetting "
                                                   @"checkin preferences "
                                                    "in memory.");
                                               [checkinPreferences reset];
                                               [self
                                                   notifyCheckinHandlersWithCheckin:nil
                                                                              error:
                                                                                  checkinSaveError];
                                             } else {
                                               // The checkin is either new, or it was the same (and
                                               // it couldn't be saved). Either way, report that the
                                               // checkin preferences were received successfully.
                                               [self notifyCheckinHandlersWithCheckin:
                                                         checkinPreferences
                                                                                error:nil];
                                               if (!hasSameCachedPreferences) {
                                                 // Checkin is new.
                                                 // Notify any listeners that might be waiting for
                                                 // checkin to be fetched, such as Firebase
                                                 // Messaging (for its MCS connection).
                                                 dispatch_async(dispatch_get_main_queue(), ^{
                                                   [[NSNotificationCenter defaultCenter]
                                                       postNotificationName:
                                                           kFIRInstanceIDCheckinFetchedNotification
                                                                     object:nil];
                                                 });
                                               }
                                             }
                                           }];
                      }];
}

- (FIRInstanceIDCheckinPreferences *)checkinPreferences {
  return _checkinPreferences;
}

- (void)stopCheckinRequest {
  [self.checkinService stopFetching];
}

- (void)resetCheckinWithHandler:(void (^)(NSError *error))handler {
  [self.store removeCheckinPreferencesWithHandler:^(NSError *error) {
    if (!error) {
      self.checkinPreferences = nil;
    }
    if (handler) {
      handler(error);
    }
  }];
}

#pragma mark - Private

/**
 *  Goes through the current list of checkin handlers and fires them with the same checkin and/or
 *  error info. The checkin handlers will get cleared after.
 */
- (void)notifyCheckinHandlersWithCheckin:(nullable FIRInstanceIDCheckinPreferences *)checkin
                                   error:(nullable NSError *)error {
  @synchronized(self) {
    for (FIRInstanceIDDeviceCheckinCompletion handler in self.checkinHandlers) {
      handler(checkin, error);
    }
    [self.checkinHandlers removeAllObjects];
  }
}

/**
 *  Given a |checkin|, it will compare it to the current checkinPreferences to see if the
 *  deviceID and secretToken are the same.
 */
- (BOOL)cachedCheckinMatchesCheckin:(FIRInstanceIDCheckinPreferences *)checkin {
  if (self.checkinPreferences && checkin) {
    return ([self.checkinPreferences.deviceID isEqualToString:checkin.deviceID] &&
            [self.checkinPreferences.secretToken isEqualToString:checkin.secretToken]);
  }
  return NO;
}
@end
