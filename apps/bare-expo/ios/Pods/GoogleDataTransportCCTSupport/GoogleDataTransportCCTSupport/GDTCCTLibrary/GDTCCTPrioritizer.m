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

#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCOREvent.h>
#import <GoogleDataTransport/GDTCORPlatform.h>
#import <GoogleDataTransport/GDTCORRegistrar.h>
#import <GoogleDataTransport/GDTCORTargets.h>

#import "GDTCCTLibrary/Private/GDTCCTNanopbHelpers.h"
#import "GDTCCTLibrary/Private/GDTCOREvent+NetworkConnectionInfo.h"

const static int64_t kMillisPerDay = 8.64e+7;

/** Creates and/or returns a singleton NSString that is the NSCoding file location.
 *
 * @return The NSCoding file path.
 */
static NSString *ArchivePath() {
  static NSString *archivePath;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    archivePath = [GDTCORRootDirectory() URLByAppendingPathComponent:@"GDTCCTPrioritizer"].path;
  });
  return archivePath;
}

/** This class extension is for declaring private properties. */
@interface GDTCCTPrioritizer ()

/** All CCT events that have been processed by this prioritizer. */
@property(nonatomic) NSMutableSet<GDTCOREvent *> *CCTEvents;

/** All FLL events that have been processed by this prioritizer. */
@property(nonatomic) NSMutableSet<GDTCOREvent *> *FLLEvents;

/** All CSH events that have been processed by this prioritizer. */
@property(nonatomic) NSMutableSet<GDTCOREvent *> *CSHEvents;

@end

@implementation GDTCCTPrioritizer

+ (void)load {
  GDTCCTPrioritizer *prioritizer = [GDTCCTPrioritizer sharedInstance];
  [[GDTCORRegistrar sharedInstance] registerPrioritizer:prioritizer target:kGDTCORTargetCCT];
  [[GDTCORRegistrar sharedInstance] registerPrioritizer:prioritizer target:kGDTCORTargetFLL];
  [[GDTCORRegistrar sharedInstance] registerPrioritizer:prioritizer target:kGDTCORTargetCSH];
}

+ (BOOL)supportsSecureCoding {
  return YES;
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
    _CCTEvents = [[NSMutableSet alloc] init];
    _FLLEvents = [[NSMutableSet alloc] init];
    _CSHEvents = [[NSMutableSet alloc] init];
  }
  return self;
}

- (nullable NSSet *)eventsForTarget:(GDTCORTarget)target {
  __block NSSet *events;
  dispatch_sync(_queue, ^{
    switch (target) {
      case kGDTCORTargetCCT:
        events = [self->_CCTEvents copy];
        break;

      case kGDTCORTargetFLL:
        events = [self->_FLLEvents copy];
        break;

      case kGDTCORTargetCSH:
        events = [self->_CSHEvents copy];
        break;

      default:
        break;
    }
  });
  return events;
}

#pragma mark - GDTCORPrioritizer Protocol

- (void)prioritizeEvent:(GDTCOREvent *)event {
  if (event.needsNetworkConnectionInfoPopulated) {
    event.networkConnectionInfoData = GDTCCTConstructNetworkConnectionInfoData();
  }
  dispatch_async(_queue, ^{
    switch (event.target) {
      case kGDTCORTargetCCT:
        [self.CCTEvents addObject:event];
        break;

      case kGDTCORTargetFLL:
        [self.FLLEvents addObject:event];
        break;

      case kGDTCORTargetCSH:
        [self.CSHEvents addObject:event];
        break;

      default:
        GDTCORLogDebug(@"GDTCCTPrioritizer doesn't support target %ld", (long)event.target);
        break;
    }
  });
}

