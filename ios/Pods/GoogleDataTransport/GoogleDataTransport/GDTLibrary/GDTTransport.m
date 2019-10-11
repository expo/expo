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

#import <GoogleDataTransport/GDTTransport.h>
#import "GDTLibrary/Private/GDTTransport_Private.h"

#import <GoogleDataTransport/GDTAssert.h>
#import <GoogleDataTransport/GDTClock.h>
#import <GoogleDataTransport/GDTEvent.h>

#import "GDTLibrary/Private/GDTTransformer.h"

@implementation GDTTransport

- (instancetype)initWithMappingID:(NSString *)mappingID
                     transformers:(nullable NSArray<id<GDTEventTransformer>> *)transformers
                           target:(NSInteger)target {
  GDTAssert(mappingID.length > 0, @"A mapping ID cannot be nil or empty");
  GDTAssert(target > 0, @"A target cannot be negative or 0");
  if (mappingID == nil || mappingID.length == 0 || target <= 0) {
    return nil;
  }
  self = [super init];
  if (self) {
    _mappingID = mappingID;
    _transformers = transformers;
    _target = target;
    _transformerInstance = [GDTTransformer sharedInstance];
  }
  return self;
}

- (void)sendTelemetryEvent:(GDTEvent *)event {
  // TODO: Determine if sending an event before registration is allowed.
  GDTAssert(event, @"You can't send a nil event");
  GDTEvent *copiedEvent = [event copy];
  copiedEvent.qosTier = GDTEventQoSTelemetry;
  copiedEvent.clockSnapshot = [GDTClock snapshot];
  [self.transformerInstance transformEvent:copiedEvent withTransformers:_transformers];
}

- (void)sendDataEvent:(GDTEvent *)event {
  // TODO: Determine if sending an event before registration is allowed.
  GDTAssert(event, @"You can't send a nil event");
  GDTAssert(event.qosTier != GDTEventQoSTelemetry, @"Use -sendTelemetryEvent, please.");
  GDTEvent *copiedEvent = [event copy];
  copiedEvent.clockSnapshot = [GDTClock snapshot];
  [self.transformerInstance transformEvent:copiedEvent withTransformers:_transformers];
}

- (GDTEvent *)eventForTransport {
  return [[GDTEvent alloc] initWithMappingID:_mappingID target:_target];
}

@end
