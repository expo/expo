// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "Private/FIRMutableDictionary.h"

@implementation FIRMutableDictionary {
  /// The mutable dictionary.
  NSMutableDictionary *_objects;

  /// Serial synchronization queue. All reads should use dispatch_sync, while writes use
  /// dispatch_async.
  dispatch_queue_t _queue;
}

- (instancetype)init {
  self = [super init];

  if (self) {
    _objects = [[NSMutableDictionary alloc] init];
    _queue = dispatch_queue_create("FIRMutableDictionary", DISPATCH_QUEUE_SERIAL);
  }

  return self;
}

- (NSString *)description {
  __block NSString *description;
  dispatch_sync(_queue, ^{
    description = self->_objects.description;
  });
  return description;
}

- (id)objectForKey:(id)key {
  __block id object;
  dispatch_sync(_queue, ^{
    object = self->_objects[key];
  });
  return object;
}

- (void)setObject:(id)object forKey:(id<NSCopying>)key {
  dispatch_async(_queue, ^{
    self->_objects[key] = object;
  });
}

- (void)removeObjectForKey:(id)key {
  dispatch_async(_queue, ^{
    [self->_objects removeObjectForKey:key];
  });
}

- (void)removeAllObjects {
  dispatch_async(_queue, ^{
    [self->_objects removeAllObjects];
  });
}

- (NSUInteger)count {
  __block NSUInteger count;
  dispatch_sync(_queue, ^{
    count = self->_objects.count;
  });
  return count;
}

- (id)objectForKeyedSubscript:(id<NSCopying>)key {
  // The method this calls is already synchronized.
  return [self objectForKey:key];
}

- (void)setObject:(id)obj forKeyedSubscript:(id<NSCopying>)key {
  // The method this calls is already synchronized.
  [self setObject:obj forKey:key];
}

- (NSDictionary *)dictionary {
  __block NSDictionary *dictionary;
  dispatch_sync(_queue, ^{
    dictionary = [self->_objects copy];
  });
  return dictionary;
}

@end
