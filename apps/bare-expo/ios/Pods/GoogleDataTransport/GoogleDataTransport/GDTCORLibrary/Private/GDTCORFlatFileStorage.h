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
#import <GoogleDataTransport/GDTCORStorageProtocol.h>

@class GDTCOREvent;
@class GDTCORUploadCoordinator;

NS_ASSUME_NONNULL_BEGIN

/** Manages the storage of events. This class is thread-safe. */
@interface GDTCORFlatFileStorage
    : NSObject <NSSecureCoding, GDTCORStorageProtocol, GDTCORLifecycleProtocol>

/** The queue on which all storage work will occur. */
@property(nonatomic) dispatch_queue_t storageQueue;

/** A map of targets to a set of stored events. */
@property(nonatomic)
    NSMutableDictionary<NSNumber *, NSMutableSet<GDTCOREvent *> *> *targetToEventSet;

/** All the events that have been stored. */
@property(readonly, nonatomic) NSMutableDictionary<NSNumber *, GDTCOREvent *> *storedEvents;

/** The upload coordinator instance used by this storage instance. */
@property(nonatomic) GDTCORUploadCoordinator *uploadCoordinator;

/** Creates and/or returns the storage singleton.
 *
 * @return The storage singleton.
 */
+ (instancetype)sharedInstance;

/** Returns the path to the keyed archive of the singleton. This is where the singleton is saved
 * to disk during certain app lifecycle events.
 *
 * @return File path to serialized singleton.
 */
+ (NSString *)archivePath;

@end

NS_ASSUME_NONNULL_END
