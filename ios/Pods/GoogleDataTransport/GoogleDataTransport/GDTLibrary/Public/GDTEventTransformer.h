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

@class GDTEvent;

NS_ASSUME_NONNULL_BEGIN

/** Defines the API that event transformers must adopt. */
@protocol GDTEventTransformer <NSObject>

@required

/** Transforms an event by applying some logic to it. Events returned can be nil, for example, in
 *  instances where the event should be sampled.
 *
 * @param event The event to transform.
 * @return A transformed event, or nil if the transformation dropped the event.
 */
- (GDTEvent *)transform:(GDTEvent *)event;

@end

NS_ASSUME_NONNULL_END
