#import "ABI41_0_0RNSScreenStackHeaderConfig.h"
#import "ABI41_0_0RNSScreen.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManagerUtils.h>
#import <ABI41_0_0React/ABI41_0_0RCTShadowView.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageLoader.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageView.h>
#import <ABI41_0_0React/ABI41_0_0RCTImageSource.h>
#import <ABI41_0_0React/ABI41_0_0RCTFont.h>

// Some ABI41_0_0RN private method hacking below. Couldn't figure out better way to access image data
// of a given ABI41_0_0RCTImageView. See more comments in the code section processing SubviewTypeBackButton
@interface ABI41_0_0RCTImageView (Private)
- (UIImage*)image;
@end

@interface ABI41_0_0RCTImageLoader (Private)
- (id<ABI41_0_0RCTImageCache>)imageCache;
@end


@interface ABI41_0_0RNSScreenStackHeaderSubview : UIView

@property (nonatomic, weak) ABI41_0_0RCTBridge *bridge;
@property (nonatomic, weak) UIView *ABI41_0_0ReactSuperview;
@property (nonatomic) ABI41_0_0RNSScreenStackHeaderSubviewType type;

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge*)bridge;

@end

@implementation ABI41_0_0RNSScreenStackHeaderSubview

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

@end

@implementation ABI41_0_0RNSScreenStackHeaderConfig {
  NSMutableArray<ABI41_0_0RNSScreenStackHeaderSubview *> *_ABI41_0_0ReactSubviews;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.hidden = YES;
    _translucent = YES;
    _ABI41_0_0ReactSubviews = [NSMutableArray new];
  }
  return self;
}

- (void)insertABI41_0_0ReactSubview:(ABI41_0_0RNSScreenStackHeaderSubview *)subview atIndex:(NSInteger)atIndex
{
  [_ABI41_0_0ReactSubviews insertObject:subview atIndex:atIndex];
  subview.ABI41_0_0ReactSuperview = self;
}

- (void)removeABI41_0_0ReactSubview:(ABI41_0_0RNSScreenStackHeaderSubview *)subview
{
  [_ABI41_0_0ReactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)ABI41_0_0ReactSubviews
{
  return _ABI41_0_0ReactSubviews;
}

- (UIView *)ABI41_0_0ReactSuperview
{
  return _screenView;
}

- (void)removeFromSuperview
{
  [super removeFromSuperview];
  _screenView = nil;
}

- (void)updateViewControllerIfNeeded
{
  UIViewController *vc = _screenView.controller;
  UINavigationController *nav = (UINavigationController*) vc.parentViewController;
  UIViewController *nextVC = nav.visibleViewController;
  if (nav.transitionCoordinator != nil) {
    // if navigator is performing transition instead of allowing to update of `visibleConttroller`
    // we look at `topController`. This is because during transitiong the `visibleController` won't
    // point to the controller that is going to be revealed after transition. This check fixes the
    // problem when config gets updated while the transition is ongoing.
    nextVC = nav.topViewController;
  }

  BOOL isInFullScreenModal = nav == nil && _screenView.stackPresentation == ABI41_0_0RNSScreenStackPresentationFullScreenModal;
  // if nav is nil, it means we can be in a fullScreen modal, so there is no nextVC, but we still want to update
  if (vc != nil && (nextVC == vc || isInFullScreenModal)) {
    [ABI41_0_0RNSScreenStackHeaderConfig updateViewController:self.screenView.controller
                                          withConfig:self
                                            animated:YES];
  }
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self updateViewControllerIfNeeded];
}

- (void)didUpdateABI41_0_0ReactSubviews
{
  [super didUpdateABI41_0_0ReactSubviews];
  [self updateViewControllerIfNeeded];
}

+ (void)setAnimatedConfig:(UIViewController *)vc withConfig:(ABI41_0_0RNSScreenStackHeaderConfig *)config
{
  UINavigationBar *navbar = ((UINavigationController *)vc.parentViewController).navigationBar;
  // It is workaround for loading custom back icon when transitioning from a screen without header to the screen which has one.
  // This action fails when navigating to the screen with header for the second time and loads default back button.
  // It looks like changing the tint color of navbar triggers an update of the items belonging to it and it seems to load the custom back image
  // so we change the tint color's alpha by a very small amount and then set it to the one it should have.
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_14_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0
  // it brakes the behavior of `headerRight` in iOS 14, where the bug desribed above seems to be fixed, so we do nothing in iOS 14
  if (@available(iOS 14.0, *)) {} else
#endif
  {
    [navbar setTintColor:[config.color colorWithAlphaComponent:CGColorGetAlpha(config.color.CGColor) - 0.01]];
  }
  [navbar setTintColor:config.color];

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    // font customized on the navigation item level, so nothing to do here
  } else
