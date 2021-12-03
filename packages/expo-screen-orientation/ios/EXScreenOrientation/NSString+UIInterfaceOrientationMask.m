// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXScreenOrientation/NSString+UIInterfaceOrientationMask.h>

@implementation NSString (UIInterfaceOrientationMask)

- (UIInterfaceOrientationMask)toUIInterfaceOrientationMask
{
#define RETURN_VALUE_CHECKED(OPTION) if ([self isEqualToString:@#OPTION]) { return OPTION; }
  RETURN_VALUE_CHECKED(UIInterfaceOrientationMaskPortrait)
  RETURN_VALUE_CHECKED(UIInterfaceOrientationMaskLandscapeLeft)
  RETURN_VALUE_CHECKED(UIInterfaceOrientationMaskLandscapeRight)
  RETURN_VALUE_CHECKED(UIInterfaceOrientationMaskPortraitUpsideDown)
  RETURN_VALUE_CHECKED(UIInterfaceOrientationMaskLandscape)
  RETURN_VALUE_CHECKED(UIInterfaceOrientationMaskAll)
  RETURN_VALUE_CHECKED(UIInterfaceOrientationMaskAllButUpsideDown)
#undef RETURN_VALUE_CHECKED
  @throw [NSException exceptionWithName:NSInvalidArgumentException reason:@"Invalid UIInterfaceOrientationMask value" userInfo:nil];
}

@end
