// Copyright 2026-present 650 Industries. All rights reserved.

#import "ExpoRouterBarButtonAxisBehavior.h"

@implementation ExpoRouterBarButtonAxisBehavior

+ (void)applyAxisBehavior:(NSString *)behavior toItem:(UIBarButtonItem *)item {
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1 && !TARGET_OS_TV && !TARGET_OS_VISION
  if (@available(iOS 27.1, *)) {
    UIBarButtonItemAxisBehavior value = UIBarButtonItemAxisBehaviorAutomatic;
    if ([behavior isEqualToString:@"horizontalOnly"]) {
      value = UIBarButtonItemAxisBehaviorHorizontalOnly;
    } else if ([behavior isEqualToString:@"verticalPreferred"]) {
      value = UIBarButtonItemAxisBehaviorVerticalPreferred;
    }
    item.axisBehavior = value;
    return;
  }
#endif
  (void)behavior;
  (void)item;
}

@end
