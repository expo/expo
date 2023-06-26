#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTConversions.h>
#import <ABI49_0_0React/ABI49_0_0RCTFabricComponentsPlugins.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageComponentView.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>
#import <react/renderer/components/image/ImageProps.h>
#import <react/renderer/components/rnscreens/ComponentDescriptors.h>
#import <react/renderer/components/rnscreens/EventEmitters.h>
#import <react/renderer/components/rnscreens/Props.h>
#import <react/renderer/components/rnscreens/ABI49_0_0RCTComponentViewHelpers.h>
#import "ABI49_0_0RCTImageComponentView+ABI49_0_0RNSScreenStackHeaderConfig.h"
#else
#import <ABI49_0_0React/ABI49_0_0RCTImageView.h>
#import <ABI49_0_0React/ABI49_0_0RCTShadowView.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTUIManagerUtils.h>
#endif
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTFont.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageLoader.h>
#import <ABI49_0_0React/ABI49_0_0RCTImageSource.h>
#import "ABI49_0_0RNSScreen.h"
#import "ABI49_0_0RNSScreenStackHeaderConfig.h"
#import "ABI49_0_0RNSSearchBar.h"
#import "ABI49_0_0RNSUIBarButtonItem.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
namespace rct = ABI49_0_0facebook::ABI49_0_0React;
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

#ifndef ABI49_0_0RCT_NEW_ARCH_ENABLED
// Some RN private method hacking below. Couldn't figure out better way to access image data
// of a given ABI49_0_0RCTImageView. See more comments in the code section processing SubviewTypeBackButton
@interface ABI49_0_0RCTImageView (Private)
- (UIImage *)image;
@end
#endif // !ABI49_0_0RCT_NEW_ARCH_ENABLED

@interface ABI49_0_0RCTImageLoader (Private)
- (id<ABI49_0_0RCTImageCache>)imageCache;
@end

@implementation NSString (ABI49_0_0RNSStringUtil)

+ (BOOL)ABI49_0_0RNSisBlank:(NSString *)string
{
  if (string == nil) {
    return YES;
  }
  return [[string stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]] length] == 0;
}

@end

@implementation ABI49_0_0RNSScreenStackHeaderConfig {
  NSMutableArray<ABI49_0_0RNSScreenStackHeaderSubview *> *_ABI49_0_0ReactSubviews;
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  BOOL _initialPropsSet;
#else
#endif
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const rct::ABI49_0_0RNSScreenStackHeaderConfigProps>();
    _props = defaultProps;
    _show = YES;
    _translucent = NO;
    [self initProps];
  }
  return self;
}
#else
- (instancetype)init
{
  if (self = [super init]) {
    _translucent = YES;
    [self initProps];
  }
  return self;
}
#endif

- (void)initProps
{
  self.hidden = YES;
  _ABI49_0_0ReactSubviews = [NSMutableArray new];
  _backTitleVisible = YES;
}

- (UIView *)ABI49_0_0ReactSuperview
{
  return _screenView;
}

- (NSArray<UIView *> *)ABI49_0_0ReactSubviews
{
  return _ABI49_0_0ReactSubviews;
}

- (void)removeFromSuperview
{
  [super removeFromSuperview];
  _screenView = nil;
}

// this method is never invoked by the system since this view
// is not added to native view hierarchy so we can apply our logic
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  for (ABI49_0_0RNSScreenStackHeaderSubview *subview in _ABI49_0_0ReactSubviews) {
    if (subview.type == ABI49_0_0RNSScreenStackHeaderSubviewTypeLeft || subview.type == ABI49_0_0RNSScreenStackHeaderSubviewTypeRight) {
      // we wrap the headerLeft/Right component in a UIBarButtonItem
      // so we need to use the only subview of it to retrieve the correct view
      UIView *headerComponent = subview.subviews.firstObject;
      // we convert the point to ABI49_0_0RNSScreenStackView since it always contains the header inside it
      CGPoint convertedPoint = [_screenView.ABI49_0_0ReactSuperview convertPoint:point toView:headerComponent];

      UIView *hitTestResult = [headerComponent hitTest:convertedPoint withEvent:event];
      if (hitTestResult != nil) {
        return hitTestResult;
      }
    }
  }
  return nil;
}

