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

#import <GoogleDataTransport/GDTCOREventDataObject.h>

@class GDTCORClock;

NS_ASSUME_NONNULL_BEGIN

/** The different possible quality of service specifiers. High values indicate high priority. */
typedef NS_ENUM(NSInteger, GDTCOREventQoS) {
  /** The QoS tier wasn't set, and won't ever be sent. */
  GDTCOREventQoSUnknown = 0,

  /** This event is internal telemetry data that should not be sent on its own if possible. */
  GDTCOREventQoSTelemetry = 1,

  /** This event should be sent, but in a batch only roughly once per day. */
  GDTCOREventQoSDaily = 2,

  /** This event should be sent when requested by the uploader. */
  GDTCOREventQosDefault = 3,

  /** This event should be sent immediately along with any other data that can be batched. */
  GDTCOREventQoSFast = 4,

  /** This event should only be uploaded on wifi. */
  GDTCOREventQoSWifiOnly = 5,
};

@interface GDTCOREvent : NSObject <NSSecureCoding>

/** The unique ID of the event. */
@property(nonatomic, readonly) NSNumber *eventID;

/** The mapping identifier, to allow backends to map the transport bytes to a proto. */
@property(readonly, nonatomic) NSString *mappingID;

/** The identifier for the backend this event will eventually be sent to. */
@property(readonly, nonatomic) NSInteger target;

/** The data object encapsulated in the transport of your choice, as long as it implements
 * the GDTCOREventDataObject protocol. */
@property(nullable, nonatomic) id<GDTCOREventDataObject> dataObject;

/** The quality of service tier this event belongs to. */
@property(nonatomic) GDTCOREventQoS qosTier;

/** The clock snapshot at the time of the event. */
@property(nonatomic) GDTCORClock *clockSnapshot;

/** The resulting file URL when [dataObject -transportBytes] has been saved to disk.*/
@property(nullable, readonly, nonatomic) NSURL *fileURL;

/** Bytes that can be used by a prioritizer or uploader later on. It's the prioritizer or uploader's
 * responsibility to serialize and deserialize these bytes.
 */
@property(nullable, nonatomic) NSData *customBytes;

// Please use the designated initializer.
- (instancetype)init NS_UNAVAILABLE;

/** Initializes an instance using the given mappingID.
 *
 * @param mappingID The mapping identifier.
 * @param target The event's target identifier.
 * @return An instance of this class.
 */
- (nullable instancetype)initWithMappingID:(NSString *)mappingID
                                    target:(NSInteger)target NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
