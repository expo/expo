/*
 * Copyright 2020 Google
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

NS_ASSUME_NONNULL_BEGIN

/** Defines the interface a storage subsystem is expected to implement. */
@protocol GDTCORStorageProtocol <NSObject, GDTCORLifecycleProtocol>

/** Stores an event and calls onComplete with a non-nil error if anything went wrong.
 *
 * @param event The event to store
 * @param completion The completion block to call after an attempt to store the event has been made.
 */
- (void)storeEvent:(GDTCOREvent *)event
        onComplete:(void (^_Nullable)(BOOL wasWritten, NSError *_Nullable error))completion;

/** Removes the events from storage. */
- (void)removeEvents:(NSSet<NSNumber *> *)eventIDs;

@end

NS_ASSUME_NONNULL_END
