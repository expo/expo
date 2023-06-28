#import <ABI49_0_0RNReanimated/ABI49_0_0REAScreensHelper.h>

@implementation ABI49_0_0REAScreensHelper

#if LOAD_SCREENS_HEADERS

+ (UIView *)getScreenForView:(UIView *)view
{
  UIView *screen = view;
  while (![screen isKindOfClass:[ABI49_0_0RNSScreenView class]] && screen.superview != nil) {
    screen = screen.superview;
  }
  if ([screen isKindOfClass:[ABI49_0_0RNSScreenView class]]) {
    return screen;
  }
  return nil;
}

+ (UIView *)getStackForView:(UIView *)view
{
  if ([view isKindOfClass:[ABI49_0_0RNSScreenView class]]) {
    if (view.ABI49_0_0ReactSuperview != nil) {
      if ([view.ABI49_0_0ReactSuperview isKindOfClass:[ABI49_0_0RNSScreenStackView class]]) {
        return view.ABI49_0_0ReactSuperview;
      }
    }
  }
  while (view != nil && ![view isKindOfClass:[ABI49_0_0RNSScreenStackView class]] && view.superview != nil) {
    view = view.superview;
  }
  if ([view isKindOfClass:[ABI49_0_0RNSScreenStackView class]]) {
    return view;
  }
  return nil;
}

+ (bool)isScreenModal:(UIView *)screen
{
  if ([screen isKindOfClass:[ABI49_0_0RNSScreenView class]]) {
    NSNumber *presentationMode = [screen valueForKey:@"stackPresentation"];
    bool isModal = ![presentationMode isEqual:@(0)];
    if (!isModal) {
      // case for modal with header
      UIView *parentScreen = [ABI49_0_0REAScreensHelper getScreenForView:screen.ABI49_0_0ReactSuperview];
      if (parentScreen != nil) {
        isModal = [parentScreen valueForKey:@"stackPresentation"];
      }
    }
    return isModal;
  }
  return false;
}

+ (UIView *)getScreenWrapper:(UIView *)view
{
  UIView *screen = [ABI49_0_0REAScreensHelper getScreenForView:view];
  UIView *stack = [ABI49_0_0REAScreensHelper getStackForView:screen];
  UIView *screenWrapper = [ABI49_0_0REAScreensHelper getScreenForView:stack];
  return screenWrapper;
}

+ (int)getScreenType:(UIView *)screen;
{
  return [[screen valueForKey:@"stackPresentation"] intValue];
}

+ (bool)isRNSScreenType:(UIView *)view
{
  return [view isKindOfClass:[ABI49_0_0RNSScreen class]] == YES;
}

#else

+ (UIView *)getScreenForView:(UIView *)view
{
  return nil;
}

+ (UIView *)getStackForView:(UIView *)view
{
  return nil;
}

+ (bool)isScreenModal:(UIView *)screen
{
  return false;
}

+ (UIView *)getScreenWrapper:(UIView *)view
{
  return nil;
}

+ (int)getScreenType:(UIView *)screen;
{
  return 0;
}

+ (bool)isRNSScreenType:(UIView *)screen
{
  return false;
}

#endif // LOAD_SCREENS_HEADERS

@end
