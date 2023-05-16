#import <RNReanimated/REAScreensHelper.h>

@implementation REAScreensHelper

#if LOAD_SCREENS_HEADERS

+ (UIView *)getScreenForView:(UIView *)view
{
  UIView *screen = view;
  while (![screen isKindOfClass:[RNSScreenView class]] && screen.superview != nil) {
    screen = screen.superview;
  }
  if ([screen isKindOfClass:[RNSScreenView class]]) {
    return screen;
  }
  return nil;
}

+ (UIView *)getStackForView:(UIView *)view
{
  if ([view isKindOfClass:[RNSScreenView class]]) {
    if (view.reactSuperview != nil) {
      if ([view.reactSuperview isKindOfClass:[RNSScreenStackView class]]) {
        return view.reactSuperview;
      }
    }
  }
  while (view != nil && ![view isKindOfClass:[RNSScreenStackView class]] && view.superview != nil) {
    view = view.superview;
  }
  if ([view isKindOfClass:[RNSScreenStackView class]]) {
    return view;
  }
  return nil;
}

+ (bool)isScreenModal:(UIView *)screen
{
  if ([screen isKindOfClass:[RNSScreenView class]]) {
    NSNumber *presentationMode = [screen valueForKey:@"stackPresentation"];
    bool isModal = ![presentationMode isEqual:@(0)];
    if (!isModal) {
      // case for modal with header
      UIView *parentScreen = [REAScreensHelper getScreenForView:screen.reactSuperview];
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
  UIView *screen = [REAScreensHelper getScreenForView:view];
  UIView *stack = [REAScreensHelper getStackForView:screen];
  UIView *screenWrapper = [REAScreensHelper getScreenForView:stack];
  return screenWrapper;
}

+ (int)getScreenType:(UIView *)screen;
{
  return [[screen valueForKey:@"stackPresentation"] intValue];
}

+ (bool)isRNSScreenType:(UIView *)view
{
  return [view isKindOfClass:[RNSScreen class]] == YES;
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
