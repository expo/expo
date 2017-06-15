// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI18_0_0EXScreenOrientation.h"

#import <UIKit/UIKit.h>
#import "ABI18_0_0EXUnversioned.h"

@implementation ABI18_0_0EXScreenOrientation

ABI18_0_0RCT_EXPORT_MODULE(ExponentScreenOrientation);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

@synthesize bridge = _bridge;

- (void)setBridge:(ABI18_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

ABI18_0_0RCT_EXPORT_METHOD(allow:(NSString *)orientation)
{
  UIInterfaceOrientationMask orientationMask = [self orientationMaskFromOrientation:orientation];

  [[NSNotificationCenter defaultCenter]
      postNotificationName:@"EXChangeForegroundTaskSupportedOrientations"
                    object:self
                  userInfo:@{@"orientation": @(orientationMask)}];
}

- (UIInterfaceOrientationMask)orientationMaskFromOrientation:(NSString *)orientation
{
  if ([orientation isEqualToString:@"ALL"]) {
    return UIInterfaceOrientationMaskAll;
  } else if ([orientation isEqualToString:@"ALL_BUT_UPSIDE_DOWN"]) {
    return UIInterfaceOrientationMaskAllButUpsideDown;
  } else if ([orientation isEqualToString:@"LANDSCAPE"]) {
    return UIInterfaceOrientationMaskLandscape;
  } else if ([orientation isEqualToString:@"LANDSCAPE_LEFT"]) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if ([orientation isEqualToString:@"LANDSCAPE_RIGHT"]) {
    return UIInterfaceOrientationMaskLandscapeRight;
  } else if ([orientation isEqualToString:@"PORTRAIT"]) {
    return UIInterfaceOrientationMaskPortrait;
  } else if ([orientation isEqualToString:@"PORTRAIT_UP"]) {
    return UIInterfaceOrientationMaskPortrait;
  } else if ([orientation isEqualToString:@"PORTRAIT_DOWN"]) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:[NSString stringWithFormat:@"Invalid screen orientation %@", orientation]
                                 userInfo:nil];
  }
}

@end
