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

#import <GoogleDataTransport/GDTCORLifecycle.h>

@class GDTCOREvent;
@class GDTCORStoredEvent;

NS_ASSUME_NONNULL_BEGIN

/** Manages the storage of events. This class is thread-safe. */
@interface GDTCORStorage : NSObject <NSSecureCoding, GDTCORLifecycleProtocol>

/** Creates and/or returns the storage singleton.
 *
 * @return The storage singleton.
 */
+ (instancetype)sharedInstance;

/** Stores event.dataObjectTransportBytes into a shared on-device folder and tracks the event via
 * a GDTCORStoredEvent instance.
 *
 * @param event The event to store.
 */
- (void)storeEvent:(GDTCOREvent *)event;

/** Removes a set of events from storage specified by their hash.
 *
 * @param events The set of stored events to remove.
 */
- (void)removeEvents:(NSSet<GDTCORStoredEvent *> *)events;

@end

NS_ASSUME_NONNULL_END