#endif
  {
    BOOL hideShadow = config.hideShadow;

    if (config.backgroundColor && CGColorGetAlpha(config.backgroundColor.CGColor) == 0.) {
      [navbar setBackgroundImage:[UIImage new] forBarMetrics:UIBarMetricsDefault];
      [navbar setBarTintColor:[UIColor clearColor]];
      hideShadow = YES;
    } else {
      [navbar setBackgroundImage:nil forBarMetrics:UIBarMetricsDefault];
      [navbar setBarTintColor:config.backgroundColor];
    }
    [navbar setTranslucent:config.translucent];
    [navbar setValue:@(hideShadow ? YES : NO) forKey:@"hidesShadow"];

    if (config.titleFontFamily || config.titleFontSize || config.titleFontWeight || config.titleColor) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];

      if (config.titleColor) {
        attrs[NSForegroundColorAttributeName] = config.titleColor;
      }

      NSString *family = config.titleFontFamily ?: nil;
      NSNumber *size = config.titleFontSize ?: @17;
      NSString *weight = config.titleFontWeight ?: nil;
      if (family || weight) {
        attrs[NSFontAttributeName] = [ABI41_0_0RCTFont updateFont:nil withFamily:family size:size weight:weight style:nil variant:nil scaleMultiplier:1.0];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:[size floatValue]];
      }
      [navbar setTitleTextAttributes:attrs];
    }

#if !TARGET_OS_TV
    if (@available(iOS 11.0, *)) {
      if (config.largeTitle && (config.largeTitleFontFamily || config.largeTitleFontSize || config.largeTitleFontWeight || config.largeTitleColor || config.titleColor)) {
        NSMutableDictionary *largeAttrs = [NSMutableDictionary new];
        if (config.largeTitleColor || config.titleColor) {
          largeAttrs[NSForegroundColorAttributeName] = config.largeTitleColor ? config.largeTitleColor : config.titleColor;
        }
        NSString *largeFamily = config.largeTitleFontFamily ?: nil;
        NSNumber *largeSize = config.largeTitleFontSize ?: @34;
        NSString *largeWeight = config.largeTitleFontWeight ?: nil;
        if (largeFamily || largeWeight) {
          largeAttrs[NSFontAttributeName] = [ABI41_0_0RCTFont updateFont:nil withFamily:largeFamily size:largeSize weight:largeWeight style:nil variant:nil scaleMultiplier:1.0];
        } else {
          largeAttrs[NSFontAttributeName] = [UIFont systemFontOfSize:[largeSize floatValue] weight:UIFontWeightBold];
        }
        [navbar setLargeTitleTextAttributes:largeAttrs];
      }
    }
#endif
  }
}

+ (void)setTitleAttibutes:(NSDictionary *)attrs forButton:(UIBarButtonItem *)button
{
  [button setTitleTextAttributes:attrs forState:UIControlStateNormal];
  [button setTitleTextAttributes:attrs forState:UIControlStateHighlighted];
  [button setTitleTextAttributes:attrs forState:UIControlStateDisabled];
  [button setTitleTextAttributes:attrs forState:UIControlStateSelected];
  [button setTitleTextAttributes:attrs forState:UIControlStateFocused];
}

