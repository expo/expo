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

#import <GoogleDataTransport/GDTCORTransport.h>

@class GDTCORTransformer;

NS_ASSUME_NONNULL_BEGIN

@interface GDTCORTransport ()

/** The mapping identifier that the target backend will use to map the transport bytes to proto. */
@property(nonatomic) NSString *mappingID;

/** The transformers that will operate on events sent by this transport. */
@property(nonatomic) NSArray<id<GDTCOREventTransformer>> *transformers;

/** The target backend of this transport. */
@property(nonatomic) NSInteger target;

/** The transformer instance to used to transform events. Allows injecting a fake during testing. */
@property(nonatomic) GDTCORTransformer *transformerInstance;

@end

NS_ASSUME_NONNULL_END
