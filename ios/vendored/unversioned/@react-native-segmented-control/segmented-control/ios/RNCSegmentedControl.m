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

- (instancetype)initWithFrame:(CGRect)frame {
  if ((self = [super initWithFrame:frame])) {
    _selectedIndex = self.selectedSegmentIndex;
    [self addTarget:self
                  action:@selector(didChange)
        forControlEvents:UIControlEventValueChanged];
  }
  return self;
}

- (void)setValues:(NSArray *)values {
	[self removeAllSegments];
	for (id segment in values) {
		if ([segment isKindOfClass:[NSMutableDictionary class]]){
			UIImage *image = [[RCTConvert UIImage:segment] imageWithRenderingMode:UIImageRenderingModeAlwaysOriginal];
			[self insertSegmentWithImage:image
								 atIndex:self.numberOfSegments
								animated:NO];
		} else {
			[self insertSegmentWithTitle:(NSString *)segment
								 atIndex:self.numberOfSegments
								animated:NO];
		}
	}
	super.selectedSegmentIndex = _selectedIndex;
}

- (void)setSelectedIndex:(NSInteger)selectedIndex {
  _selectedIndex = selectedIndex;
  super.selectedSegmentIndex = selectedIndex;
}

- (void)setBackgroundColor:(UIColor *)backgroundColor {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) &&      \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    [super setBackgroundColor:backgroundColor];
  }
#endif
}

- (void)setTintColor:(UIColor *)tintColor {
  [super setTintColor:tintColor];
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) &&      \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    [self setSelectedSegmentTintColor:tintColor];
    NSDictionary *attributes = [NSDictionary
        dictionaryWithObjectsAndKeys:tintColor, NSForegroundColorAttributeName,
                                     nil];
    NSDictionary *activeAttributes = [NSDictionary
        dictionaryWithObjectsAndKeys:UIColor.labelColor,
                                     NSForegroundColorAttributeName, nil];
    [self setTitleTextAttributes:attributes forState:UIControlStateNormal];
    [self setTitleTextAttributes:activeAttributes
                        forState:UIControlStateSelected];
  }
#endif
}

- (void)didChange {
  _selectedIndex = self.selectedSegmentIndex;
  if (_onChange) {
	  NSString *segmentTitle = [self titleForSegmentAtIndex:_selectedIndex];
    _onChange(@{
		@"value" : (segmentTitle) ? segmentTitle : [self imageForSegmentAtIndex:_selectedIndex],
      @"selectedSegmentIndex" : @(_selectedIndex)
    });
  }
}

- (void)setAppearance:(NSString *)appearanceString {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) &&      \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    if ([appearanceString isEqual:@"dark"]) {
      [self setOverrideUserInterfaceStyle:UIUserInterfaceStyleDark];
    } else if ([appearanceString isEqual:@"light"]) {
      [self setOverrideUserInterfaceStyle:UIUserInterfaceStyleLight];
    }
  }
#endif
}

@end
