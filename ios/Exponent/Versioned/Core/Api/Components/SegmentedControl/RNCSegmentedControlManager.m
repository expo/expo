/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNCSegmentedControlManager.h"

#import "RNCSegmentedControl.h"
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>

@implementation RNCSegmentedControlManager

RCT_EXPORT_MODULE()

- (UIView *)view {
  return [RNCSegmentedControl new];
}

RCT_EXPORT_VIEW_PROPERTY(values, NSArray)
RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(appearance, NSString)

RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSObject, RNCSegmentedControl) {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) &&      \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    if (json) {
      UIColor *color = json[@"color"] ? [RCTConvert UIColor:json[@"color"]]
                                      : UIColor.labelColor;
      NSInteger fontSize =
          json[@"fontSize"] ? [RCTConvert NSInteger:json[@"fontSize"]] : 13.0;
      UIFont *font = [UIFont systemFontOfSize:fontSize];
      if (json[@"fontFamily"]) {
        UIFont *tempFont = [UIFont fontWithName:json[@"fontFamily"]
                                           size:fontSize];
        if (tempFont != nil) {
          font = tempFont;
        }
      }

      NSDictionary *attributes = [NSDictionary
          dictionaryWithObjectsAndKeys:font, NSFontAttributeName, color,
                                       NSForegroundColorAttributeName, nil];
      [view setTitleTextAttributes:attributes forState:UIControlStateNormal];
    }
  }
#endif
}

RCT_CUSTOM_VIEW_PROPERTY(activeFontStyle, NSObject, RNCSegmentedControl) {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) &&      \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    if (json) {
      UIColor *color = json[@"color"] ? [RCTConvert UIColor:json[@"color"]]
                                      : UIColor.labelColor;
      NSInteger fontSize =
          json[@"fontSize"] ? [RCTConvert NSInteger:json[@"fontSize"]] : 13.0;
      UIFont *font = [UIFont boldSystemFontOfSize:fontSize];
      if (json[@"fontFamily"]) {
        font = [UIFont fontWithName:json[@"fontFamily"] size:fontSize];
      }
      NSDictionary *attributes = [NSDictionary
          dictionaryWithObjectsAndKeys:font, NSFontAttributeName, color,
                                       NSForegroundColorAttributeName, nil];
      [view setTitleTextAttributes:attributes forState:UIControlStateSelected];
    }
  }
#endif
}

@end