+ (UIImage*)loadBackButtonImageInViewController:(UIViewController *)vc
                                     withConfig:(ABI41_0_0RNSScreenStackHeaderConfig *)config
{
  BOOL hasBackButtonImage = NO;
  for (ABI41_0_0RNSScreenStackHeaderSubview *subview in config.ABI41_0_0ReactSubviews) {
    if (subview.type == ABI41_0_0RNSScreenStackHeaderSubviewTypeBackButton && subview.subviews.count > 0) {
      hasBackButtonImage = YES;
      ABI41_0_0RCTImageView *imageView = subview.subviews[0];
      if (imageView.image == nil) {
        // This is yet another workaround for loading custom back icon. It turns out that under
        // certain circumstances image attribute can be null despite the app running in production
        // mode (when images are loaded from the filesystem). This can happen because image attribute
        // is reset when image view is detached from window, and also in some cases initialization
        // does not populate the frame of the image view before the loading start. The latter result
        // in the image attribute not being updated. We manually set frame to the size of an image
        // in order to trigger proper reload that'd update the image attribute.
        ABI41_0_0RCTImageSource *source = imageView.imageSources[0];
        [imageView ABI41_0_0ReactSetFrame:CGRectMake(imageView.frame.origin.x,
                                            imageView.frame.origin.y,
                                            source.size.width,
                                            source.size.height)];
      }
      UIImage *image = imageView.image;
      // IMPORTANT!!!
      // image can be nil in DEV MODE ONLY
      //
      // It is so, because in dev mode images are loaded over HTTP from the packager. In that case
      // we first check if image is already loaded in cache and if it is, we take it from cache and
      // display immediately. Otherwise we wait for the transition to finish and retry updating
      // header config.
      // Unfortunately due to some problems in UIKit we cannot update the image while the screen
      // transition is ongoing. This results in the settings being reset after the transition is done
      // to the state from before the transition.
      if (image == nil) {
        // in DEV MODE we try to load from cache (we use private API for that as it is not exposed
        // publically in headers).
        ABI41_0_0RCTImageSource *source = imageView.imageSources[0];
        ABI41_0_0RCTImageLoader *imageloader = [subview.bridge moduleForClass:[ABI41_0_0RCTImageLoader class]];
        image = [imageloader.imageCache
                 imageForUrl:source.request.URL.absoluteString
                 size:source.size
                 scale:source.scale
                 resizeMode:imageView.resizeMode];
      }
      if (image == nil) {
        // This will be triggered if the image is not in the cache yet. What we do is we wait until
        // the end of transition and run header config updates again. We could potentially wait for
        // image on load to trigger, but that would require even more private method hacking.
        if (vc.transitionCoordinator) {
          [vc.transitionCoordinator animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext>  _Nonnull context) {
            // nothing, we just want completion
          } completion:^(id<UIViewControllerTransitionCoordinatorContext>  _Nonnull context) {
            // in order for new back button image to be loaded we need to trigger another change
            // in back button props that'd make UIKit redraw the button. Otherwise the changes are
            // not reflected. Here we change back button visibility which is then immediately restored
#if !TARGET_OS_TV
            vc.navigationItem.hidesBackButton = YES;
#endif
            [config updateViewControllerIfNeeded];
          }];
        }
        return [UIImage new];
      } else {
        return image;
      }
    }
  }
  return nil;
}

+ (void)willShowViewController:(UIViewController *)vc animated:(BOOL)animated withConfig:(ABI41_0_0RNSScreenStackHeaderConfig *)config
{
  [self updateViewController:vc withConfig:config animated:animated];
}

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
+ (UINavigationBarAppearance*)buildAppearance:(UIViewController *)vc withConfig:(ABI41_0_0RNSScreenStackHeaderConfig *)config
API_AVAILABLE(ios(13.0)){
  UINavigationBarAppearance *appearance = [UINavigationBarAppearance new];

  if (config.backgroundColor && CGColorGetAlpha(config.backgroundColor.CGColor) == 0.) {
    // transparent background color
    [appearance configureWithTransparentBackground];
  } else {
    [appearance configureWithOpaqueBackground];
  }

  // set background color if specified
  if (config.backgroundColor) {
    appearance.backgroundColor = config.backgroundColor;
  }

  if (config.blurEffect) {
    appearance.backgroundEffect = [UIBlurEffect effectWithStyle:config.blurEffect];
  }

  if (config.hideShadow) {
    appearance.shadowColor = nil;
  }

  if (config.titleFontFamily || config.titleFontSize || config.titleFontWeight || config.titleColor) {
    NSMutableDictionary *attrs = [NSMutableDictionary new];

    if (config.titleColor) {
      attrs[NSForegroundColorAttributeName] = config.titleColor;
    }

    NSString *family = config.titleFontFamily ?: nil;
    NSNumber *size = config.titleFontSize ?: @17;
    NSString *weight = config.titleFontWeight ?: nil;
    if (family || weight) {
      attrs[NSFontAttributeName] = [ABI41_0_0RCTFont updateFont:nil withFamily:config.titleFontFamily size:size weight:weight style:nil variant:nil scaleMultiplier:1.0];
    } else {
      attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:[size floatValue]];
    }
    appearance.titleTextAttributes = attrs;
  }

  if (config.largeTitleFontFamily || config.largeTitleFontSize || config.largeTitleFontWeight || config.largeTitleColor || config.titleColor) {
    NSMutableDictionary *largeAttrs = [NSMutableDictionary new];

    if (config.largeTitleColor || config.titleColor) {
      largeAttrs[NSForegroundColorAttributeName] = config.largeTitleColor ? config.largeTitleColor : config.titleColor;
    }

    NSString *largeFamily = config.largeTitleFontFamily ?: nil;
    NSNumber *largeSize = config.largeTitleFontSize ?: @34;
    NSString *largeWeight = config.largeTitleFontWeight ?: nil;
    if (largeFamily || largeWeight) {
      largeAttrs[NSFontAttributeName] = [ABI41_0_0RCTFont updateFont:nil withFamily:largeFamily size:largeSize weight:largeWeight style:nil variant:nil scaleMultiplier:1.0];
    } else {
      largeAttrs[NSFontAttributeName] = [UIFont systemFontOfSize:[largeSize floatValue] weight:UIFontWeightBold];
    }

    appearance.largeTitleTextAttributes = largeAttrs;
  }

  UIImage *backButtonImage = [self loadBackButtonImageInViewController:vc withConfig:config];
  if (backButtonImage) {
    [appearance setBackIndicatorImage:backButtonImage transitionMaskImage:backButtonImage];
  } else if (appearance.backIndicatorImage) {
    [appearance setBackIndicatorImage:nil transitionMaskImage:nil];
  }
  return appearance;
}
#endif

