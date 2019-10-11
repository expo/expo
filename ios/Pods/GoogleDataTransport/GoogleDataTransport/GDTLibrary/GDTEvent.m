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

#import <GoogleDataTransport/GDTEvent.h>

#import <GoogleDataTransport/GDTAssert.h>
#import <GoogleDataTransport/GDTStoredEvent.h>

#import "GDTLibrary/Private/GDTEvent_Private.h"

@implementation GDTEvent

- (instancetype)initWithMappingID:(NSString *)mappingID target:(NSInteger)target {
  GDTAssert(mappingID.length > 0, @"Please give a valid mapping ID");
  GDTAssert(target > 0, @"A target cannot be negative or 0");
  if (mappingID == nil || mappingID.length == 0 || target <= 0) {
    return nil;
  }
  self = [super init];
  if (self) {
    _mappingID = mappingID;
    _target = target;
    _qosTier = GDTEventQosDefault;
  }
  return self;
}

- (instancetype)copy {
  GDTEvent *copy = [[GDTEvent alloc] initWithMappingID:_mappingID target:_target];
  copy.dataObject = _dataObject;
  copy.dataObjectTransportBytes = _dataObjectTransportBytes;
  copy.qosTier = _qosTier;
  copy.clockSnapshot = _clockSnapshot;
  copy.customPrioritizationParams = _customPrioritizationParams;
  return copy;
}

- (NSUInteger)hash {
  // This loses some precision, but it's probably fine.
  NSUInteger mappingIDHash = [_mappingID hash];
  NSUInteger timeHash = [_clockSnapshot hash];
  NSUInteger dataObjectTransportBytesHash = [_dataObjectTransportBytes hash];
  return mappingIDHash ^ _target ^ dataObjectTransportBytesHash ^ _qosTier ^ timeHash;
}

- (BOOL)isEqual:(id)object {
  return [self hash] == [object hash];
}

- (void)setDataObject:(id<GDTEventDataObject>)dataObject {
  // If you're looking here because of a performance issue in -transportBytes slowing the assignment
  // of -dataObject, one way to address this is to add a queue to this class,
  // dispatch_(barrier_ if concurrent)async here, and implement the getter with a dispatch_sync.
  if (dataObject != _dataObject) {
    _dataObject = dataObject;
    _dataObjectTransportBytes = [dataObject transportBytes];
  }
}

- (GDTStoredEvent *)storedEventWithDataFuture:(GDTDataFuture *)dataFuture {
  return [[GDTStoredEvent alloc] initWithEvent:self dataFuture:dataFuture];
}

#pragma mark - NSSecureCoding and NSCoding Protocols

/** NSCoding key for mappingID property. */
static NSString *mappingIDKey = @"_mappingID";

/** NSCoding key for target property. */
static NSString *targetKey = @"_target";

/** NSCoding key for dataObjectTransportBytes property. */
static NSString *dataObjectTransportBytesKey = @"_dataObjectTransportBytesKey";

/** NSCoding key for qosTier property. */
static NSString *qosTierKey = @"_qosTier";

/** NSCoding key for clockSnapshot property. */
static NSString *clockSnapshotKey = @"_clockSnapshot";

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (id)initWithCoder:(NSCoder *)aDecoder {
  NSString *mappingID = [aDecoder decodeObjectOfClass:[NSObject class] forKey:mappingIDKey];
  NSInteger target = [aDecoder decodeIntegerForKey:targetKey];
  self = [self initWithMappingID:mappingID target:target];
  if (self) {
    _dataObjectTransportBytes = [aDecoder decodeObjectOfClass:[NSData class]
                                                       forKey:dataObjectTransportBytesKey];
    _qosTier = [aDecoder decodeIntegerForKey:qosTierKey];
    _clockSnapshot = [aDecoder decodeObjectOfClass:[GDTClock class] forKey:clockSnapshotKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeObject:_mappingID forKey:mappingIDKey];
  [aCoder encodeInteger:_target forKey:targetKey];
  [aCoder encodeObject:_dataObjectTransportBytes forKey:dataObjectTransportBytesKey];
  [aCoder encodeInteger:_qosTier forKey:qosTierKey];
  [aCoder encodeObject:_clockSnapshot forKey:clockSnapshotKey];
}

@end
