#import "ABI45_0_0RCTConvert+Lottie.h"

@implementation ABI45_0_0RCTConvert (Lottie)

+ (NSArray<NSDictionary *> *)LRNColorFilters:(id)json
{
  NSArray *rawFilters = [self NSArray:json];
  NSMutableArray *filters = [NSMutableArray arrayWithCapacity:[rawFilters count]];
  [rawFilters enumerateObjectsUsingBlock:^(NSDictionary *rawFilter, NSUInteger idx, BOOL *stop) {
    NSString *keypath = rawFilter[@"keypath"];
    #if TARGET_OS_OSX
      NSColor *color = [ABI45_0_0RCTConvert NSColor:rawFilter[@"color"]];
    #else
      UIColor *color = [ABI45_0_0RCTConvert UIColor:rawFilter[@"color"]];
    #endif
      [filters addObject:@{
        @"color": color,
        @"keypath": keypath,
      }];
  }];
  return filters;
}

@end