+ (void)updateViewController:(UIViewController *)vc withConfig:(ABI41_0_0RNSScreenStackHeaderConfig *)config animated:(BOOL)animated
{
  UINavigationItem *navitem = vc.navigationItem;
  UINavigationController *navctr = (UINavigationController *)vc.parentViewController;

  NSUInteger currentIndex = [navctr.viewControllers indexOfObject:vc];
  UINavigationItem *prevItem = currentIndex > 0 ? [navctr.viewControllers objectAtIndex:currentIndex - 1].navigationItem : nil;

  BOOL wasHidden = navctr.navigationBarHidden;
  BOOL shouldHide = config == nil || config.hide;

  if (!shouldHide && !config.translucent) {
    // when nav bar is not translucent we chage edgesForExtendedLayout to avoid system laying out
    // the screen underneath navigation controllers
    vc.edgesForExtendedLayout = UIRectEdgeNone;
  } else {
    // system default is UIRectEdgeAll
    vc.edgesForExtendedLayout = UIRectEdgeAll;
  }

  [navctr setNavigationBarHidden:shouldHide animated:animated];

#if !TARGET_OS_TV
  // we put it before check with return because we want to apply changes to status bar even if the header is hidden
  if (config != nil) {
    if (config.statusBarStyle || config.statusBarAnimation || config.statusBarHidden) {
      [ABI41_0_0RNSScreenStackHeaderConfig assertViewControllerBasedStatusBarAppearenceSet];
      if ([vc isKindOfClass:[ABI41_0_0RNSScreen class]]) {
        [ABI41_0_0RNSScreenStackHeaderConfig updateStatusBarAppearance];
      }
    }
    if (config.screenOrientation) {
      [ABI41_0_0RNSScreenStackHeaderConfig enforceDesiredDeviceOrientation];
    }
  }
#endif

  if (config.direction == UISemanticContentAttributeForceLeftToRight || config.direction == UISemanticContentAttributeForceRightToLeft) {
    navctr.view.semanticContentAttribute = config.direction;
    navctr.navigationBar.semanticContentAttribute = config.direction;
  }

  if (shouldHide) {
    return;
  }
  
  navitem.title = config.title;
#if !TARGET_OS_TV
  if (config.backTitle != nil || config.backTitleFontFamily || config.backTitleFontSize) {
    prevItem.backBarButtonItem = [[UIBarButtonItem alloc]
                                  initWithTitle:config.backTitle ?: prevItem.title
                                  style:UIBarButtonItemStylePlain
                                  target:nil
                                  action:nil];
    if (config.backTitleFontFamily || config.backTitleFontSize) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];
      NSNumber *size = config.backTitleFontSize ?: @17;
      if (config.backTitleFontFamily) {
        attrs[NSFontAttributeName] = [ABI41_0_0RCTFont updateFont:nil withFamily:config.backTitleFontFamily size:size weight:nil style:nil variant:nil scaleMultiplier:1.0];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:[size floatValue]];
      }
      [self setTitleAttibutes:attrs forButton:prevItem.backBarButtonItem];
    }
  } else {
    prevItem.backBarButtonItem = nil;
  }

  if (@available(iOS 11.0, *)) {
    if (config.largeTitle) {
      navctr.navigationBar.prefersLargeTitles = YES;
    }
    navitem.largeTitleDisplayMode = config.largeTitle ? UINavigationItemLargeTitleDisplayModeAlways : UINavigationItemLargeTitleDisplayModeNever;
  }
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    UINavigationBarAppearance *appearance = [self buildAppearance:vc withConfig:config];
    navitem.standardAppearance = appearance;
    navitem.compactAppearance = appearance;

    UINavigationBarAppearance *scrollEdgeAppearance = [[UINavigationBarAppearance alloc] initWithBarAppearance:appearance];
    if (config.largeTitleBackgroundColor != nil) {
      scrollEdgeAppearance.backgroundColor = config.largeTitleBackgroundColor;
    }
    if (config.largeTitleHideShadow) {
      scrollEdgeAppearance.shadowColor = nil;
    }
    navitem.scrollEdgeAppearance = scrollEdgeAppearance;
  } else
