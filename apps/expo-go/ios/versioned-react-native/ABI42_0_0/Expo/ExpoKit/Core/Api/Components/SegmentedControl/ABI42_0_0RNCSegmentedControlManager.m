/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNCSegmentedControlManager.h"

#import "ABI42_0_0RNCSegmentedControl.h"
#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>

@implementation ABI42_0_0RNCSegmentedControlManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view {
  return [ABI42_0_0RNCSegmentedControl new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(values, NSArray)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(selectedIndex, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(momentary, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(appearance, NSString)

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(fontStyle, NSObject, ABI42_0_0RNCSegmentedControl) {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) &&      \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    if (json) {
      UIColor *color = json[@"color"] ? [ABI42_0_0RCTConvert UIColor:json[@"color"]]
                                      : UIColor.labelColor;
      NSInteger fontSize =
          json[@"fontSize"] ? [ABI42_0_0RCTConvert NSInteger:json[@"fontSize"]] : 13.0;
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

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(activeFontStyle, NSObject, ABI42_0_0RNCSegmentedControl) {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) &&      \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    if (json) {
      UIColor *color = json[@"color"] ? [ABI42_0_0RCTConvert UIColor:json[@"color"]]
                                      : UIColor.labelColor;
      NSInteger fontSize =
          json[@"fontSize"] ? [ABI42_0_0RCTConvert NSInteger:json[@"fontSize"]] : 13.0;
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
