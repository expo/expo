// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTDevMenu+Device.h"
#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTDevMenuItem ()

@property (nonatomic, copy, readonly) NSString *title;

@end

@implementation RCTDevMenu (Device)

// this is dead code for now, but keeping it around because there's a strong chance
// it will come back soon
- (NSArray *)menuItems: (NSArray *)items notContainingPattern: (NSString *)pattern
{
  NSError *error;
  NSRegularExpression *regexToDisable = [NSRegularExpression regularExpressionWithPattern:pattern
                                                                                  options:NSRegularExpressionUseUnicodeWordBoundaries
                                                                                    error:&error];
  if (!regexToDisable) {
    return items;
  }
  
  NSIndexSet *indexes = [items indexesOfObjectsWithOptions:NSEnumerationConcurrent passingTest:^BOOL(RCTDevMenuItem *menuItem, NSUInteger index, BOOL *stop) {
    NSRange matchRange = [regexToDisable rangeOfFirstMatchInString:menuItem.title options:0 range:NSMakeRange(0, menuItem.title.length)];
    return matchRange.location == NSNotFound;
  }];
  return [items objectsAtIndexes:indexes];
}

@end

NS_ASSUME_NONNULL_END