#endif
  {
#if !TARGET_OS_TV
    // updating backIndicatotImage does not work when called during transition. On iOS pre 13 we need
    // to update it before the navigation starts.
    UIImage *backButtonImage = [self loadBackButtonImageInViewController:vc withConfig:config];
    if (backButtonImage) {
      navctr.navigationBar.backIndicatorImage = backButtonImage;
      navctr.navigationBar.backIndicatorTransitionMaskImage = backButtonImage;
    } else if (navctr.navigationBar.backIndicatorImage) {
      navctr.navigationBar.backIndicatorImage = nil;
      navctr.navigationBar.backIndicatorTransitionMaskImage = nil;
    }
#endif
  }
#if !TARGET_OS_TV
  navitem.hidesBackButton = config.hideBackButton;
#endif
  navitem.leftBarButtonItem = nil;
  navitem.rightBarButtonItem = nil;
  navitem.titleView = nil;
  for (ABI41_0_0RNSScreenStackHeaderSubview *subview in config.ABI41_0_0ReactSubviews) {
    switch (subview.type) {
      case ABI41_0_0RNSScreenStackHeaderSubviewTypeLeft: {
#if !TARGET_OS_TV
        navitem.leftItemsSupplementBackButton = config.backButtonInCustomView;
#endif
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.leftBarButtonItem = buttonItem;
        break;
      }
      case ABI41_0_0RNSScreenStackHeaderSubviewTypeRight: {
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.rightBarButtonItem = buttonItem;
        break;
      }
      case ABI41_0_0RNSScreenStackHeaderSubviewTypeCenter:
      case ABI41_0_0RNSScreenStackHeaderSubviewTypeTitle: {
        navitem.titleView = subview;
        break;
      }
      case ABI41_0_0RNSScreenStackHeaderSubviewTypeBackButton: {
        break;
      }
    }
  }

  if (animated
      && vc.transitionCoordinator != nil
      && vc.transitionCoordinator.presentationStyle == UIModalPresentationNone
      && !wasHidden) {
    // when there is an ongoing transition we may need to update navbar setting in animation block
    // using animateAlongsideTransition. However, we only do that given the transition is not a modal
    // transition (presentationStyle == UIModalPresentationNone) and that the bar was not previously
    // hidden. This is because both for modal transitions and transitions from screen with hidden bar
    // the transition animation block does not get triggered. This is ok, because with both of those
    // types of transitions there is no "shared" navigation bar that needs to be updated in an animated
    // way.
    [vc.transitionCoordinator animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext>  _Nonnull context) {
      [self setAnimatedConfig:vc withConfig:config];
    } completion:^(id<UIViewControllerTransitionCoordinatorContext>  _Nonnull context) {
      if ([context isCancelled]) {
        UIViewController* fromVC = [context  viewControllerForKey:UITransitionContextFromViewControllerKey];
        ABI41_0_0RNSScreenStackHeaderConfig* config = nil;
        for (UIView *subview in fromVC.view.ABI41_0_0ReactSubviews) {
          if ([subview isKindOfClass:[ABI41_0_0RNSScreenStackHeaderConfig class]]) {
            config = (ABI41_0_0RNSScreenStackHeaderConfig*) subview;
            break;
          }
        }
        [self setAnimatedConfig:fromVC withConfig:config];
      }
    }];
  } else {
    [self setAnimatedConfig:vc withConfig:config];
  }
}

#if !TARGET_OS_TV
+ (void)assertViewControllerBasedStatusBarAppearenceSet
{
  static dispatch_once_t once;
  static bool viewControllerBasedAppearence;
  dispatch_once(&once, ^{
    viewControllerBasedAppearence = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"] boolValue];
  });
  if (!viewControllerBasedAppearence) {
    ABI41_0_0RCTLogError(@"If you want to change the appearance of status bar, you have to change \
    UIViewControllerBasedStatusBarAppearance key in the Info.plist to YES");
  }
}
#endif

