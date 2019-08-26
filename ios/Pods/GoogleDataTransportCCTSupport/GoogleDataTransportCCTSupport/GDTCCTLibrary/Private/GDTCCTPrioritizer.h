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

#import <GoogleDataTransport/GDTClock.h>
#import <GoogleDataTransport/GDTPrioritizer.h>

NS_ASSUME_NONNULL_BEGIN

/** Manages the prioritization of events from GoogleDataTransport. */
@interface GDTCCTPrioritizer : NSObject <GDTPrioritizer>

/** The queue on which this prioritizer operates. */
@property(nonatomic) dispatch_queue_t queue;

/** All log events that have been processed by this prioritizer. */
@property(nonatomic) NSMutableSet<GDTStoredEvent *> *events;

/** The most recent attempted upload of daily uploaded logs. */
@property(nonatomic) GDTClock *timeOfLastDailyUpload;

/** Creates and/or returns the singleton instance of this class.
 *
 * @return The singleton instance of this class.
 */
+ (instancetype)sharedInstance;

NS_ASSUME_NONNULL_END

@end