- (GDTCORUploadPackage *)uploadPackageWithTarget:(GDTCORTarget)target
                                      conditions:(GDTCORUploadConditions)conditions {
  GDTCORUploadPackage *package = [[GDTCORUploadPackage alloc] initWithTarget:target];
  dispatch_sync(_queue, ^{
    NSSet<GDTCOREvent *> *eventsThatWillBeSent = [self eventsForTarget:target
                                                            conditions:conditions];
    package.events = eventsThatWillBeSent;
  });
  GDTCORLogDebug(@"CCT: %lu events are in the upload package", (unsigned long)package.events.count);
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

- (void)saveState {
  dispatch_sync(_queue, ^{
    NSError *error;
    GDTCOREncodeArchive(self, ArchivePath(), &error);
    if (error) {
      GDTCORLogDebug(@"Serializing GDTCCTPrioritizer to an archive failed: %@", error);
    }
  });
  GDTCORLogDebug(@"GDTCCTPrioritizer saved state to %@ as requested by GDT.", ArchivePath());
}

/** Converts a GDTCOREventQoS to a GDTCCTQoS tier.
 *
 * @param qosTier The GDTCOREventQoS value.
 * @return A static NSNumber that represents the CCT QoS tier.
 */
FOUNDATION_STATIC_INLINE
NSNumber *GDTCCTQosTierFromGDTCOREventQosTier(GDTCOREventQoS qosTier) {
  switch (qosTier) {
    case GDTCOREventQoSWifiOnly:
      return @(GDTCCTQoSWifiOnly);
      break;

    case GDTCOREventQoSTelemetry:
      // falls through.
    case GDTCOREventQoSDaily:
      return @(GDTCCTQoSDaily);
      break;

    default:
      return @(GDTCCTQoSDefault);
      break;
  }
}

/** Constructs a set of events for upload to CCT, FLL, or CSH backends. These backends are
 * request-proto and batching compatible, so they construct event batches the same way.
 *
 * @param conditions The set of conditions the upload package should be made under.
 * @param target The target backend.
 * @return A set of events for the target.
 */
- (NSSet<GDTCOREvent *> *)eventsForTarget:(GDTCORTarget)target
                               conditions:(GDTCORUploadConditions)conditions {
  GDTCORClock __strong **timeOfLastDailyUpload = NULL;
  NSSet<GDTCOREvent *> *eventsToFilter;
  switch (target) {
    case kGDTCORTargetCCT:
      eventsToFilter = self.CCTEvents;
      timeOfLastDailyUpload = &self->_CCTTimeOfLastDailyUpload;
      break;

    case kGDTCORTargetFLL:
      eventsToFilter = self.FLLEvents;
      timeOfLastDailyUpload = &self->_FLLOfLastDailyUpload;
      break;

    case kGDTCORTargetCSH:
      // This backend doesn't batch and uploads all events as soon as possible without respect to
      // any upload condition.
      return self.CSHEvents;
      break;

    default:
      // Return an empty set.
      return [[NSSet alloc] init];
      break;
  }

  NSMutableSet<GDTCOREvent *> *eventsThatWillBeSent = [[NSMutableSet alloc] init];
  // A high priority event effectively flushes all events to be sent.
  if ((conditions & GDTCORUploadConditionHighPriority) == GDTCORUploadConditionHighPriority) {
    GDTCORLogDebug(@"%@", @"CCT: A high priority event is flushing all events.");
    return eventsToFilter;
  }

  // If on wifi, upload logs that are ok to send on wifi.
  if ((conditions & GDTCORUploadConditionWifiData) == GDTCORUploadConditionWifiData) {
    [eventsThatWillBeSent unionSet:[self logEventsOkToSendOnWifi:eventsToFilter]];
    GDTCORLogDebug(@"%@", @"CCT: events ok to send on wifi are being added to the upload package");
  } else {
    [eventsThatWillBeSent unionSet:[self logEventsOkToSendOnMobileData:eventsToFilter]];
    GDTCORLogDebug(@"%@",
                   @"CCT: events ok to send on mobile are being added to the upload package");
  }

  // If it's been > 24h since the last daily upload, upload logs with the daily QoS.
  if (*timeOfLastDailyUpload) {
    int64_t millisSinceLastUpload =
        [GDTCORClock snapshot].timeMillis - (*timeOfLastDailyUpload).timeMillis;
    if (millisSinceLastUpload > kMillisPerDay) {
      [eventsThatWillBeSent unionSet:[self logEventsOkToSendDaily:eventsToFilter]];
      GDTCORLogDebug(@"%@", @"CCT: events ok to send daily are being added to the upload package");
    }
  } else {
    *timeOfLastDailyUpload = [GDTCORClock snapshot];
    [eventsThatWillBeSent unionSet:[self logEventsOkToSendDaily:eventsToFilter]];
    GDTCORLogDebug(@"%@", @"CCT: events ok to send daily are being added to the upload package");
  }
  return eventsThatWillBeSent;
}

/** Returns a set of logs that are ok to upload whilst on mobile data.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload whilst on mobile data.
 */
- (NSSet<GDTCOREvent *> *)logEventsOkToSendOnMobileData:(NSSet<GDTCOREvent *> *)events {
  return [events objectsPassingTest:^BOOL(GDTCOREvent *_Nonnull event, BOOL *_Nonnull stop) {
    return [GDTCCTQosTierFromGDTCOREventQosTier(event.qosTier) isEqual:@(GDTCCTQoSDefault)];
  }];
}

/** Returns a set of logs that are ok to upload whilst on wifi.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload whilst on wifi.
 */
- (NSSet<GDTCOREvent *> *)logEventsOkToSendOnWifi:(NSSet<GDTCOREvent *> *)events {
  return [events objectsPassingTest:^BOOL(GDTCOREvent *_Nonnull event, BOOL *_Nonnull stop) {
    NSNumber *qosTier = GDTCCTQosTierFromGDTCOREventQosTier(event.qosTier);
    return [qosTier isEqual:@(GDTCCTQoSDefault)] || [qosTier isEqual:@(GDTCCTQoSWifiOnly)] ||
           [qosTier isEqual:@(GDTCCTQoSDaily)];
  }];
}

/** Returns a set of logs that only should have a single upload attempt per day.
 *
 * @note This should be called from a thread safe method.
 * @return A set of logs that are ok to upload only once per day.
 */
- (NSSet<GDTCOREvent *> *)logEventsOkToSendDaily:(NSSet<GDTCOREvent *> *)events {
  return [events objectsPassingTest:^BOOL(GDTCOREvent *_Nonnull event, BOOL *_Nonnull stop) {
    return [GDTCCTQosTierFromGDTCOREventQosTier(event.qosTier) isEqual:@(GDTCCTQoSDaily)];
  }];
}

#pragma mark - NSSecureCoding

/** NSSecureCoding key for the CCTEvents property. */
static NSString *const GDTCCTUploaderCCTEventsKey = @"GDTCCTUploaderCCTEventsKey";

/** NSSecureCoding key for the CCTEvents property. */
static NSString *const GDTCCTUploaderFLLEventsKey = @"GDTCCTUploaderFLLEventsKey";

/** NSSecureCoding key for the CCTEvents property. */
static NSString *const GDTCCTUploaderCSHEventsKey = @"GDTCCTUploaderCSHEventsKey";

- (instancetype)initWithCoder:(NSCoder *)coder {
  GDTCCTPrioritizer *sharedInstance = [GDTCCTPrioritizer sharedInstance];
  if (sharedInstance) {
    NSSet *classes = [NSSet setWithObjects:[NSMutableSet class], [GDTCOREvent class], nil];
    NSMutableSet *decodedCCTEvents = [coder decodeObjectOfClasses:classes
                                                           forKey:GDTCCTUploaderCCTEventsKey];
    if (decodedCCTEvents) {
      sharedInstance->_CCTEvents = decodedCCTEvents;
    }
    NSMutableSet *decodedFLLEvents = [coder decodeObjectOfClasses:classes
                                                           forKey:GDTCCTUploaderFLLEventsKey];
    if (decodedFLLEvents) {
      sharedInstance->_FLLEvents = decodedFLLEvents;
    }
    NSMutableSet *decodedCSHEvents = [coder decodeObjectOfClasses:classes
                                                           forKey:GDTCCTUploaderCSHEventsKey];
    if (decodedCSHEvents) {
      sharedInstance->_CSHEvents = decodedCSHEvents;
    }
  }
  return sharedInstance;
}

- (void)encodeWithCoder:(NSCoder *)coder {
  GDTCCTPrioritizer *sharedInstance = [GDTCCTPrioritizer sharedInstance];
  if (!sharedInstance) {
    return;
  }
  NSMutableSet<GDTCOREvent *> *CCTEvents = sharedInstance->_CCTEvents;
  if (CCTEvents) {
    [coder encodeObject:CCTEvents forKey:GDTCCTUploaderCCTEventsKey];
  }
  NSMutableSet<GDTCOREvent *> *FLLEvents = sharedInstance->_FLLEvents;
  if (FLLEvents) {
    [coder encodeObject:FLLEvents forKey:GDTCCTUploaderFLLEventsKey];
  }
  NSMutableSet<GDTCOREvent *> *CSHEvents = sharedInstance->_CSHEvents;
  if (CSHEvents) {
    [coder encodeObject:CSHEvents forKey:GDTCCTUploaderCSHEventsKey];
  }
}

#pragma mark - GDTCORLifecycleProtocol

- (void)appWillForeground:(GDTCORApplication *)app {
  dispatch_async(_queue, ^{
    NSError *error;
    GDTCORDecodeArchive([GDTCCTPrioritizer class], ArchivePath(), nil, &error);
    if (error) {
      GDTCORLogDebug(@"Deserializing GDTCCTPrioritizer from an archive failed: %@", error);
    }
  });
}

- (void)appWillBackground:(GDTCORApplication *)app {
  dispatch_async(_queue, ^{
    // Immediately request a background task to run until the end of the current queue of work, and
    // cancel it once the work is done.
    __block GDTCORBackgroundIdentifier bgID =
        [app beginBackgroundTaskWithName:@"GDTStorage"
                       expirationHandler:^{
                         [app endBackgroundTask:bgID];
                         bgID = GDTCORBackgroundIdentifierInvalid;
                       }];
    NSError *error;
    GDTCOREncodeArchive(self, ArchivePath(), &error);
    if (error) {
      GDTCORLogDebug(@"Serializing GDTCCTPrioritizer to an archive failed: %@", error);
    }

    // End the background task if it's still valid.
    [app endBackgroundTask:bgID];
    bgID = GDTCORBackgroundIdentifierInvalid;
  });
}

- (void)appWillTerminate:(GDTCORApplication *)application {
  dispatch_sync(_queue, ^{
    NSError *error;
    GDTCOREncodeArchive(self, ArchivePath(), &error);
    if (error) {
      GDTCORLogDebug(@"Serializing GDTCCTPrioritizer to an archive failed: %@", error);
    }
  });
}

#pragma mark - GDTCORUploadPackageProtocol

- (void)packageDelivered:(GDTCORUploadPackage *)package successful:(BOOL)successful {
  // If sending the package wasn't successful, we should keep track of these events.
  if (!successful) {
    return;
  }

  dispatch_async(_queue, ^{
    NSSet<GDTCOREvent *> *events = [package.events copy];
    for (GDTCOREvent *event in events) {
      // We don't know what collection the event was contained in, so attempt removal from all.
      [self.CCTEvents removeObject:event];
      [self.FLLEvents removeObject:event];
      [self.CSHEvents removeObject:event];
    }
  });
}

- (void)packageExpired:(GDTCORUploadPackage *)package {
  [self packageDelivered:package successful:YES];
}

@end