+ (void)updateStatusBarAppearance
{
#if !TARGET_OS_TV
  [UIView animateWithDuration:0.4 animations:^{ // duration based on "Programming iOS 13" p. 311 implementation
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
    if (@available(iOS 13, *)) {
      UIWindow *firstWindow = [[[UIApplication sharedApplication] windows] firstObject];
      if (firstWindow != nil) {
        [[firstWindow rootViewController] setNeedsStatusBarAppearanceUpdate];
      }
    } else
#endif
    {
      [UIApplication.sharedApplication.keyWindow.rootViewController setNeedsStatusBarAppearanceUpdate];
    }
  }];
#endif
}

#if !TARGET_OS_TV
+ (UIStatusBarStyle)statusBarStyleForRNSStatusBarStyle:(ABI41_0_0RNSStatusBarStyle)statusBarStyle
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    switch (statusBarStyle) {
      case ABI41_0_0RNSStatusBarStyleAuto:
          return [UITraitCollection.currentTraitCollection userInterfaceStyle] == UIUserInterfaceStyleDark ? UIStatusBarStyleLightContent : UIStatusBarStyleDarkContent;
      case ABI41_0_0RNSStatusBarStyleInverted:
          return [UITraitCollection.currentTraitCollection userInterfaceStyle] == UIUserInterfaceStyleDark ? UIStatusBarStyleDarkContent : UIStatusBarStyleLightContent;
      case ABI41_0_0RNSStatusBarStyleLight:
          return UIStatusBarStyleLightContent;
      case ABI41_0_0RNSStatusBarStyleDark:
          return UIStatusBarStyleDarkContent;
      default:
        return UIStatusBarStyleLightContent;
    }
  }
#endif
  // it is the only non-default style available for iOS < 13
  if (statusBarStyle == ABI41_0_0RNSStatusBarStyleLight) {
    return UIStatusBarStyleLightContent;
  }
  return UIStatusBarStyleDefault;
}
#endif

#if !TARGET_OS_TV
+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask
{
  if (UIInterfaceOrientationMaskPortrait & orientationMask) {
    return UIInterfaceOrientationPortrait;
  } else if (UIInterfaceOrientationMaskLandscapeLeft & orientationMask) {
    return UIInterfaceOrientationLandscapeLeft;
  } else if (UIInterfaceOrientationMaskLandscapeRight & orientationMask) {
    return UIInterfaceOrientationLandscapeRight;
  } else if (UIInterfaceOrientationMaskPortraitUpsideDown & orientationMask) {
    return UIInterfaceOrientationPortraitUpsideDown;
  }
  return UIInterfaceOrientationUnknown;
}

+ (UIInterfaceOrientation)interfaceOrientationFromDeviceOrientation:(UIDeviceOrientation)deviceOrientation
{
   switch (deviceOrientation) {
     case UIDeviceOrientationPortrait:
       return UIInterfaceOrientationPortrait;
     case UIDeviceOrientationPortraitUpsideDown:
       return UIInterfaceOrientationPortraitUpsideDown;
     // UIDevice and UIInterface landscape orientations are switched
     case UIDeviceOrientationLandscapeLeft:
       return UIInterfaceOrientationLandscapeRight;
     case UIDeviceOrientationLandscapeRight:
       return UIInterfaceOrientationLandscapeLeft;
     default:
       return UIInterfaceOrientationUnknown;
   }
}

+ (UIInterfaceOrientationMask)maskFromOrientation:(UIInterfaceOrientation)orientation
{
  return 1 << orientation;
}
#endif

