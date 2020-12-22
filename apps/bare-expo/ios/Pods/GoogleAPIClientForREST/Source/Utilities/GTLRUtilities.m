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

#import "GTLRUtilities.h"

#include <objc/runtime.h>

@implementation GTLRUtilities

#pragma mark Key-Value Coding Searches in an Array

+ (NSArray *)objectsFromArray:(NSArray *)sourceArray
                    withValue:(id)desiredValue
                   forKeyPath:(NSString *)keyPath {
  // Step through all entries, get the value from
  // the key path, and see if it's equal to the
  // desired value
  NSMutableArray *results = [NSMutableArray array];

  for(id obj in sourceArray) {
    id val = [obj valueForKeyPath:keyPath];
    if (GTLR_AreEqualOrBothNil(val, desiredValue)) {

      // found a match; add it to the results array
      [results addObject:obj];
    }
  }
  return results;
}

+ (id)firstObjectFromArray:(NSArray *)sourceArray
                 withValue:(id)desiredValue
                forKeyPath:(NSString *)keyPath {
  for (id obj in sourceArray) {
    id val = [obj valueForKeyPath:keyPath];
    if (GTLR_AreEqualOrBothNil(val, desiredValue)) {
      // found a match; return it
      return obj;
    }
  }
  return nil;
}

#pragma mark Version helpers

@end

// isEqual: has the fatal flaw that it doesn't deal well with the receiver
// being nil. We'll use this utility instead.
BOOL GTLR_AreEqualOrBothNil(id obj1, id obj2) {
  if (obj1 == obj2) {
    return YES;
  }
  if (obj1 && obj2) {
    BOOL areEqual = [(NSObject *)obj1 isEqual:obj2];
    return areEqual;
  }
  return NO;
}

BOOL GTLR_AreBoolsEqual(BOOL b1, BOOL b2) {
  // avoid comparison problems with boolean types by negating
  // both booleans
  return (!b1 == !b2);
}

NSNumber *GTLR_EnsureNSNumber(NSNumber *num) {
  // If the server returned a string object where we expect a number, try
  // to make a number object.
  if ([num isKindOfClass:[NSString class]]) {
    NSNumber *newNum;
    NSString *str = (NSString *)num;
    if ([str rangeOfString:@"."].location != NSNotFound) {
      // This is a floating-point number.
      // Force the parser to use '.' as the decimal separator.
      static NSLocale *usLocale = nil;
      @synchronized([GTLRUtilities class]) {
        if (usLocale == nil) {
          usLocale = [[NSLocale alloc] initWithLocaleIdentifier:@"en_US"];
        }
        newNum = [NSDecimalNumber decimalNumberWithString:(NSString*)num
                                                   locale:(id)usLocale];
      }
    } else {
      // NSDecimalNumber +decimalNumberWithString:locale:
      // does not correctly create an NSNumber for large values like
      // 71100000000007780.
      if ([str hasPrefix:@"-"]) {
        newNum = @([str longLongValue]);
      } else {
        const char *utf8 = str.UTF8String;
        unsigned long long ull = strtoull(utf8, NULL, 10);
        newNum = @(ull);
      }
    }
    if (newNum != nil) {
      num = newNum;
    }
  }
  return num;
}
