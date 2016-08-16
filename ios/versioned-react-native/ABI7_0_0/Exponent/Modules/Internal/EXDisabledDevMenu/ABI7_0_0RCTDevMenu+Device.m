// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI7_0_0RCTDevMenu+Device.h"
#import "ABI7_0_0RCTUtils.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI7_0_0RCTDevMenuItem ()

@property (nonatomic, copy, readonly) NSString *title;

@end

@implementation ABI7_0_0RCTDevMenu (Device)

+ (void)load
{
  ABI7_0_0RCTSwapInstanceMethods(self, @selector(menuItems), @selector(ex_menuItems));
}

- (NSArray *)ex_menuItems
{
  NSArray *allMenuItems = [self ex_menuItems];
  NSString *className = NSStringFromClass([self class]);
  BOOL isVersioned = [className hasPrefix:@"ABI"];
  
#if TARGET_IPHONE_SIMULATOR
  // enable everything on simulator
  // but only if we're running in an ABI
  if (isVersioned) {
    return allMenuItems;
  }
#endif

  NSError *error;
  NSRegularExpression *regexToDisable;
  if (!isVersioned) {
    // TODO: enable live reloading once ABI7_0_0RCTReloadNotification is not global
    regexToDisable = [NSRegularExpression regularExpressionWithPattern:@"\\b(Live)\\b"
                                                               options:NSRegularExpressionUseUnicodeWordBoundaries
                                                                 error:&error];
  }
  if (!regexToDisable) {
    return allMenuItems;
  }
  
  NSIndexSet *indexes = [[self ex_menuItems] indexesOfObjectsWithOptions:NSEnumerationConcurrent passingTest:^BOOL(ABI7_0_0RCTDevMenuItem *menuItem, NSUInteger index, BOOL *stop) {
    NSRange matchRange = [regexToDisable rangeOfFirstMatchInString:menuItem.title options:0 range:NSMakeRange(0, menuItem.title.length)];
    return matchRange.location == NSNotFound;
  }];
  return [allMenuItems objectsAtIndexes:indexes];
}

@end

NS_ASSUME_NONNULL_END