- (void)updateViewControllerIfNeeded
{
  UIViewController *vc = _screenView.controller;
  UINavigationController *nav = (UINavigationController *)vc.parentViewController;
  UIViewController *nextVC = nav.visibleViewController;
  if (nav.transitionCoordinator != nil) {
    // if navigator is performing transition instead of allowing to update of `visibleConttroller`
    // we look at `topController`. This is because during transitiong the `visibleController` won't
    // point to the controller that is going to be revealed after transition. This check fixes the
    // problem when config gets updated while the transition is ongoing.
    nextVC = nav.topViewController;
  }

  // we want updates sent to the VC below modal too since it is also visible
  BOOL isPresentingVC = nextVC != nil && vc.presentedViewController == nextVC;

  BOOL isInFullScreenModal = nav == nil && _screenView.stackPresentation == ABI49_0_0RNSScreenStackPresentationFullScreenModal;
  // if nav is nil, it means we can be in a fullScreen modal, so there is no nextVC, but we still want to update
  if (vc != nil && (nextVC == vc || isInFullScreenModal || isPresentingVC)) {
    [ABI49_0_0RNSScreenStackHeaderConfig updateViewController:self.screenView.controller withConfig:self animated:YES];
  }
}

- (void)layoutNavigationControllerView
{
  // We need to layout navigation controller view after translucent prop changes, because otherwise
  // frame of ABI49_0_0RNSScreen will not be changed and screen content will remain the same size.
  // For more details look at https://github.com/software-mansion/react-native-screens/issues/1158
  UIViewController *vc = _screenView.controller;
  UINavigationController *navctr = vc.navigationController;
  [navctr.view setNeedsLayout];
}

+ (void)setAnimatedConfig:(UIViewController *)vc withConfig:(ABI49_0_0RNSScreenStackHeaderConfig *)config
{
  UINavigationBar *navbar = ((UINavigationController *)vc.parentViewController).navigationBar;
  // It is workaround for loading custom back icon when transitioning from a screen without header to the screen which
  // has one. This action fails when navigating to the screen with header for the second time and loads default back
  // button. It looks like changing the tint color of navbar triggers an update of the items belonging to it and it
  // seems to load the custom back image so we change the tint color's alpha by a very small amount and then set it to
  // the one it should have.
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_14_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0
  // it brakes the behavior of `headerRight` in iOS 14, where the bug desribed above seems to be fixed, so we do nothing
  // in iOS 14
  if (@available(iOS 14.0, *)) {
  } else
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
        attrs[NSFontAttributeName] = [ABI49_0_0RCTFont updateFont:nil
                                              withFamily:family
                                                    size:size
                                                  weight:weight
                                                   style:nil
                                                 variant:nil
                                         scaleMultiplier:1.0];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:[size floatValue]];
      }
      [navbar setTitleTextAttributes:attrs];
    }

