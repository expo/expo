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

#import <GoogleDataTransport/GDTCORTransport.h>
#import "GDTCORLibrary/Private/GDTCORTransport_Private.h"

#import <GoogleDataTransport/GDTCORAssert.h>
#import <GoogleDataTransport/GDTCORClock.h>
#import <GoogleDataTransport/GDTCOREvent.h>

#import "GDTCORLibrary/Private/GDTCORTransformer.h"

@implementation GDTCORTransport

- (nullable instancetype)initWithMappingID:(NSString *)mappingID
                              transformers:
                                  (nullable NSArray<id<GDTCOREventTransformer>> *)transformers
                                    target:(NSInteger)target {
  GDTCORAssert(mappingID.length > 0, @"A mapping ID cannot be nil or empty");
  GDTCORAssert(target > 0, @"A target cannot be negative or 0");
  if (mappingID == nil || mappingID.length == 0 || target <= 0) {
    return nil;
  }
  self = [super init];
  if (self) {
    _mappingID = mappingID;
    _transformers = transformers;
    _target = target;
    _transformerInstance = [GDTCORTransformer sharedInstance];
  }
  return self;
}

- (void)sendTelemetryEvent:(GDTCOREvent *)event {
  // TODO: Determine if sending an event before registration is allowed.
  GDTCORAssert(event, @"You can't send a nil event");
  GDTCOREvent *copiedEvent = [event copy];
  copiedEvent.qosTier = GDTCOREventQoSTelemetry;
  copiedEvent.clockSnapshot = [GDTCORClock snapshot];
  [self.transformerInstance transformEvent:copiedEvent withTransformers:_transformers];
}

- (void)sendDataEvent:(GDTCOREvent *)event {
  // TODO: Determine if sending an event before registration is allowed.
  GDTCORAssert(event, @"You can't send a nil event");
  GDTCORAssert(event.qosTier != GDTCOREventQoSTelemetry, @"Use -sendTelemetryEvent, please.");
  GDTCOREvent *copiedEvent = [event copy];
  copiedEvent.clockSnapshot = [GDTCORClock snapshot];
  [self.transformerInstance transformEvent:copiedEvent withTransformers:_transformers];
}

- (GDTCOREvent *)eventForTransport {
  return [[GDTCOREvent alloc] initWithMappingID:_mappingID target:_target];
}

@end
