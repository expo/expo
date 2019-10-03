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

@protocol GDTCOREventTransformer;

NS_ASSUME_NONNULL_BEGIN

/** Manages the transforming of events. It's desirable for this to be its own class
 * because running all events through a single instance ensures that transformers are thread-safe.
 * Having a per-transport queue to run on isn't sufficient because transformer objects could
 * maintain state (or at least, there's nothing to stop them from doing that) and the same instances
 * may be used across multiple instances.
 */
@interface GDTCORTransformer : NSObject <GDTCORLifecycleProtocol>

/** Instantiates or returns the event transformer singleton.
 *
 * @return The singleton instance of the event transformer.
 */
+ (instancetype)sharedInstance;

/** Writes the result of applying the given transformers' -transform method on the given event.
 *
 * @note If the app is suspended, a background task will be created to complete work in-progress,
 * but this method will not send any further events until the app is resumed.
 *
 * @param event The event to apply transformers on.
 * @param transformers The list of transformers to apply.
 */
- (void)transformEvent:(GDTCOREvent *)event
      withTransformers:(nullable NSArray<id<GDTCOREventTransformer>> *)transformers;

@end

NS_ASSUME_NONNULL_END