#if !TARGET_OS_TV
    if (@available(iOS 11.0, *)) {
      if (config.largeTitle &&
          (config.largeTitleFontFamily || config.largeTitleFontSize || config.largeTitleFontWeight ||
           config.largeTitleColor || config.titleColor)) {
        NSMutableDictionary *largeAttrs = [NSMutableDictionary new];
        if (config.largeTitleColor || config.titleColor) {
          largeAttrs[NSForegroundColorAttributeName] =
              config.largeTitleColor ? config.largeTitleColor : config.titleColor;
        }
        NSString *largeFamily = config.largeTitleFontFamily ?: nil;
        NSNumber *largeSize = config.largeTitleFontSize ?: @34;
        NSString *largeWeight = config.largeTitleFontWeight ?: nil;
        if (largeFamily || largeWeight) {
          largeAttrs[NSFontAttributeName] = [ABI49_0_0RCTFont updateFont:nil
                                                     withFamily:largeFamily
                                                           size:largeSize
                                                         weight:largeWeight
                                                          style:nil
                                                        variant:nil
                                                scaleMultiplier:1.0];
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

+ (UIImage *)loadBackButtonImageInViewController:(UIViewController *)vc withConfig:(ABI49_0_0RNSScreenStackHeaderConfig *)config
{
  BOOL hasBackButtonImage = NO;
  for (ABI49_0_0RNSScreenStackHeaderSubview *subview in config.ABI49_0_0ReactSubviews) {
    if (subview.type == ABI49_0_0RNSScreenStackHeaderSubviewTypeBackButton && subview.subviews.count > 0) {
      hasBackButtonImage = YES;
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
      ABI49_0_0RCTImageComponentView *imageView = subview.subviews[0];
#else
      ABI49_0_0RCTImageView *imageView = subview.subviews[0];
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
      if (imageView.image == nil) {
        // This is yet another workaround for loading custom back icon. It turns out that under
        // certain circumstances image attribute can be null despite the app running in production
        // mode (when images are loaded from the filesystem). This can happen because image attribute
        // is reset when image view is detached from window, and also in some cases initialization
        // does not populate the frame of the image view before the loading start. The latter result
        // in the image attribute not being updated. We manually set frame to the size of an image
        // in order to trigger proper reload that'd update the image attribute.
        ABI49_0_0RCTImageSource *imageSource = [ABI49_0_0RNSScreenStackHeaderConfig imageSourceFromImageView:imageView];
        [imageView ABI49_0_0ReactSetFrame:CGRectMake(
                                     imageView.frame.origin.x,
                                     imageView.frame.origin.y,
                                     imageSource.size.width,
                                     imageSource.size.height)];
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
        ABI49_0_0RCTImageSource *imageSource = [ABI49_0_0RNSScreenStackHeaderConfig imageSourceFromImageView:imageView];
        ABI49_0_0RCTImageLoader *imageLoader = [subview.bridge moduleForClass:[ABI49_0_0RCTImageLoader class]];

        image = [imageLoader.imageCache
            imageForUrl:imageSource.request.URL.absoluteString
                   size:imageSource.size
                  scale:imageSource.scale
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
             resizeMode:resizeModeFromCppEquiv(
                            std::static_pointer_cast<const rct::ImageProps>(imageView.props)->resizeMode)];
#else
             resizeMode:imageView.resizeMode];
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED
      }
      if (image == nil) {
        // This will be triggered if the image is not in the cache yet. What we do is we wait until
        // the end of transition and run header config updates again. We could potentially wait for
        // image on load to trigger, but that would require even more private method hacking.
        if (vc.transitionCoordinator) {
          [vc.transitionCoordinator
              animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
                // nothing, we just want completion
              }
              completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
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

+ (void)willShowViewController:(UIViewController *)vc
                      animated:(BOOL)animated
                    withConfig:(ABI49_0_0RNSScreenStackHeaderConfig *)config
{
  [self updateViewController:vc withConfig:config animated:animated];
}

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
+ (UINavigationBarAppearance *)buildAppearance:(UIViewController *)vc
                                    withConfig:(ABI49_0_0RNSScreenStackHeaderConfig *)config API_AVAILABLE(ios(13.0))
{
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

  // TODO: implement blurEffect on Fabric
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#else
  if (config.blurEffect) {
    appearance.backgroundEffect = [UIBlurEffect effectWithStyle:config.blurEffect];
  }
#endif

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
      attrs[NSFontAttributeName] = [ABI49_0_0RCTFont updateFont:nil
                                            withFamily:config.titleFontFamily
                                                  size:size
                                                weight:weight
                                                 style:nil
                                               variant:nil
                                       scaleMultiplier:1.0];
    } else {
      attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:[size floatValue]];
    }
    appearance.titleTextAttributes = attrs;
  }

  if (config.largeTitleFontFamily || config.largeTitleFontSize || config.largeTitleFontWeight ||
      config.largeTitleColor || config.titleColor) {
    NSMutableDictionary *largeAttrs = [NSMutableDictionary new];

    if (config.largeTitleColor || config.titleColor) {
      largeAttrs[NSForegroundColorAttributeName] = config.largeTitleColor ? config.largeTitleColor : config.titleColor;
    }

    NSString *largeFamily = config.largeTitleFontFamily ?: nil;
    NSNumber *largeSize = config.largeTitleFontSize ?: @34;
    NSString *largeWeight = config.largeTitleFontWeight ?: nil;
    if (largeFamily || largeWeight) {
      largeAttrs[NSFontAttributeName] = [ABI49_0_0RCTFont updateFont:nil
                                                 withFamily:largeFamily
                                                       size:largeSize
                                                     weight:largeWeight
                                                      style:nil
                                                    variant:nil
                                            scaleMultiplier:1.0];
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
#endif // Check for >= iOS 13.0

+ (void)updateViewController:(UIViewController *)vc
                  withConfig:(ABI49_0_0RNSScreenStackHeaderConfig *)config
                    animated:(BOOL)animated
{
  UINavigationItem *navitem = vc.navigationItem;
  UINavigationController *navctr = (UINavigationController *)vc.parentViewController;

  NSUInteger currentIndex = [navctr.viewControllers indexOfObject:vc];
  UINavigationItem *prevItem =
      currentIndex > 0 ? [navctr.viewControllers objectAtIndex:currentIndex - 1].navigationItem : nil;

  BOOL wasHidden = navctr.navigationBarHidden;
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  BOOL shouldHide = config == nil || !config.show;
#else
  BOOL shouldHide = config == nil || config.hide;
#endif

  if (!shouldHide && !config.translucent) {
    // when nav bar is not translucent we chage edgesForExtendedLayout to avoid system laying out
    // the screen underneath navigation controllers
    vc.edgesForExtendedLayout = UIRectEdgeNone;
  } else {
    // system default is UIRectEdgeAll
    vc.edgesForExtendedLayout = UIRectEdgeAll;
  }

  [navctr setNavigationBarHidden:shouldHide animated:animated];

  if ((config.direction == UISemanticContentAttributeForceLeftToRight ||
       config.direction == UISemanticContentAttributeForceRightToLeft) &&
      // iOS 12 cancels swipe gesture when direction is changed. See #1091
      navctr.view.semanticContentAttribute != config.direction) {
    navctr.view.semanticContentAttribute = config.direction;
    navctr.navigationBar.semanticContentAttribute = config.direction;
  }

  if (shouldHide) {
    return;
  }

#if !TARGET_OS_TV
  const auto isBackTitleBlank = [NSString ABI49_0_0RNSisBlank:config.backTitle] == YES;
  NSString *resolvedBackTitle = isBackTitleBlank ? prevItem.title : config.backTitle;
  ABI49_0_0RNSUIBarButtonItem *backBarButtonItem = [[ABI49_0_0RNSUIBarButtonItem alloc] initWithTitle:resolvedBackTitle
                                                                              style:UIBarButtonItemStylePlain
                                                                             target:nil
                                                                             action:nil];
  [backBarButtonItem setMenuHidden:config.disableBackButtonMenu];

  if (config.isBackTitleVisible) {
    if (config.backTitleFontFamily || config.backTitleFontSize) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];
      NSNumber *size = config.backTitleFontSize ?: @17;
      if (config.backTitleFontFamily) {
        attrs[NSFontAttributeName] = [ABI49_0_0RCTFont updateFont:nil
                                              withFamily:config.backTitleFontFamily
                                                    size:size
                                                  weight:nil
                                                   style:nil
                                                 variant:nil
                                         scaleMultiplier:1.0];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:[size floatValue]];
      }
      [self setTitleAttibutes:attrs forButton:backBarButtonItem];
    }
  } else {
    // back button title should be not visible next to back button,
    // but it should still appear in back menu (if one is enabled)

    // When backBarButtonItem's title is null, back menu will use value
    // of backButtonTitle
    [backBarButtonItem setTitle:nil];
    prevItem.backButtonTitle = resolvedBackTitle;
  }
  prevItem.backBarButtonItem = backBarButtonItem;

  if (@available(iOS 11.0, *)) {
    if (config.largeTitle) {
      navctr.navigationBar.prefersLargeTitles = YES;
    }
    navitem.largeTitleDisplayMode =
        config.largeTitle ? UINavigationItemLargeTitleDisplayModeAlways : UINavigationItemLargeTitleDisplayModeNever;
  }
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, tvOS 13.0, *)) {
    UINavigationBarAppearance *appearance = [self buildAppearance:vc withConfig:config];
    navitem.standardAppearance = appearance;
    navitem.compactAppearance = appearance;

    UINavigationBarAppearance *scrollEdgeAppearance =
        [[UINavigationBarAppearance alloc] initWithBarAppearance:appearance];
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

  for (ABI49_0_0RNSScreenStackHeaderSubview *subview in config.ABI49_0_0ReactSubviews) {
    switch (subview.type) {
      case ABI49_0_0RNSScreenStackHeaderSubviewTypeLeft: {
#if !TARGET_OS_TV
        navitem.leftItemsSupplementBackButton = config.backButtonInCustomView;
#endif
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.leftBarButtonItem = buttonItem;
        break;
      }
      case ABI49_0_0RNSScreenStackHeaderSubviewTypeRight: {
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.rightBarButtonItem = buttonItem;
        break;
      }
      case ABI49_0_0RNSScreenStackHeaderSubviewTypeCenter:
      case ABI49_0_0RNSScreenStackHeaderSubviewTypeTitle: {
        navitem.titleView = subview;
        break;
      }
      case ABI49_0_0RNSScreenStackHeaderSubviewTypeSearchBar: {
        if (subview.subviews == nil || [subview.subviews count] == 0) {
          ABI49_0_0RCTLogWarn(
              @"Failed to attach search bar to the header. We recommend using `useLayoutEffect` when managing "
               "searchBar properties dynamically. \n\nSee: github.com/software-mansion/react-native-screens/issues/1188");
          break;
        }

        if ([subview.subviews[0] isKindOfClass:[ABI49_0_0RNSSearchBar class]]) {
#if !TARGET_OS_TV
          if (@available(iOS 11.0, *)) {
            ABI49_0_0RNSSearchBar *searchBar = subview.subviews[0];
            navitem.searchController = searchBar.controller;
            navitem.hidesSearchBarWhenScrolling = searchBar.hideWhenScrolling;
          }
#endif
        }
        break;
      }
      case ABI49_0_0RNSScreenStackHeaderSubviewTypeBackButton: {
        break;
      }
    }
  }

  // This assignment should be done after `navitem.titleView = ...` assignment (iOS 16.0 bug).
  // See: https://github.com/software-mansion/react-native-screens/issues/1570 (comments)
  navitem.title = config.title;

  if (animated && vc.transitionCoordinator != nil &&
      vc.transitionCoordinator.presentationStyle == UIModalPresentationNone && !wasHidden) {
    // when there is an ongoing transition we may need to update navbar setting in animation block
    // using animateAlongsideTransition. However, we only do that given the transition is not a modal
    // transition (presentationStyle == UIModalPresentationNone) and that the bar was not previously
    // hidden. This is because both for modal transitions and transitions from screen with hidden bar
    // the transition animation block does not get triggered. This is ok, because with both of those
    // types of transitions there is no "shared" navigation bar that needs to be updated in an animated
    // way.
    [vc.transitionCoordinator
        animateAlongsideTransition:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
          [self setAnimatedConfig:vc withConfig:config];
        }
        completion:^(id<UIViewControllerTransitionCoordinatorContext> _Nonnull context) {
          if ([context isCancelled]) {
            UIViewController *fromVC = [context viewControllerForKey:UITransitionContextFromViewControllerKey];
            ABI49_0_0RNSScreenStackHeaderConfig *config = nil;
            for (UIView *subview in fromVC.view.ABI49_0_0ReactSubviews) {
              if ([subview isKindOfClass:[ABI49_0_0RNSScreenStackHeaderConfig class]]) {
                config = (ABI49_0_0RNSScreenStackHeaderConfig *)subview;
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

- (void)insertABI49_0_0ReactSubview:(ABI49_0_0RNSScreenStackHeaderSubview *)subview atIndex:(NSInteger)atIndex
{
  [_ABI49_0_0ReactSubviews insertObject:subview atIndex:atIndex];
  subview.ABI49_0_0ReactSuperview = self;
}

- (void)removeABI49_0_0ReactSubview:(ABI49_0_0RNSScreenStackHeaderSubview *)subview
{
  [_ABI49_0_0ReactSubviews removeObject:subview];
}

- (void)didUpdateABI49_0_0ReactSubviews
{
  [super didUpdateABI49_0_0ReactSubviews];
  [self updateViewControllerIfNeeded];
}

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#pragma mark - Fabric specific

- (void)mountChildComponentView:(UIView<ABI49_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  if (![childComponentView isKindOfClass:[ABI49_0_0RNSScreenStackHeaderSubview class]]) {
    ABI49_0_0RCTLogError(@"ScreenStackHeader only accepts children of type ScreenStackHeaderSubview");
    return;
  }

  ABI49_0_0RCTAssert(
      childComponentView.superview == nil,
      @"Attempt to mount already mounted component view. (parent: %@, child: %@, index: %@, existing parent: %@)",
      self,
      childComponentView,
      @(index),
      @([childComponentView.superview tag]));

  //  [_ABI49_0_0ReactSubviews insertObject:(ABI49_0_0RNSScreenStackHeaderSubview *)childComponentView atIndex:index];
  [self insertABI49_0_0ReactSubview:(ABI49_0_0RNSScreenStackHeaderSubview *)childComponentView atIndex:index];
  [self updateViewControllerIfNeeded];
}

- (void)unmountChildComponentView:(UIView<ABI49_0_0RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_ABI49_0_0ReactSubviews removeObject:(ABI49_0_0RNSScreenStackHeaderSubview *)childComponentView];
  [childComponentView removeFromSuperview];
}

static ABI49_0_0RCTResizeMode resizeModeFromCppEquiv(rct::ImageResizeMode resizeMode)
{
  switch (resizeMode) {
    case rct::ImageResizeMode::Cover:
      return ABI49_0_0RCTResizeModeCover;
    case rct::ImageResizeMode::Contain:
      return ABI49_0_0RCTResizeModeContain;
    case rct::ImageResizeMode::Stretch:
      return ABI49_0_0RCTResizeModeStretch;
    case rct::ImageResizeMode::Center:
      return ABI49_0_0RCTResizeModeCenter;
    case rct::ImageResizeMode::Repeat:
      return ABI49_0_0RCTResizeModeRepeat;
  }
}

/**
 * Fabric implementation of helper method for +loadBackButtonImageInViewController:withConfig:
 * There is corresponding Paper implementation (with different parameter type) in Paper specific section.
 */
+ (ABI49_0_0RCTImageSource *)imageSourceFromImageView:(ABI49_0_0RCTImageComponentView *)view
{
  auto const imageProps = *std::static_pointer_cast<const rct::ImageProps>(view.props);
  rct::ImageSource cppImageSource = imageProps.sources.at(0);
  auto imageSize = CGSize{cppImageSource.size.width, cppImageSource.size.height};
  NSURLRequest *request =
      [NSURLRequest requestWithURL:[NSURL URLWithString:ABI49_0_0RCTNSStringFromStringNilIfEmpty(cppImageSource.uri)]];
  ABI49_0_0RCTImageSource *imageSource = [[ABI49_0_0RCTImageSource alloc] initWithURLRequest:request
                                                                      size:imageSize
                                                                     scale:cppImageSource.scale];
  return imageSource;
}

#pragma mark - ABI49_0_0RCTComponentViewProtocol

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _initialPropsSet = NO;
}

+ (rct::ComponentDescriptorProvider)componentDescriptorProvider
{
  return rct::concreteComponentDescriptorProvider<rct::ABI49_0_0RNSScreenStackHeaderConfigComponentDescriptor>();
}

- (NSNumber *)getFontSizePropValue:(int)value
{
  if (value > 0)
    return [NSNumber numberWithInt:value];
  return nil;
}

- (UISemanticContentAttribute)getDirectionPropValue:(rct::ABI49_0_0RNSScreenStackHeaderConfigDirection)direction
{
  switch (direction) {
    case rct::ABI49_0_0RNSScreenStackHeaderConfigDirection::Rtl:
      return UISemanticContentAttributeForceRightToLeft;
    case rct::ABI49_0_0RNSScreenStackHeaderConfigDirection::Ltr:
      return UISemanticContentAttributeForceLeftToRight;
  }
}

- (void)updateProps:(rct::Props::Shared const &)props oldProps:(rct::Props::Shared const &)oldProps
{
  const auto &oldScreenProps = *std::static_pointer_cast<const rct::ABI49_0_0RNSScreenStackHeaderConfigProps>(_props);
  const auto &newScreenProps = *std::static_pointer_cast<const rct::ABI49_0_0RNSScreenStackHeaderConfigProps>(props);

  BOOL needsNavigationControllerLayout = !_initialPropsSet;

  if (newScreenProps.hidden != !_show) {
    _show = !newScreenProps.hidden;
    needsNavigationControllerLayout = YES;
  }

  if (newScreenProps.translucent != _translucent) {
    _translucent = newScreenProps.translucent;
    needsNavigationControllerLayout = YES;
  }

  if (newScreenProps.backButtonInCustomView != _backButtonInCustomView) {
    [self setBackButtonInCustomView:newScreenProps.backButtonInCustomView];
  }

  _title = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.title);
  if (newScreenProps.titleFontFamily != oldScreenProps.titleFontFamily) {
    _titleFontFamily = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.titleFontFamily);
  }
  _titleFontWeight = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.titleFontWeight);
  _titleFontSize = [self getFontSizePropValue:newScreenProps.titleFontSize];
  _hideShadow = newScreenProps.hideShadow;

  _largeTitle = newScreenProps.largeTitle;
  if (newScreenProps.largeTitleFontFamily != oldScreenProps.largeTitleFontFamily) {
    _largeTitleFontFamily = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.largeTitleFontFamily);
  }
  _largeTitleFontWeight = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.largeTitleFontWeight);
  _largeTitleFontSize = [self getFontSizePropValue:newScreenProps.largeTitleFontSize];
  _largeTitleHideShadow = newScreenProps.largeTitleHideShadow;

  _backTitle = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.backTitle);
  if (newScreenProps.backTitleFontFamily != oldScreenProps.backTitleFontFamily) {
    _backTitleFontFamily = ABI49_0_0RCTNSStringFromStringNilIfEmpty(newScreenProps.backTitleFontFamily);
  }
  _backTitleFontSize = [self getFontSizePropValue:newScreenProps.backTitleFontSize];
  _hideBackButton = newScreenProps.hideBackButton;
  _disableBackButtonMenu = newScreenProps.disableBackButtonMenu;

  if (newScreenProps.direction != oldScreenProps.direction) {
    _direction = [self getDirectionPropValue:newScreenProps.direction];
  }

  _backTitleVisible = newScreenProps.backTitleVisible;

  // We cannot compare SharedColor because it is shared value.
  // We could compare color value, but it is more performant to just assign new value
  _titleColor = ABI49_0_0RCTUIColorFromSharedColor(newScreenProps.titleColor);
  _largeTitleColor = ABI49_0_0RCTUIColorFromSharedColor(newScreenProps.largeTitleColor);
  _color = ABI49_0_0RCTUIColorFromSharedColor(newScreenProps.color);
  _backgroundColor = ABI49_0_0RCTUIColorFromSharedColor(newScreenProps.backgroundColor);

  [self updateViewControllerIfNeeded];

  if (needsNavigationControllerLayout) {
    [self layoutNavigationControllerView];
  }

  _initialPropsSet = YES;
  _props = std::static_pointer_cast<rct::ABI49_0_0RNSScreenStackHeaderConfigProps const>(props);

  [super updateProps:props oldProps:oldProps];
}

#else
#pragma mark - Paper specific

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self updateViewControllerIfNeeded];
  // We need to layout navigation controller view after translucent prop changes, because otherwise
  // frame of ABI49_0_0RNSScreen will not be changed and screen content will remain the same size.
  // For more details look at https://github.com/software-mansion/react-native-screens/issues/1158
  if ([changedProps containsObject:@"translucent"]) {
    [self layoutNavigationControllerView];
  }
}

