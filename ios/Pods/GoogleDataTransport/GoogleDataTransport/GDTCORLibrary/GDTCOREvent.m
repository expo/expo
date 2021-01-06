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

#import "GDTCORLibrary/Public/GDTCOREvent.h"

#import <GoogleDataTransport/GDTCORAssert.h>
#import <GoogleDataTransport/GDTCORClock.h>
#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCORPlatform.h>

#import "GDTCORLibrary/Private/GDTCORDataFuture.h"
#import "GDTCORLibrary/Private/GDTCOREvent_Private.h"

@implementation GDTCOREvent

+ (NSNumber *)nextEventID {
  static unsigned long long nextEventID = 0;
  static NSString *counterPath;
  static dispatch_queue_t eventIDQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    eventIDQueue = dispatch_queue_create("com.google.GDTCOREventIDQueue", DISPATCH_QUEUE_SERIAL);
    counterPath = GDTCORRootDirectory().path;
    counterPath = [NSString stringWithFormat:@"%@/count", counterPath];
    NSError *error;
    NSString *countText = [NSString stringWithContentsOfFile:counterPath
                                                    encoding:NSUTF8StringEncoding
                                                       error:&error];
    const char *countChars = [countText UTF8String];
    unsigned long long count = 0ULL;
    if (countChars) {
      count = strtoull([countText UTF8String], NULL, 10);
    }
    nextEventID = error ? 0 : count;
  });

  __block NSNumber *result;
  dispatch_sync(eventIDQueue, ^{
    result = @(nextEventID);
    nextEventID++;
    NSError *error;
    [[result stringValue] writeToFile:counterPath
                           atomically:YES
                             encoding:NSUTF8StringEncoding
                                error:&error];
    GDTCORAssert(error == nil, @"There was an error saving the new counter value to disk: %@",
                 error);
  });
  return result;
}

- (nullable instancetype)initWithMappingID:(NSString *)mappingID target:(NSInteger)target {
  GDTCORAssert(mappingID.length > 0, @"Please give a valid mapping ID");
  GDTCORAssert(target > 0, @"A target cannot be negative or 0");
  if (mappingID == nil || mappingID.length == 0 || target <= 0) {
    return nil;
  }
  self = [super init];
  if (self) {
    _eventID = [GDTCOREvent nextEventID];
    _mappingID = mappingID;
    _target = target;
    _qosTier = GDTCOREventQosDefault;
  }
  GDTCORLogDebug(@"Event %@ created. mappingID: %@ target:%ld", self, mappingID, (long)target);
  return self;
}

- (instancetype)copy {
  GDTCOREvent *copy = [[GDTCOREvent alloc] initWithMappingID:_mappingID target:_target];
  copy->_eventID = _eventID;
  copy.dataObject = _dataObject;
  copy.qosTier = _qosTier;
  copy.clockSnapshot = _clockSnapshot;
  copy.customBytes = _customBytes;
  copy->_GDTFilePath = _GDTFilePath;
  GDTCORLogDebug(@"Copying event %@ to event %@", self, copy);
  return copy;
}

- (NSUInteger)hash {
  // This loses some precision, but it's probably fine.
  NSUInteger eventIDHash = [_eventID hash];
  NSUInteger mappingIDHash = [_mappingID hash];
  NSUInteger timeHash = [_clockSnapshot hash];
  NSInteger dataObjectHash = [_dataObject hash];
  NSUInteger fileURL = [_GDTFilePath hash];

  return eventIDHash ^ mappingIDHash ^ _target ^ _qosTier ^ timeHash ^ dataObjectHash ^ fileURL;
}

- (BOOL)isEqual:(id)object {
  return [self hash] == [object hash];
}

#pragma mark - Property overrides

- (void)setDataObject:(id<GDTCOREventDataObject>)dataObject {
  // If you're looking here because of a performance issue in -transportBytes slowing the assignment
  // of -dataObject, one way to address this is to add a queue to this class,
  // dispatch_(barrier_ if concurrent)async here, and implement the getter with a dispatch_sync.
  if (dataObject != _dataObject) {
    _dataObject = dataObject;
  }
}

- (NSURL *)fileURL {
  if (!_GDTFilePath) {
    _GDTFilePath = [NSString stringWithFormat:@"event-%lu", (unsigned long)self.hash];
  }
  return [GDTCORRootDirectory() URLByAppendingPathComponent:_GDTFilePath];
}

#pragma mark - Private methods

- (BOOL)writeToGDTPath:(NSString *)filePath error:(NSError **)error {
  NSData *dataTransportBytes = [_dataObject transportBytes];
  if (dataTransportBytes == nil) {
    _GDTFilePath = nil;
    _dataObject = nil;
    return NO;
  }
  NSURL *fileURL = [GDTCORRootDirectory() URLByAppendingPathComponent:filePath];
  BOOL writingSuccess = [dataTransportBytes writeToURL:fileURL
                                               options:NSDataWritingAtomic
                                                 error:error];
  if (!writingSuccess) {
    GDTCORLogError(GDTCORMCEFileWriteError, @"An event file could not be written: %@", fileURL);
    return NO;
  }
  _GDTFilePath = filePath;
  _dataObject = nil;
  return YES;
}

#pragma mark - NSSecureCoding and NSCoding Protocols

