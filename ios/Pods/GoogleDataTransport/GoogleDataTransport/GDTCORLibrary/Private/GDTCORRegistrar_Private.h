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

#import <GoogleDataTransport/GDTCORRegistrar.h>

@interface GDTCORRegistrar ()

NS_ASSUME_NONNULL_BEGIN

/** The concurrent queue on which all registration occurs. */
@property(nonatomic, readonly) dispatch_queue_t registrarQueue;

/** A map of targets to backend implementations. */
@property(atomic, readonly) NSMutableDictionary<NSNumber *, id<GDTCORUploader>> *targetToUploader;

/** A map of targets to prioritizer implementations. */
@property(atomic, readonly)
    NSMutableDictionary<NSNumber *, id<GDTCORPrioritizer>> *targetToPrioritizer;

@end

NS_ASSUME_NONNULL_END
