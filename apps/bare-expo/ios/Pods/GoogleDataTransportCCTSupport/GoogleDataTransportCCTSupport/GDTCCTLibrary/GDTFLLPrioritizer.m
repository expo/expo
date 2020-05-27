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

#import "GDTCCTLibrary/Private/GDTFLLPrioritizer.h"

#import <GoogleDataTransport/GDTCOREvent.h>
#import <GoogleDataTransport/GDTCORRegistrar.h>
#import <GoogleDataTransport/GDTCORStoredEvent.h>
#import <GoogleDataTransport/GDTCORTargets.h>

const static int64_t kMillisPerDay = 8.64e+7;

@implementation GDTFLLPrioritizer

+ (void)load {
  GDTFLLPrioritizer *prioritizer = [GDTFLLPrioritizer sharedInstance];
  [[GDTCORRegistrar sharedInstance] registerPrioritizer:prioritizer target:kGDTCORTargetFLL];
}

+ (instancetype)sharedInstance {
  static GDTFLLPrioritizer *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTFLLPrioritizer alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _queue = dispatch_queue_create("com.google.GDTFLLPrioritizer", DISPATCH_QUEUE_SERIAL);
    _events = [[NSMutableSet alloc] init];
  }
  return self;
}

#pragma mark - GDTCORPrioritizer Protocol

- (void)prioritizeEvent:(GDTCORStoredEvent *)event {
  dispatch_async(_queue, ^{
    [self.events addObject:event];
  });
}

- (GDTCORUploadPackage *)uploadPackageWithConditions:(GDTCORUploadConditions)conditions {
  GDTCORUploadPackage *package = [[GDTCORUploadPackage alloc] initWithTarget:kGDTCORTargetFLL];
  dispatch_sync(_queue, ^{
    NSSet<GDTCORStoredEvent *> *logEventsThatWillBeSent;
    // A high priority event effectively flushes all events to be sent.
    if ((conditions & GDTCORUploadConditionHighPriority) == GDTCORUploadConditionHighPriority) {
      package.events = self.events;
      return;
    }

    // If on wifi, upload logs that are ok to send on wifi.
    if ((conditions & GDTCORUploadConditionWifiData) == GDTCORUploadConditionWifiData) {
      logEventsThatWillBeSent = [self logEventsOkToSendOnWifi];
    } else {
      logEventsThatWillBeSent = [self logEventsOkToSendOnMobileData];
    }

    // If it's been > 24h since the last daily upload, upload logs with the daily QoS.
    if (self.timeOfLastDailyUpload) {
      int64_t millisSinceLastUpload =
          [GDTCORClock snapshot].timeMillis - self.timeOfLastDailyUpload.timeMillis;
      if (millisSinceLastUpload > kMillisPerDay) {
        logEventsThatWillBeSent =
            [logEventsThatWillBeSent setByAddingObjectsFromSet:[self logEventsOkToSendDaily]];
      }
    } else {
      self.timeOfLastDailyUpload = [GDTCORClock snapshot];
      logEventsThatWillBeSent =
          [logEventsThatWillBeSent setByAddingObjectsFromSet:[self logEventsOkToSendDaily]];
    }
    package.events = logEventsThatWillBeSent;
  });
  return package;
}

#pragma mark - Private helper methods

/** The different possible quality of service specifiers. High values indicate high priority. */
typedef NS_ENUM(NSInteger, GDTFLLQoSTier) {
  /** The QoS tier wasn't set, and won't ever be sent. */
  GDTFLLQoSDefault = 0,

  /** This event is internal telemetry data that should not be sent on its own if possible. */
  GDTFLLQoSTelemetry = 1,

  /** This event should be sent, but in a batch only roughly once per day. */
  GDTFLLQoSDaily = 2,

  /** This event should only be uploaded on wifi. */
  GDTFLLQoSWifiOnly = 5,
};

/** Converts a GDTCOREventQoS to a GDTFLLQoS tier.
 *
 * @param qosTier The GDTCOREventQoS value.
 * @return A static NSNumber that represents the CCT QoS tier.
 */
FOUNDATION_STATIC_INLINE
NSNumber *GDTCCTQosTierFromGDTCOREventQosTier(GDTCOREventQoS qosTier) {
  switch (qosTier) {
    case GDTCOREventQoSWifiOnly:
      return @(GDTFLLQoSWifiOnly);
      break;

    case GDTCOREventQoSTelemetry:
      // falls through.
    case GDTCOREventQoSDaily:
      return @(GDTFLLQoSDaily);
      break;

    default:
      return @(GDTFLLQoSDefault);
      break;
  }
}

/** Returns a set of logs that are ok to upload whilst on mobile data.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload whilst on mobile data.
 */
- (NSSet<GDTCORStoredEvent *> *)logEventsOkToSendOnMobileData {
  return [self.events
      objectsPassingTest:^BOOL(GDTCORStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        return [GDTCCTQosTierFromGDTCOREventQosTier(event.qosTier) isEqual:@(GDTFLLQoSDefault)];
      }];
}

/** Returns a set of logs that are ok to upload whilst on wifi.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload whilst on wifi.
 */
- (NSSet<GDTCORStoredEvent *> *)logEventsOkToSendOnWifi {
  return [self.events
      objectsPassingTest:^BOOL(GDTCORStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        NSNumber *qosTier = GDTCCTQosTierFromGDTCOREventQosTier(event.qosTier);
        return [qosTier isEqual:@(GDTFLLQoSDefault)] || [qosTier isEqual:@(GDTFLLQoSWifiOnly)] ||
               [qosTier isEqual:@(GDTFLLQoSDaily)];
      }];
}

/** Returns a set of logs that only should have a single upload attempt per day.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload only once per day.
 */
- (NSSet<GDTCORStoredEvent *> *)logEventsOkToSendDaily {
  return [self.events
      objectsPassingTest:^BOOL(GDTCORStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        return [GDTCCTQosTierFromGDTCOREventQosTier(event.qosTier) isEqual:@(GDTFLLQoSDaily)];
      }];
}

#pragma mark - GDTCORUploadPackageProtocol

- (void)packageDelivered:(GDTCORUploadPackage *)package successful:(BOOL)successful {
  dispatch_async(_queue, ^{
    NSSet<GDTCORStoredEvent *> *events = [package.events copy];
    for (GDTCORStoredEvent *event in events) {
      [self.events removeObject:event];
    }
  });
}

- (void)packageExpired:(GDTCORUploadPackage *)package {
  [self packageDelivered:package successful:YES];
}

@end
