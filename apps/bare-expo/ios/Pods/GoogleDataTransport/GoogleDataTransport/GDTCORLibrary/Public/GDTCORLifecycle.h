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

#import <GoogleDataTransport/GDTCORPlatform.h>

@class GDTCOREvent;

NS_ASSUME_NONNULL_BEGIN

/** A protocol defining the lifecycle events objects in the library must respond to immediately. */
@protocol GDTCORLifecycleProtocol <NSObject>

@optional

/** Indicates an imminent app termination in the rare occurrence when -applicationWillTerminate: has
 * been called.
 *
 * @param app The GDTCORApplication instance.
 */
- (void)appWillTerminate:(GDTCORApplication *)app;

/** Indicates that the app is moving to background and eventual suspension or the current UIScene is
 * deactivating.
 *
 * @param app The GDTCORApplication instance.
 */
- (void)appWillBackground:(GDTCORApplication *)app;

/** Indicates that the app is resuming operation or a UIScene is activating.
 *
 * @param app The GDTCORApplication instance.
 */
- (void)appWillForeground:(GDTCORApplication *)app;

@end

/** This class manages the library's response to app lifecycle events.
 *
 * When backgrounding, the library doesn't stop processing events, it's just that several background
 * tasks will end up being created for every event that's sent, and the stateful objects of the
 * library (GDTCORStorage and GDTCORUploadCoordinator singletons) will deserialize themselves from
 * and to disk before and after every operation, respectively.
 */
@interface GDTCORLifecycle : NSObject <GDTCORApplicationDelegate>

@end

NS_ASSUME_NONNULL_END
