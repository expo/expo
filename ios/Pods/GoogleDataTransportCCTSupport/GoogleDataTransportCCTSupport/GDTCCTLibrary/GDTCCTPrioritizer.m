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

#import "GDTCCTLibrary/Private/GDTCCTPrioritizer.h"

#import <GoogleDataTransport/GDTEvent.h>
#import <GoogleDataTransport/GDTRegistrar.h>
#import <GoogleDataTransport/GDTStoredEvent.h>
#import <GoogleDataTransport/GDTTargets.h>

const static int64_t kMillisPerDay = 8.64e+7;

@implementation GDTCCTPrioritizer

+ (void)load {
  GDTCCTPrioritizer *prioritizer = [GDTCCTPrioritizer sharedInstance];
  [[GDTRegistrar sharedInstance] registerPrioritizer:prioritizer target:kGDTTargetCCT];
}

+ (instancetype)sharedInstance {
  static GDTCCTPrioritizer *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTCCTPrioritizer alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _queue = dispatch_queue_create("com.google.GDTCCTPrioritizer", DISPATCH_QUEUE_SERIAL);
    _events = [[NSMutableSet alloc] init];
  }
  return self;
}

#pragma mark - GDTPrioritizer Protocol

- (void)prioritizeEvent:(GDTStoredEvent *)event {
  dispatch_async(_queue, ^{
    [self.events addObject:event];
  });
}

- (GDTUploadPackage *)uploadPackageWithConditions:(GDTUploadConditions)conditions {
  GDTUploadPackage *package = [[GDTUploadPackage alloc] initWithTarget:kGDTTargetCCT];
  dispatch_sync(_queue, ^{
    NSSet<GDTStoredEvent *> *logEventsThatWillBeSent;
    // A high priority event effectively flushes all events to be sent.
    if ((conditions & GDTUploadConditionHighPriority) == GDTUploadConditionHighPriority) {
      package.events = self.events;
      return;
    }

    // If on wifi, upload logs that are ok to send on wifi.
    if ((conditions & GDTUploadConditionWifiData) == GDTUploadConditionWifiData) {
      logEventsThatWillBeSent = [self logEventsOkToSendOnWifi];
    } else {
      logEventsThatWillBeSent = [self logEventsOkToSendOnMobileData];
    }

    // If it's been > 24h since the last daily upload, upload logs with the daily QoS.
    if (self.timeOfLastDailyUpload) {
      int64_t millisSinceLastUpload =
          [GDTClock snapshot].timeMillis - self.timeOfLastDailyUpload.timeMillis;
      if (millisSinceLastUpload > kMillisPerDay) {
        logEventsThatWillBeSent =
            [logEventsThatWillBeSent setByAddingObjectsFromSet:[self logEventsOkToSendDaily]];
      }
    } else {
      self.timeOfLastDailyUpload = [GDTClock snapshot];
      logEventsThatWillBeSent =
          [logEventsThatWillBeSent setByAddingObjectsFromSet:[self logEventsOkToSendDaily]];
    }
    package.events = logEventsThatWillBeSent;
  });
  return package;
}

#pragma mark - Private helper methods

/** The different possible quality of service specifiers. High values indicate high priority. */
typedef NS_ENUM(NSInteger, GDTCCTQoSTier) {
  /** The QoS tier wasn't set, and won't ever be sent. */
  GDTCCTQoSDefault = 0,

  /** This event is internal telemetry data that should not be sent on its own if possible. */
  GDTCCTQoSTelemetry = 1,

  /** This event should be sent, but in a batch only roughly once per day. */
  GDTCCTQoSDaily = 2,

  /** This event should only be uploaded on wifi. */
  GDTCCTQoSWifiOnly = 5,
};

/** Converts a GDTEventQoS to a GDTCCTQoS tier.
 *
 * @param qosTier The GDTEventQoS value.
 * @return A static NSNumber that represents the CCT QoS tier.
 */
FOUNDATION_STATIC_INLINE
NSNumber *GDTCCTQosTierFromGDTEventQosTier(GDTEventQoS qosTier) {
  switch (qosTier) {
    case GDTEventQoSWifiOnly:
      return @(GDTCCTQoSWifiOnly);
      break;

    case GDTEventQoSTelemetry:
      // falls through.
    case GDTEventQoSDaily:
      return @(GDTCCTQoSDaily);
      break;

    default:
      return @(GDTCCTQoSDefault);
      break;
  }
}

/** Returns a set of logs that are ok to upload whilst on mobile data.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload whilst on mobile data.
 */
- (NSSet<GDTStoredEvent *> *)logEventsOkToSendOnMobileData {
  return
      [self.events objectsPassingTest:^BOOL(GDTStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        return [GDTCCTQosTierFromGDTEventQosTier(event.qosTier) isEqual:@(GDTCCTQoSDefault)];
      }];
}

/** Returns a set of logs that are ok to upload whilst on wifi.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload whilst on wifi.
 */
- (NSSet<GDTStoredEvent *> *)logEventsOkToSendOnWifi {
  return
      [self.events objectsPassingTest:^BOOL(GDTStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        NSNumber *qosTier = GDTCCTQosTierFromGDTEventQosTier(event.qosTier);
        return [qosTier isEqual:@(GDTCCTQoSDefault)] || [qosTier isEqual:@(GDTCCTQoSWifiOnly)] ||
               [qosTier isEqual:@(GDTCCTQoSDaily)];
      }];
}

/** Returns a set of logs that only should have a single upload attempt per day.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload only once per day.
 */
- (NSSet<GDTStoredEvent *> *)logEventsOkToSendDaily {
  return
      [self.events objectsPassingTest:^BOOL(GDTStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        return [GDTCCTQosTierFromGDTEventQosTier(event.qosTier) isEqual:@(GDTCCTQoSDaily)];
      }];
}

#pragma mark - GDTUploadPackageProtocol

- (void)packageDelivered:(GDTUploadPackage *)package successful:(BOOL)successful {
  dispatch_async(_queue, ^{
    NSSet<GDTStoredEvent *> *events = [package.events copy];
    for (GDTStoredEvent *event in events) {
      [self.events removeObject:event];
    }
  });
}

- (void)packageExpired:(GDTUploadPackage *)package {
  [self packageDelivered:package successful:YES];
}

@end
