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
#import <GoogleDataTransport/GDTCORUploadPackage.h>

@class GDTCORStoredEvent;

NS_ASSUME_NONNULL_BEGIN

/** Options that define a set of upload conditions. This is used to help minimize end user data
 * consumption impact.
 */
typedef NS_OPTIONS(NSInteger, GDTCORUploadConditions) {

  /** An upload shouldn't be attempted, because there's no network. */
  GDTCORUploadConditionNoNetwork = 1 << 0,

  /** An upload would likely use mobile data. */
  GDTCORUploadConditionMobileData = 1 << 1,

  /** An upload would likely use wifi data. */
  GDTCORUploadConditionWifiData = 1 << 2,

  /** An upload uses some sort of network connection, but it's unclear which. */
  GDTCORUploadConditionUnclearConnection = 1 << 3,

  /** A high priority event has occurred. */
  GDTCORUploadConditionHighPriority = 1 << 4,
};

/** This protocol defines the common interface of event prioritization. Prioritizers are
 * stateful objects that prioritize events upon insertion into storage and remain prepared to return
 * a set of filenames to the storage system.
 */
@protocol GDTCORPrioritizer <NSObject, GDTCORLifecycleProtocol, GDTCORUploadPackageProtocol>

@required

/** Accepts an event and uses the event metadata to make choices on how to prioritize the event.
 * This method exists as a way to help prioritize which events should be sent, which is dependent on
 * the request proto structure of your backend.
 *
 * @param event The event to prioritize.
 */
- (void)prioritizeEvent:(GDTCORStoredEvent *)event;

/** Returns a set of events to upload given a set of conditions.
 *
 * @param conditions A bit mask specifying the current upload conditions.
 * @return An object to be used by the uploader to determine file URLs to upload with respect to the
 * current conditions.
 */
- (GDTCORUploadPackage *)uploadPackageWithConditions:(GDTCORUploadConditions)conditions;

@end

NS_ASSUME_NONNULL_END