+ (void)enforceDesiredDeviceOrientation
{
#if !TARGET_OS_TV
  dispatch_async(dispatch_get_main_queue(), ^{
    UIInterfaceOrientationMask orientationMask = UIInterfaceOrientationMaskAllButUpsideDown;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
    if (@available(iOS 13, *)) {
      UIWindow *firstWindow = [[[UIApplication sharedApplication] windows] firstObject];
      if (firstWindow != nil) {
        orientationMask = [firstWindow rootViewController].supportedInterfaceOrientations;
      }
    } else
#endif
    {
      orientationMask = UIApplication.sharedApplication.keyWindow.rootViewController.supportedInterfaceOrientations;
    }
    UIInterfaceOrientation currentDeviceOrientation = [ABI41_0_0RNSScreenStackHeaderConfig interfaceOrientationFromDeviceOrientation:[[UIDevice currentDevice] orientation]];
    UIInterfaceOrientation currentInterfaceOrientation = [ABI41_0_0RNSScreenStackHeaderConfig interfaceOrientation];
    UIInterfaceOrientation newOrientation = UIInterfaceOrientationUnknown;
    if ([ABI41_0_0RNSScreenStackHeaderConfig maskFromOrientation:currentDeviceOrientation] & orientationMask) {
      if (!([ABI41_0_0RNSScreenStackHeaderConfig maskFromOrientation:currentInterfaceOrientation] & orientationMask)) {
        // if the device orientation is in the mask, but interface orientation is not, we rotate to device's orientation
        newOrientation = currentDeviceOrientation;
      } else {
        if (currentDeviceOrientation != currentInterfaceOrientation) {
          // if both device orientation and interface orientation are in the mask, but in different orientations, we rotate to device's orientation
          newOrientation = currentDeviceOrientation;
        }
      }
    } else {
      if (!([ABI41_0_0RNSScreenStackHeaderConfig maskFromOrientation:currentInterfaceOrientation] & orientationMask)) {
        // if both device orientation and interface orientation are not in the mask, we rotate to closest available rotation from mask
        newOrientation = [ABI41_0_0RNSScreenStackHeaderConfig defaultOrientationForOrientationMask:orientationMask];
      } else {
        // if the device orientation is not in the mask, but interface orientation is in the mask, do nothing
      }
    }
    if (newOrientation != UIInterfaceOrientationUnknown) {
      [[UIDevice currentDevice] setValue:@(newOrientation) forKey:@"orientation"];
      [UIViewController attemptRotationToDeviceOrientation];
    }
  });
#endif
}

+ (void)updateWindowTraits
{
  [ABI41_0_0RNSScreenStackHeaderConfig updateStatusBarAppearance];
  [ABI41_0_0RNSScreenStackHeaderConfig enforceDesiredDeviceOrientation];
}

#if !TARGET_OS_TV
// based on https://stackoverflow.com/questions/57965701/statusbarorientation-was-deprecated-in-ios-13-0-when-attempting-to-get-app-ori/61249908#61249908
+ (UIInterfaceOrientation)interfaceOrientation
{
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    UIWindow *firstWindow = [[[UIApplication sharedApplication] windows] firstObject];
    if (firstWindow == nil) {
      return UIInterfaceOrientationUnknown;
    }
    UIWindowScene *windowScene = firstWindow.windowScene;
    if (windowScene == nil) {
      return UIInterfaceOrientationUnknown;
    }
    return windowScene.interfaceOrientation;
  } else
#endif
  {
    return UIApplication.sharedApplication.statusBarOrientation;
  }
}
#endif

@end

@implementation ABI41_0_0RNSScreenStackHeaderConfigManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI41_0_0RNSScreenStackHeaderConfig new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontFamily, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontSize, NSNumber)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontWeight, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(backTitle, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleFontFamily, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleFontSize, NSNumber)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(blurEffect, UIBlurEffectStyle)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(direction, UISemanticContentAttribute)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitle, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontFamily, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontSize, NSNumber)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontWeight, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleBackgroundColor, UIColor)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleHideShadow, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(hideBackButton, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(hideShadow, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonInCustomView, BOOL)
// `hidden` is an UIView property, we need to use different name internally
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(hidden, hide, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

#if !TARGET_OS_TV
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(screenOrientation, UIInterfaceOrientationMask)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarStyle, ABI41_0_0RNSStatusBarStyle)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarAnimation, UIStatusBarAnimation)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(statusBarHidden, BOOL)
#endif

@end

@implementation ABI41_0_0RCTConvert (ABI41_0_0RNSScreenStackHeader)

