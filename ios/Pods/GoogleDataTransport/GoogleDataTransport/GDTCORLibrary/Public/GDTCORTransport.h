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

#import <GoogleDataTransport/GDTCOREventTransformer.h>

@class GDTCOREvent;

NS_ASSUME_NONNULL_BEGIN

@interface GDTCORTransport : NSObject

// Please use the designated initializer.
- (instancetype)init NS_UNAVAILABLE;

/** Initializes a new transport that will send events to the given target backend.
 *
 * @param mappingID The mapping identifier used by the backend to map the data object transport
 * bytes to a proto.
 * @param transformers A list of transformers to be applied to events that are sent.
 * @param target The target backend of this transport.
 * @return A transport that will send events.
 */
- (instancetype)initWithMappingID:(NSString *)mappingID
                     transformers:(nullable NSArray<id<GDTCOREventTransformer>> *)transformers
                           target:(NSInteger)target NS_DESIGNATED_INITIALIZER;

/** Copies and sends an internal telemetry event. Events sent using this API are lower in priority,
 * and sometimes won't be sent on their own.
 *
 * @note This will convert the event's data object to data and release the original event.
 *
 * @param event The event to send.
 */
- (void)sendTelemetryEvent:(GDTCOREvent *)event;

/** Copies and sends an SDK service data event. Events send using this API are higher in priority,
 * and will cause a network request at some point in the relative near future.
 *
 * @note This will convert the event's data object to data and release the original event.
 *
 * @param event The event to send.
 */
- (void)sendDataEvent:(GDTCOREvent *)event;

/** Creates an event for use by this transport.
 *
 * @return An event that is suited for use by this transport.
 */
- (GDTCOREvent *)eventForTransport;

@end

NS_ASSUME_NONNULL_END
