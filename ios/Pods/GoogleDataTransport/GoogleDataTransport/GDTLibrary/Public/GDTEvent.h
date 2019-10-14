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

#import <GoogleDataTransport/GDTEventDataObject.h>

@class GDTClock;
@class GDTDataFuture;
@class GDTStoredEvent;

NS_ASSUME_NONNULL_BEGIN

/** The different possible quality of service specifiers. High values indicate high priority. */
typedef NS_ENUM(NSInteger, GDTEventQoS) {
  /** The QoS tier wasn't set, and won't ever be sent. */
  GDTEventQoSUnknown = 0,

  /** This event is internal telemetry data that should not be sent on its own if possible. */
  GDTEventQoSTelemetry = 1,

  /** This event should be sent, but in a batch only roughly once per day. */
  GDTEventQoSDaily = 2,

  /** This event should be sent when requested by the uploader. */
  GDTEventQosDefault = 3,

  /** This event should be sent immediately along with any other data that can be batched. */
  GDTEventQoSFast = 4,

  /** This event should only be uploaded on wifi. */
  GDTEventQoSWifiOnly = 5,
};

@interface GDTEvent : NSObject <NSSecureCoding>

/** The mapping identifier, to allow backends to map the transport bytes to a proto. */
@property(readonly, nonatomic) NSString *mappingID;

/** The identifier for the backend this event will eventually be sent to. */
@property(readonly, nonatomic) NSInteger target;

/** The data object encapsulated in the transport of your choice, as long as it implements
 * the GDTEventDataObject protocol. */
@property(nullable, nonatomic) id<GDTEventDataObject> dataObject;

/** The quality of service tier this event belongs to. */
@property(nonatomic) GDTEventQoS qosTier;

/** The clock snapshot at the time of the event. */
@property(nonatomic) GDTClock *clockSnapshot;

/** A dictionary provided to aid prioritizers by allowing the passing of arbitrary data. It will be
 * retained by a copy in -copy, but not used for -hash.
 *
 * @note Ensure that classes contained therein implement NSSecureCoding to prevent loss of data.
 */
@property(nullable, nonatomic) NSDictionary *customPrioritizationParams;

// Please use the designated initializer.
- (instancetype)init NS_UNAVAILABLE;

/** Initializes an instance using the given mappingID.
 *
 * @param mappingID The mapping identifier.
 * @param target The event's target identifier.
 * @return An instance of this class.
 */
- (instancetype)initWithMappingID:(NSString *)mappingID
                           target:(NSInteger)target NS_DESIGNATED_INITIALIZER;

/** Returns the GDTStoredEvent equivalent of self.
 *
 * @param dataFuture The data future representing the transport bytes of the original event.
 * @return An equivalent GDTStoredEvent.
 */
- (GDTStoredEvent *)storedEventWithDataFuture:(GDTDataFuture *)dataFuture;

@end

NS_ASSUME_NONNULL_END
