//  Copyright © 2021 650 Industries. All rights reserved.

#import "NSArray+EXStructuredHeadersTests.h"

NS_ASSUME_NONNULL_BEGIN

@implementation NSArray (EXStructuredHeadersTests)

- (BOOL)isEqualToTestResult:(id)object
{
  // dictionaries in the expected results are represented as arrays of tuplets [key, value]
  if ([object isKindOfClass:[NSDictionary class]]) {
    NSMutableDictionary *dictionaryToCompare = [NSMutableDictionary dictionaryWithCapacity:self.count];
    for (id member in self) {
      if (![member isKindOfClass:[NSArray class]] || ((NSArray *)member).count != 2) {
        // self is not a dictionary represented as an array of tuplets, so it isn't equal to object
        return NO;
      }
      id key = member[0];
      id value = member[1];
      if (dictionaryToCompare[key] != nil) {
        // there are multiple duplicate keys, so self is not in the format we would expect for a dictionary
        return NO;
      }
      dictionaryToCompare[key] = value;
    }
    return [dictionaryToCompare.copy isEqualToDictionary:object];
  }
  
  // plain isEqual implementation
  if (self == object) {
    return YES;
  }
  if (![object isKindOfClass:[NSArray class]]) {
    return NO;
  }
  return [self isEqualToArray:object];
}

@end

NS_ASSUME_NONNULL_END
