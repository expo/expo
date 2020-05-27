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
#import <Foundation/Foundation.h>

#import <GoogleDataTransport/GDTCORDataFuture.h>
#import <GoogleDataTransport/GDTCOREvent.h>

@class GDTCOREvent;

NS_ASSUME_NONNULL_BEGIN

@interface GDTCORStoredEvent : NSObject <NSSecureCoding>

/** The data future representing the original event's transport bytes. */
@property(readonly, nonatomic) GDTCORDataFuture *dataFuture;

/** The mapping identifier, to allow backends to map the transport bytes to a proto. */
@property(readonly, nonatomic) NSString *mappingID;

/** The identifier for the backend this event will eventually be sent to. */
@property(readonly, nonatomic) NSNumber *target;

/** The quality of service tier this event belongs to. */
@property(readonly, nonatomic) GDTCOREventQoS qosTier;

/** The clock snapshot at the time of the event. */
@property(readonly, nonatomic) GDTCORClock *clockSnapshot;

/** A dictionary provided to aid prioritizers by allowing the passing of arbitrary data.
 *
 * @note Ensure that custom classes in this dict implement NSSecureCoding to prevent loss of data.
 */
@property(readonly, nullable, nonatomic) NSDictionary *customPrioritizationParams;

/** Initializes a stored event with the given URL and event.
 *
 * @param event The event this stored event represents.
 * @param dataFuture The dataFuture this event represents.
 * @return An instance of this class.
 */
- (instancetype)initWithEvent:(GDTCOREvent *)event dataFuture:(GDTCORDataFuture *)dataFuture;

@end

NS_ASSUME_NONNULL_END
