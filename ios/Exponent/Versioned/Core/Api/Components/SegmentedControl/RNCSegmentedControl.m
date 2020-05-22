/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCSegmentedControl.h"

#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/UIView+React.h>

@implementation RNCSegmentedControl

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _selectedIndex = self.selectedSegmentIndex;
    [self addTarget:self action:@selector(didChange)
              forControlEvents:UIControlEventValueChanged];
      _attributes = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)setValues:(NSArray<NSString *> *)values
{
  [self removeAllSegments];
  for (NSString *value in values) {
    [self insertSegmentWithTitle:value atIndex:self.numberOfSegments animated:NO];
  }
  super.selectedSegmentIndex = _selectedIndex;
}

- (void)setSelectedIndex:(NSInteger)selectedIndex
{
  _selectedIndex = selectedIndex;
  super.selectedSegmentIndex = selectedIndex;
}

- (void)setFontSize:(NSInteger)fontSize
{
  UIFont *font = [UIFont systemFontOfSize: fontSize];
    [_attributes setObject: font forKey:NSFontAttributeName];
    [self setTitleTextAttributes:_attributes
                                forState:UIControlStateNormal];
  UIFont *fontBold = [UIFont boldSystemFontOfSize: fontSize];
    [_attributes setObject: fontBold forKey:NSFontAttributeName];
    [self setTitleTextAttributes:_attributes
                                forState:UIControlStateSelected];
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
    #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
        __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
    if (@available(iOS 13.0, *)) {
      [super setBackgroundColor:backgroundColor];
    }
    #endif
}

- (void)setTextColor:(UIColor *)textColor
{
    #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
        __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
    if (@available(iOS 13.0, *)) {
        [_attributes setObject: textColor forKey:NSForegroundColorAttributeName];
        [self setTitleTextAttributes:_attributes
                          forState:UIControlStateNormal];
    }
    #endif
}

- (void)setActiveTextColor:(UIColor *)textColor
{
    #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
        __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
    if (@available(iOS 13.0, *)) {
      [_attributes setObject: textColor forKey:NSForegroundColorAttributeName];
      [self setTitleTextAttributes:_attributes
                  forState:UIControlStateSelected];
    }
    #endif
}

- (void)setTintColor:(UIColor *)tintColor
{
  [super setTintColor:tintColor];
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    [self setSelectedSegmentTintColor:tintColor];
    [_attributes setObject: tintColor forKey:NSForegroundColorAttributeName];
    [self setTitleTextAttributes:_attributes
                  forState:UIControlStateNormal];
  }
#endif
}

- (void)didChange
{
  _selectedIndex = self.selectedSegmentIndex;
  if (_onChange) {
    _onChange(@{
      @"value": [self titleForSegmentAtIndex:_selectedIndex],
      @"selectedSegmentIndex": @(_selectedIndex)
    });
  }
}

- (void)setAppearance:(NSString *)appearanceString
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
      if ([appearanceString  isEqual: @"dark"]) {
          [self setOverrideUserInterfaceStyle:UIUserInterfaceStyleDark];
      } else if ([appearanceString  isEqual: @"light"]) {
          [self setOverrideUserInterfaceStyle:UIUserInterfaceStyleLight];
      }
  }
#endif
}

@end