/** NSCoding key for eventID property. */
static NSString *eventIDKey = @"_eventID";

/** NSCoding key for mappingID property. */
static NSString *mappingIDKey = @"_mappingID";

/** NSCoding key for target property. */
static NSString *targetKey = @"_target";

/** NSCoding key for qosTier property. */
static NSString *qosTierKey = @"_qosTier";

/** NSCoding key for clockSnapshot property. */
static NSString *clockSnapshotKey = @"_clockSnapshot";

/** NSCoding key for fileURL property. */
static NSString *fileURLKey = @"_fileURL";

/** NSCoding key for GDTFilePath property. */
static NSString *kGDTFilePathKey = @"_GDTFilePath";

/** NSCoding key for backwards compatibility of GDTCORStoredEvent mappingID property.*/
static NSString *kStoredEventMappingIDKey = @"GDTCORStoredEventMappingIDKey";

/** NSCoding key for backwards compatibility of GDTCORStoredEvent target property.*/
static NSString *kStoredEventTargetKey = @"GDTCORStoredEventTargetKey";

/** NSCoding key for backwards compatibility of GDTCORStoredEvent qosTier property.*/
static NSString *kStoredEventQosTierKey = @"GDTCORStoredEventQosTierKey";

/** NSCoding key for backwards compatibility of GDTCORStoredEvent clockSnapshot property.*/
static NSString *kStoredEventClockSnapshotKey = @"GDTCORStoredEventClockSnapshotKey";

/** NSCoding key for backwards compatibility of GDTCORStoredEvent dataFuture property.*/
static NSString *kStoredEventDataFutureKey = @"GDTCORStoredEventDataFutureKey";

/** NSCoding key for customData property. */
static NSString *kCustomDataKey = @"GDTCOREventCustomDataKey";

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (id)initWithCoder:(NSCoder *)aDecoder {
  GDTCORDataFuture *dataFuture = [aDecoder decodeObjectOfClass:[GDTCORDataFuture class]
                                                        forKey:kStoredEventDataFutureKey];
  if (dataFuture) {
    return [self initWithCoderForStoredEventBackwardCompatibility:aDecoder
                                                          fileURL:dataFuture.fileURL];
  }
  NSString *mappingID = [aDecoder decodeObjectOfClass:[NSString class] forKey:mappingIDKey];
  NSInteger target = [aDecoder decodeIntegerForKey:targetKey];
  self = [self initWithMappingID:mappingID target:target];
  if (self) {
    _eventID = [aDecoder decodeObjectOfClass:[NSNumber class] forKey:eventIDKey];
    if (_eventID == nil) {
      _eventID = [GDTCOREvent nextEventID];
    }
    _qosTier = [aDecoder decodeIntegerForKey:qosTierKey];
    _clockSnapshot = [aDecoder decodeObjectOfClass:[GDTCORClock class] forKey:clockSnapshotKey];
    NSURL *fileURL = [aDecoder decodeObjectOfClass:[NSURL class] forKey:fileURLKey];
    if (fileURL) {
      _GDTFilePath = [fileURL lastPathComponent];
    } else {
      _GDTFilePath = [aDecoder decodeObjectOfClass:[NSString class] forKey:kGDTFilePathKey];
    }
    _customBytes = [aDecoder decodeObjectOfClass:[NSData class] forKey:kCustomDataKey];
  }
  return self;
}

- (id)initWithCoderForStoredEventBackwardCompatibility:(NSCoder *)aDecoder
                                               fileURL:(NSURL *)fileURL {
  NSString *mappingID = [aDecoder decodeObjectOfClass:[NSString class]
                                               forKey:kStoredEventMappingIDKey];
  NSInteger target = [[aDecoder decodeObjectOfClass:[NSNumber class]
                                             forKey:kStoredEventTargetKey] integerValue];
  self = [self initWithMappingID:mappingID target:target];
  if (self) {
    _eventID = [aDecoder decodeObjectOfClass:[NSNumber class] forKey:eventIDKey];
    if (_eventID == nil) {
      _eventID = [GDTCOREvent nextEventID];
    }
    _qosTier = [[aDecoder decodeObjectOfClass:[NSNumber class]
                                       forKey:kStoredEventQosTierKey] integerValue];
    _clockSnapshot = [aDecoder decodeObjectOfClass:[GDTCORClock class]
                                            forKey:kStoredEventClockSnapshotKey];
    if (fileURL) {
      _GDTFilePath = [fileURL lastPathComponent];
    } else {
      _GDTFilePath = [aDecoder decodeObjectOfClass:[NSString class] forKey:kGDTFilePathKey];
    }
    _customBytes = [aDecoder decodeObjectOfClass:[NSData class] forKey:kCustomDataKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)aCoder {
  [aCoder encodeObject:_eventID forKey:eventIDKey];
  [aCoder encodeObject:_mappingID forKey:mappingIDKey];
  [aCoder encodeInteger:_target forKey:targetKey];
  [aCoder encodeInteger:_qosTier forKey:qosTierKey];
  [aCoder encodeObject:_clockSnapshot forKey:clockSnapshotKey];
  [aCoder encodeObject:_GDTFilePath forKey:kGDTFilePathKey];
  [aCoder encodeObject:_customBytes forKey:kCustomDataKey];
}

@end