/**
 * Paper implementation of helper method for +loadBackButtonImageInViewController:withConfig:
 * There is corresponding Fabric implementation (with different parameter type) in Fabric specific section.
 */
+ (ABI49_0_0RCTImageSource *)imageSourceFromImageView:(ABI49_0_0RCTImageView *)view
{
  return view.imageSources[0];
}

#endif
@end

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
Class<ABI49_0_0RCTComponentViewProtocol> ABI49_0_0RNSScreenStackHeaderConfigCls(void)
{
  return ABI49_0_0RNSScreenStackHeaderConfig.class;
}
#endif

@implementation ABI49_0_0RNSScreenStackHeaderConfigManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI49_0_0RNSScreenStackHeaderConfig new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontFamily, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontSize, NSNumber)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontWeight, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(backTitle, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleFontFamily, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleFontSize, NSNumber)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleVisible, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(blurEffect, UIBlurEffectStyle)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(direction, UISemanticContentAttribute)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitle, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontFamily, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontSize, NSNumber)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontWeight, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleBackgroundColor, UIColor)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleHideShadow, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(hideBackButton, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(hideShadow, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(backButtonInCustomView, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(disableBackButtonMenu, BOOL)
// `hidden` is an UIView property, we need to use different name internally
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(hidden, hide, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

@end

@implementation ABI49_0_0RCTConvert (ABI49_0_0RNSScreenStackHeader)

+ (NSMutableDictionary *)blurEffectsForIOSVersion
{
  NSMutableDictionary *blurEffects = [NSMutableDictionary new];
  [blurEffects addEntriesFromDictionary:@{
    @"extraLight" : @(UIBlurEffectStyleExtraLight),
    @"light" : @(UIBlurEffectStyleLight),
    @"dark" : @(UIBlurEffectStyleDark),
  }];

  if (@available(iOS 10.0, *)) {
    [blurEffects addEntriesFromDictionary:@{
      @"regular" : @(UIBlurEffectStyleRegular),
      @"prominent" : @(UIBlurEffectStyleProminent),
    }];
  }
#if !TARGET_OS_TV && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    [blurEffects addEntriesFromDictionary:@{
      @"systemUltraThinMaterial" : @(UIBlurEffectStyleSystemUltraThinMaterial),
      @"systemThinMaterial" : @(UIBlurEffectStyleSystemThinMaterial),
      @"systemMaterial" : @(UIBlurEffectStyleSystemMaterial),
      @"systemThickMaterial" : @(UIBlurEffectStyleSystemThickMaterial),
      @"systemChromeMaterial" : @(UIBlurEffectStyleSystemChromeMaterial),
      @"systemUltraThinMaterialLight" : @(UIBlurEffectStyleSystemUltraThinMaterialLight),
      @"systemThinMaterialLight" : @(UIBlurEffectStyleSystemThinMaterialLight),
      @"systemMaterialLight" : @(UIBlurEffectStyleSystemMaterialLight),
      @"systemThickMaterialLight" : @(UIBlurEffectStyleSystemThickMaterialLight),
      @"systemChromeMaterialLight" : @(UIBlurEffectStyleSystemChromeMaterialLight),
      @"systemUltraThinMaterialDark" : @(UIBlurEffectStyleSystemUltraThinMaterialDark),
      @"systemThinMaterialDark" : @(UIBlurEffectStyleSystemThinMaterialDark),
      @"systemMaterialDark" : @(UIBlurEffectStyleSystemMaterialDark),
      @"systemThickMaterialDark" : @(UIBlurEffectStyleSystemThickMaterialDark),
      @"systemChromeMaterialDark" : @(UIBlurEffectStyleSystemChromeMaterialDark),
    }];
  }
#endif
  return blurEffects;
}

ABI49_0_0RCT_ENUM_CONVERTER(
    UISemanticContentAttribute,
    (@{
      @"ltr" : @(UISemanticContentAttributeForceLeftToRight),
      @"rtl" : @(UISemanticContentAttributeForceRightToLeft),
    }),
    UISemanticContentAttributeUnspecified,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(UIBlurEffectStyle, ([self blurEffectsForIOSVersion]), UIBlurEffectStyleExtraLight, integerValue)

@end
