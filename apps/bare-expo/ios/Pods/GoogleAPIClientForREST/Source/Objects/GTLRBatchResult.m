/* Copyright (c) 2011 Google Inc.
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

#if !__has_feature(objc_arc)
#error "This file needs to be compiled with ARC enabled."
#endif

#import "GTLRBatchResult.h"

#import "GTLRErrorObject.h"
#import "GTLRUtilities.h"

static NSString *const kGTLRBatchResultSuccessesKeys = @"successesKeys";
static NSString *const kGTLRBatchResultSuccessKeyPrefix = @"Success-";
static NSString *const kGTLRBatchResultFailuresKeys = @"failuresKeys";
static NSString *const kGTLRBatchResultFailurKeyPrefix = @"Failure-";
static NSString *const kGTLRBatchResultResponseHeaders = @"responseHeaders";

@implementation GTLRBatchResult

@synthesize successes = _successes,
            failures = _failures,
            responseHeaders = _responseHeaders;

// Since this class doesn't use the json property, provide the basic NSObject
// methods needed to ensure proper behaviors.

- (id)copyWithZone:(NSZone *)zone {
  GTLRBatchResult* newObject = [super copyWithZone:zone];
  newObject.successes = [self.successes copyWithZone:zone];
  newObject.failures = [self.failures copyWithZone:zone];
  newObject.responseHeaders = [self.responseHeaders copyWithZone:zone];
  return newObject;
}

- (NSUInteger)hash {
  NSUInteger result = [super hash];
  result += result * 13 + [self.successes hash];
  result += result * 13 + [self.failures hash];
  result += result * 13 + [self.responseHeaders hash];
  return result;
}

- (BOOL)isEqual:(id)object {
  if (self == object) return YES;

  if (![super isEqual:object]) {
    return NO;
  }

  if (![object isKindOfClass:[GTLRBatchResult class]]) {
    return NO;
  }

  GTLRBatchResult *other = (GTLRBatchResult *)object;
  if (!GTLR_AreEqualOrBothNil(self.successes, other.successes)) {
    return NO;
  }
  if (!GTLR_AreEqualOrBothNil(self.failures, other.failures)) {
    return NO;
  }
  return GTLR_AreEqualOrBothNil(self.responseHeaders, other.responseHeaders);
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@ %p (successes:%lu failures:%lu responseHeaders:%lu)",
          [self class], self,
          (unsigned long)self.successes.count,
          (unsigned long)self.failures.count,
          (unsigned long)self.responseHeaders.count];
}

// This class is a subclass of GTLRObject, which declares NSSecureCoding
// conformance. Since this class does't really use the json property, provide
// a custom implementation to maintain the contract.
//
// For success/failures, one could do:
//    [encoder encodeObject:self.successes forKey:kGTLRBatchResultSuccesses];
//    [encoder encodeObject:self.failures forKey:kGTLRBatchResultFailuresKeys];
// and then use -decodeObjectOfClasses:forKey:, but nothing actually checks the
// structure of the dictionary, so instead the dicts are blown out to provide
// better validation by the encoder/decoder.

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder {
  self = [super initWithCoder:decoder];
  if (self) {
    NSArray<NSString *> *keys =
        [decoder decodeObjectOfClass:[NSArray class]
                              forKey:kGTLRBatchResultSuccessesKeys];
    if (keys.count) {
      NSMutableDictionary *dict =
          [NSMutableDictionary dictionaryWithCapacity:keys.count];
      for (NSString *key in keys) {
        NSString *storageKey =
            [kGTLRBatchResultSuccessKeyPrefix stringByAppendingString:key];
        GTLRObject *obj = [decoder decodeObjectOfClass:[GTLRObject class]
                                                forKey:storageKey];
        if (obj) {
          [dict setObject:obj forKey:key];
        }
      }
      self.successes = dict;
    }

    keys = [decoder decodeObjectOfClass:[NSArray class]
                                 forKey:kGTLRBatchResultFailuresKeys];
    if (keys.count) {
      NSMutableDictionary *dict =
          [NSMutableDictionary dictionaryWithCapacity:keys.count];
      for (NSString *key in keys) {
        NSString *storageKey =
            [kGTLRBatchResultFailurKeyPrefix stringByAppendingString:key];
        GTLRObject *obj = [decoder decodeObjectOfClass:[GTLRObject class]
                                                forKey:storageKey];
        if (obj) {
          [dict setObject:obj forKey:key];
        }
      }
      self.failures = dict;
    }

    self.responseHeaders =
        [decoder decodeObjectOfClass:[NSDictionary class]
                              forKey:kGTLRBatchResultResponseHeaders];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder {
  [super encodeWithCoder:encoder];
  [encoder encodeObject:self.successes.allKeys
                 forKey:kGTLRBatchResultSuccessesKeys];
  [self.successes enumerateKeysAndObjectsUsingBlock:^(NSString *key,
                                                      GTLRObject * obj,
                                                      BOOL * stop) {
    NSString *storageKey =
        [kGTLRBatchResultSuccessKeyPrefix stringByAppendingString:key];
    [encoder encodeObject:obj forKey:storageKey];
  }];

  [encoder encodeObject:self.failures.allKeys forKey:kGTLRBatchResultFailuresKeys];
  [self.failures enumerateKeysAndObjectsUsingBlock:^(NSString *key,
                                                     GTLRObject * obj,
                                                     BOOL * stop) {
    NSString *storageKey =
        [kGTLRBatchResultFailurKeyPrefix stringByAppendingString:key];
    [encoder encodeObject:obj forKey:storageKey];
  }];

  [encoder encodeObject:self.responseHeaders
                 forKey:kGTLRBatchResultResponseHeaders];
}

@end