+ (NSMutableDictionary *)blurEffectsForIOSVersion
{
  NSMutableDictionary *blurEffects = [NSMutableDictionary new];
  [blurEffects addEntriesFromDictionary:@{
    @"extraLight": @(UIBlurEffectStyleExtraLight),
    @"light": @(UIBlurEffectStyleLight),
    @"dark": @(UIBlurEffectStyleDark),
  }];

  if (@available(iOS 10.0, *)) {
    [blurEffects addEntriesFromDictionary:@{
      @"regular": @(UIBlurEffectStyleRegular),
      @"prominent": @(UIBlurEffectStyleProminent),
    }];
  }
#if !TARGET_OS_TV && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    [blurEffects addEntriesFromDictionary:@{
      @"systemUltraThinMaterial": @(UIBlurEffectStyleSystemUltraThinMaterial),
      @"systemThinMaterial": @(UIBlurEffectStyleSystemThinMaterial),
      @"systemMaterial": @(UIBlurEffectStyleSystemMaterial),
      @"systemThickMaterial": @(UIBlurEffectStyleSystemThickMaterial),
      @"systemChromeMaterial": @(UIBlurEffectStyleSystemChromeMaterial),
      @"systemUltraThinMaterialLight": @(UIBlurEffectStyleSystemUltraThinMaterialLight),
      @"systemThinMaterialLight": @(UIBlurEffectStyleSystemThinMaterialLight),
      @"systemMaterialLight": @(UIBlurEffectStyleSystemMaterialLight),
      @"systemThickMaterialLight": @(UIBlurEffectStyleSystemThickMaterialLight),
      @"systemChromeMaterialLight": @(UIBlurEffectStyleSystemChromeMaterialLight),
      @"systemUltraThinMaterialDark": @(UIBlurEffectStyleSystemUltraThinMaterialDark),
      @"systemThinMaterialDark": @(UIBlurEffectStyleSystemThinMaterialDark),
      @"systemMaterialDark": @(UIBlurEffectStyleSystemMaterialDark),
      @"systemThickMaterialDark": @(UIBlurEffectStyleSystemThickMaterialDark),
      @"systemChromeMaterialDark": @(UIBlurEffectStyleSystemChromeMaterialDark),
    }];
  }
#endif
  return blurEffects;
}

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0RNSScreenStackHeaderSubviewType, (@{
  @"back": @(ABI41_0_0RNSScreenStackHeaderSubviewTypeBackButton),
  @"left": @(ABI41_0_0RNSScreenStackHeaderSubviewTypeLeft),
  @"right": @(ABI41_0_0RNSScreenStackHeaderSubviewTypeRight),
  @"title": @(ABI41_0_0RNSScreenStackHeaderSubviewTypeTitle),
  @"center": @(ABI41_0_0RNSScreenStackHeaderSubviewTypeCenter),
  }), ABI41_0_0RNSScreenStackHeaderSubviewTypeTitle, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(UISemanticContentAttribute, (@{
  @"ltr": @(UISemanticContentAttributeForceLeftToRight),
  @"rtl": @(UISemanticContentAttributeForceRightToLeft),
  }), UISemanticContentAttributeUnspecified, integerValue)

ABI41_0_0RCT_ENUM_CONVERTER(UIBlurEffectStyle, ([self blurEffectsForIOSVersion]), UIBlurEffectStyleExtraLight, integerValue)

#if !TARGET_OS_TV
ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0RNSStatusBarStyle, (@{
  @"auto": @(ABI41_0_0RNSStatusBarStyleAuto),
  @"inverted": @(ABI41_0_0RNSStatusBarStyleInverted),
  @"light": @(ABI41_0_0RNSStatusBarStyleLight),
  @"dark": @(ABI41_0_0RNSStatusBarStyleDark),
  }), ABI41_0_0RNSStatusBarStyleAuto, integerValue)

+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json
{
  json = [self NSString:json];
  if ([json isEqualToString:@"default"]) {
    return UIInterfaceOrientationMaskAllButUpsideDown;
  } else if ([json isEqualToString:@"all"]) {
    return UIInterfaceOrientationMaskAll;
  } else if ([json isEqualToString:@"portrait"]) {
    return UIInterfaceOrientationMaskPortrait | UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if ([json isEqualToString:@"portrait_up"]) {
    return UIInterfaceOrientationMaskPortrait;
  } else if ([json isEqualToString:@"portrait_down"]) {
    return UIInterfaceOrientationMaskPortraitUpsideDown;
  } else if ([json isEqualToString:@"landscape"]) {
    return UIInterfaceOrientationMaskLandscape;
  } else if ([json isEqualToString:@"landscape_left"]) {
    return UIInterfaceOrientationMaskLandscapeLeft;
  } else if ([json isEqualToString:@"landscape_right"]) {
    return UIInterfaceOrientationMaskLandscapeRight;
  }
  return UIInterfaceOrientationMaskAllButUpsideDown;
}
#endif

@end

@implementation ABI41_0_0RNSScreenStackHeaderSubviewManager

ABI41_0_0RCT_EXPORT_MODULE()

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(type, ABI41_0_0RNSScreenStackHeaderSubviewType)

- (UIView *)view
{
  return [[ABI41_0_0RNSScreenStackHeaderSubview alloc] initWithBridge:self.bridge];
}

@end
