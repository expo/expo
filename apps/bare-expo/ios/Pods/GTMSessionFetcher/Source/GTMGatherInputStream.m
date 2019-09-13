/* Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GTMGatherInputStream.h"

@implementation GTMGatherInputStream {
  NSArray *_dataArray;  // NSDatas that should be "gathered" and streamed.
  NSUInteger _arrayIndex;  // Index in the array of the current NSData.
  long long _dataOffset;  // Offset in the current NSData we are processing.
  NSStreamStatus _streamStatus;
  id<NSStreamDelegate> __weak _delegate;  // Stream delegate, defaults to self.
}

+ (NSInputStream *)streamWithArray:(NSArray *)dataArray {
  return [(GTMGatherInputStream *)[self alloc] initWithArray:dataArray];
}

- (instancetype)initWithArray:(NSArray *)dataArray {
  self = [super init];
  if (self) {
    _dataArray = dataArray;
    _delegate = self;  // An NSStream's default delegate should be self.
  }
  return self;
}

#pragma mark - NSStream

- (void)open {
  _arrayIndex = 0;
  _dataOffset = 0;
  _streamStatus = NSStreamStatusOpen;
}

- (void)close {
  _streamStatus = NSStreamStatusClosed;
}

- (id<NSStreamDelegate>)delegate {
  return _delegate;
}

- (void)setDelegate:(id<NSStreamDelegate>)delegate {
  if (delegate == nil) {
    _delegate = self;
  } else {
    _delegate = delegate;
  }
}

- (id)propertyForKey:(NSString *)key {
  if ([key isEqual:NSStreamFileCurrentOffsetKey]) {
    return @([self absoluteOffset]);
  }
  return nil;
}

- (BOOL)setProperty:(id)property forKey:(NSString *)key {
  if ([key isEqual:NSStreamFileCurrentOffsetKey]) {
    NSNumber *absoluteOffsetNumber = property;
    [self setAbsoluteOffset:absoluteOffsetNumber.longLongValue];
    return YES;
  }
  return NO;
}

- (void)scheduleInRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode {
}

- (void)removeFromRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode {
}

- (NSStreamStatus)streamStatus {
  return _streamStatus;
}

- (NSError *)streamError {
  return nil;
}

#pragma mark - NSInputStream

- (NSInteger)read:(uint8_t *)buffer maxLength:(NSUInteger)len {
  NSInteger bytesRead = 0;
  NSUInteger bytesRemaining = len;

  // Read bytes from the currently-indexed array.
  while ((bytesRemaining > 0) && (_arrayIndex < _dataArray.count)) {
    NSData *data = [_dataArray objectAtIndex:_arrayIndex];

    NSUInteger dataLen = data.length;
    NSUInteger dataBytesLeft = dataLen - (NSUInteger)_dataOffset;

    NSUInteger bytesToCopy = MIN(bytesRemaining, dataBytesLeft);
    NSRange range = NSMakeRange((NSUInteger) _dataOffset, bytesToCopy);

    [data getBytes:(buffer + bytesRead) range:range];

    bytesRead += bytesToCopy;
    _dataOffset += bytesToCopy;
    bytesRemaining -= bytesToCopy;

    if (_dataOffset == (long long)dataLen) {
      _dataOffset = 0;
      _arrayIndex++;
    }
  }
  if (_arrayIndex >= _dataArray.count) {
    _streamStatus = NSStreamStatusAtEnd;
  }
  return bytesRead;
}

- (BOOL)getBuffer:(uint8_t **)buffer length:(NSUInteger *)len {
  return NO;  // We don't support this style of reading.
}

- (BOOL)hasBytesAvailable {
  // If we return no, the read never finishes, even if we've already delivered all the bytes.
  return YES;
}

#pragma mark - NSStreamDelegate

- (void)stream:(NSStream *)theStream handleEvent:(NSStreamEvent)streamEvent {
  id<NSStreamDelegate> delegate = _delegate;
  if (delegate != self) {
    [delegate stream:self handleEvent:streamEvent];
  }
}

#pragma mark - Private

- (long long)absoluteOffset {
  long long absoluteOffset = 0;
  NSUInteger index = 0;
  for (NSData *data in _dataArray) {
    if (index >= _arrayIndex) {
      break;
    }
    absoluteOffset += data.length;
    ++index;
  }
  absoluteOffset += _dataOffset;
  return absoluteOffset;
}

- (void)setAbsoluteOffset:(long long)absoluteOffset {
  if (absoluteOffset < 0) {
    absoluteOffset = 0;
  }
  _arrayIndex = 0;
  _dataOffset = absoluteOffset;
  for (NSData *data in _dataArray) {
    long long dataLen = (long long) data.length;
    if (dataLen > _dataOffset) {
      break;
    }
    _arrayIndex++;
    _dataOffset -= dataLen;
  }
  if (_arrayIndex == _dataArray.count) {
    if (_dataOffset > 0) {
      _dataOffset = 0;
    }
  }
}

@end
