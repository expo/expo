/* Copyright (c) 2016 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
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

#import "GMUWrappingDictionaryKey.h"

@implementation GMUWrappingDictionaryKey {
  id _object;
}

- (instancetype)initWithObject:(id)object {
  if ((self = [super init])) {
    _object = object;
  }
  return self;
}

- (id)copyWithZone:(NSZone *)zone {
  GMUWrappingDictionaryKey *newKey = [[self class] allocWithZone:zone];
  if (newKey) {
    newKey->_object = _object;
  }
  return newKey;
}

// Forwards hash to _object.
- (NSUInteger)hash {
  return [_object hash];
}

// Forwards isEqual to _object.
- (BOOL)isEqual:(id)object {
  if (self == object) return YES;

  if ([object class] != [self class]) return NO;

  GMUWrappingDictionaryKey *other = (GMUWrappingDictionaryKey *)object;
  return [_object isEqual:other->_object];
}

@end

