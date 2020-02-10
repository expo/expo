// Copyright © 2018 650 Industries. All rights reserved.

#import <objc/runtime.h>
#import <EXSplashScreen/UIView+SubviewObserver.h>

@implementation UIView (SubviewObserver)

+ (void)load
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class class = [self class];
    
    // 1. didAddSubview
    
    SEL originalSelectorDidAddSubview = @selector(didAddSubview:);
    SEL swizzledSelectorDidAddSubview = @selector(swizzled_didAddSubview:);
    
    Method originalMethodDidAddSubview = class_getInstanceMethod(class, originalSelectorDidAddSubview);
    Method swizzledMethodDidAddSubview = class_getInstanceMethod(class, swizzledSelectorDidAddSubview);
    
    if (class_addMethod(class, originalSelectorDidAddSubview, method_getImplementation(swizzledMethodDidAddSubview), method_getTypeEncoding(swizzledMethodDidAddSubview))) {
      class_replaceMethod(class, swizzledSelectorDidAddSubview, method_getImplementation(originalMethodDidAddSubview), method_getTypeEncoding(originalMethodDidAddSubview));
    } else {
      method_exchangeImplementations(originalMethodDidAddSubview, swizzledMethodDidAddSubview);
    }
    
    // 2. willRemoveSubview
    
    SEL originalSelectorWillRemoveSubview = @selector(willRemoveSubview:);
    SEL swizzledSelectorWillRemoveSubview = @selector(swizzled_willRemoveSubview:);
    
    Method originalMethodWillRemoveSubview = class_getInstanceMethod(class, originalSelectorWillRemoveSubview);
    Method swizzledMethodWillRemoveSubview = class_getInstanceMethod(class, swizzledSelectorWillRemoveSubview);
    
    if (class_addMethod(class, originalSelectorWillRemoveSubview, method_getImplementation(swizzledMethodWillRemoveSubview), method_getTypeEncoding(swizzledMethodWillRemoveSubview))) {
      class_replaceMethod(class, swizzledSelectorWillRemoveSubview, method_getImplementation(originalMethodWillRemoveSubview), method_getTypeEncoding(originalMethodWillRemoveSubview));
    } else {
      method_exchangeImplementations(originalMethodWillRemoveSubview, swizzledMethodWillRemoveSubview);
    }
  });
}

# pragma mark - firstLastSubviewObserver

@dynamic subviewObserver;

- (void)setSubviewObserver:(id<UIViewSubviewObserver>)subviewObserver
{
  objc_setAssociatedObject(self, @selector(subviewObserver), subviewObserver, OBJC_ASSOCIATION_ASSIGN);
}

- (id<UIViewSubviewObserver>)subviewObserver
{
  return objc_getAssociatedObject(self, @selector(subviewObserver));
}

# pragma mark - Method Swizzling

- (void)swizzled_didAddSubview:(UIView *)subview
{
  [self swizzled_didAddSubview:subview];
  if (self.subviewObserver && [self.subviewObserver respondsToSelector:@selector(didAddSubview:)]) {
    [self.subviewObserver didAddSubview:subview];
  }
}

- (void)swizzled_willRemoveSubview:(UIView *)subview
{
  if (self.subviewObserver && [self.subviewObserver respondsToSelector:@selector(willRemoveSubview:)]) {
    [self.subviewObserver willRemoveSubview:subview];
  }
  [self swizzled_willRemoveSubview:subview];
}

@end

# pragma mark - Unused

//- (void)searchForRootView
//{
//  UIView *rootView = [self locateRootView:_viewController.view];
//  if (rootView) {
//    return [self handleRootView:rootView];
//  }
//  UM_WEAKIFY(self);
//  dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC * 0.02);
//  dispatch_after(delay, _queue, ^{
//                 UM_ENSURE_STRONGIFY(self);
//                 [self searchForRootView];
//                 });
//}
//
//- (UIView *)locateRootView:(UIView*)view
//{
//  if ([view isKindOfClass:_rootViewClass]) {
//    return view;
//  }
//  for (UIView *subview in view.subviews) {
//    UIView *rootView = [self locateRootView:subview];
//    if (rootView) {
//      return rootView;
//    }
//  }
//  return nil;
//}
//
//- (void)handleRootView:(UIView *)rootView
//{
//  _rootView = rootView;
//  NSInteger subviewCountToHideSplashScreen = [_splashScreenView isDescendantOfView:_rootView] ? 1 : 0;
//  if (_rootView.subviews.count > subviewCountToHideSplashScreen) {
//    if (self.autoHideEnabled) {
//      [self hideWithCallback:nil];
//    }
//  }
//}

//# pragma mark UIViewFirstLastSubviewObserver
//
//- (void)didAddSubview:(nonnull UIView *)subview {
//  if (subview == _splashScreenView) {
//    return;
//  }
//  if ([_splashScreenView isDescendantOfView:_rootView]) { // TODO: @bbarthec: _splashScreenShown?
//    if (_autoHideEnabled && _rootView.subviews.count == 2) {
//      if (self.autoHideEnabled) {
//        [self hideWithCallback:nil];
//      }
//    }
//  } else {
//    // SplashScreen is hidden
//  }
//}
//
//- (void)willRemoveSubview:(nonnull UIView *)subview {
//  if (subview == _splashScreenView) {
//    return;
//  }
//  if ([_splashScreenView isDescendantOfView:_rootView]) { // TODO: @bbarthec: _splashScreenShown?
//    // SplashScreen is shown
//  } else {
//    if (_rootView.subviews.count == 1) {
//      [self showWithCallback:nil];
//    }
//  }
//}
