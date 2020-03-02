#import "ABI37_0_0RNSScreenStackHeaderConfig.h"
#import "ABI37_0_0RNSScreen.h"

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTUIManagerUtils.h>
#import <ABI37_0_0React/ABI37_0_0RCTShadowView.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageLoader.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageView.h>
#import <ABI37_0_0React/ABI37_0_0RCTImageSource.h>

// Some ABI37_0_0RN private method hacking below. Couldn't figure out better way to access image data
// of a given ABI37_0_0RCTImageView. See more comments in the code section processing SubviewTypeBackButton
@interface ABI37_0_0RCTImageView (Private)
- (UIImage*)image;
@end

@interface ABI37_0_0RCTImageLoader (Private)
- (id<ABI37_0_0RCTImageCache>)imageCache;
@end


@interface ABI37_0_0RNSScreenStackHeaderSubview : UIView

@property (nonatomic, weak) ABI37_0_0RCTBridge *bridge;
@property (nonatomic, weak) UIView *ABI37_0_0ReactSuperview;
@property (nonatomic) ABI37_0_0RNSScreenStackHeaderSubviewType type;

- (instancetype)initWithBridge:(ABI37_0_0RCTBridge*)bridge;

@end

@implementation ABI37_0_0RNSScreenStackHeaderSubview

- (instancetype)initWithBridge:(ABI37_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

@end

@implementation ABI37_0_0RNSScreenStackHeaderConfig {
  NSMutableArray<ABI37_0_0RNSScreenStackHeaderSubview *> *_ABI37_0_0ReactSubviews;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.hidden = YES;
    _translucent = YES;
    _ABI37_0_0ReactSubviews = [NSMutableArray new];
  }
  return self;
}

- (void)insertABI37_0_0ReactSubview:(ABI37_0_0RNSScreenStackHeaderSubview *)subview atIndex:(NSInteger)atIndex
{
  [_ABI37_0_0ReactSubviews insertObject:subview atIndex:atIndex];
  subview.ABI37_0_0ReactSuperview = self;
}

- (void)removeABI37_0_0ReactSubview:(ABI37_0_0RNSScreenStackHeaderSubview *)subview
{
  [_ABI37_0_0ReactSubviews removeObject:subview];
}

- (NSArray<UIView *> *)ABI37_0_0ReactSubviews
{
  return _ABI37_0_0ReactSubviews;
}

- (UIView *)ABI37_0_0ReactSuperview
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

  if (vc != nil && nextVC == vc) {
    [ABI37_0_0RNSScreenStackHeaderConfig updateViewController:self.screenView.controller
                                          withConfig:self
                                            animated:YES];
  }
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];
  [self updateViewControllerIfNeeded];
}

- (void)didUpdateABI37_0_0ReactSubviews
{
  [super didUpdateABI37_0_0ReactSubviews];
  [self updateViewControllerIfNeeded];
}

+ (void)setAnimatedConfig:(UIViewController *)vc withConfig:(ABI37_0_0RNSScreenStackHeaderConfig *)config
{
  UINavigationBar *navbar = ((UINavigationController *)vc.parentViewController).navigationBar;
  [navbar setTintColor:config.color];

#ifdef __IPHONE_13_0
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

    if (config.titleFontFamily || config.titleFontSize || config.titleColor) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];

      if (config.titleColor) {
        attrs[NSForegroundColorAttributeName] = config.titleColor;
      }

      CGFloat size = config.titleFontSize ? [config.titleFontSize floatValue] : 17;
      if (config.titleFontFamily) {
        attrs[NSFontAttributeName] = [UIFont fontWithName:config.titleFontFamily size:size];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:size];
      }
      [navbar setTitleTextAttributes:attrs];
    }

    if (@available(iOS 11.0, *)) {
      if (config.largeTitle && (config.largeTitleFontFamily || config.largeTitleFontSize || config.titleColor)) {
        NSMutableDictionary *largeAttrs = [NSMutableDictionary new];
        if (config.titleColor) {
          largeAttrs[NSForegroundColorAttributeName] = config.titleColor;
        }
        CGFloat largeSize = config.largeTitleFontSize ? [config.largeTitleFontSize floatValue] : 34;
        if (config.largeTitleFontFamily) {
          largeAttrs[NSFontAttributeName] = [UIFont fontWithName:config.largeTitleFontFamily size:largeSize];
        } else {
          largeAttrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:largeSize];
        }
        [navbar setLargeTitleTextAttributes:largeAttrs];
      }
    }
  }
}

+ (void)setTitleAttibutes:(NSDictionary *)attrs forButton:(UIBarButtonItem *)button
{
  [button setTitleTextAttributes:attrs forState:UIControlStateNormal];
  [button setTitleTextAttributes:attrs forState:UIControlStateHighlighted];
  [button setTitleTextAttributes:attrs forState:UIControlStateDisabled];
  [button setTitleTextAttributes:attrs forState:UIControlStateSelected];
  if (@available(iOS 9.0, *)) {
    [button setTitleTextAttributes:attrs forState:UIControlStateFocused];
  }
}

+ (UIImage*)loadBackButtonImageInViewController:(UIViewController *)vc
                                     withConfig:(ABI37_0_0RNSScreenStackHeaderConfig *)config
{
  BOOL hasBackButtonImage = NO;
  for (ABI37_0_0RNSScreenStackHeaderSubview *subview in config.ABI37_0_0ReactSubviews) {
    if (subview.type == ABI37_0_0RNSScreenStackHeaderSubviewTypeBackButton && subview.subviews.count > 0) {
      hasBackButtonImage = YES;
      ABI37_0_0RCTImageView *imageView = subview.subviews[0];
      if (imageView.image == nil) {
        // This is yet another workaround for loading custom back icon. It turns out that under
        // certain circumstances image attribute can be null despite the app running in production
        // mode (when images are loaded from the filesystem). This can happen because image attribute
        // is reset when image view is detached from window, and also in some cases initialization
        // does not populate the frame of the image view before the loading start. The latter result
        // in the image attribute not being updated. We manually set frame to the size of an image
        // in order to trigger proper reload that'd update the image attribute.
        ABI37_0_0RCTImageSource *source = imageView.imageSources[0];
        [imageView ABI37_0_0ReactSetFrame:CGRectMake(imageView.frame.origin.x,
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
        ABI37_0_0RCTImageSource *source = imageView.imageSources[0];
        image = [subview.bridge.imageLoader.imageCache
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
            vc.navigationItem.hidesBackButton = YES;
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

+ (void)willShowViewController:(UIViewController *)vc animated:(BOOL)animated withConfig:(ABI37_0_0RNSScreenStackHeaderConfig *)config
{
  [self updateViewController:vc withConfig:config animated:animated];
}

+ (void)updateViewController:(UIViewController *)vc withConfig:(ABI37_0_0RNSScreenStackHeaderConfig *)config animated:(BOOL)animated
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

  if (shouldHide) {
    return;
  }

  navitem.title = config.title;
  if (config.backTitle != nil) {
    prevItem.backBarButtonItem = [[UIBarButtonItem alloc]
                                  initWithTitle:config.backTitle
                                  style:UIBarButtonItemStylePlain
                                  target:nil
                                  action:nil];
    if (config.backTitleFontFamily || config.backTitleFontSize) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];
      CGFloat size = config.backTitleFontSize ? [config.backTitleFontSize floatValue] : 17;
      if (config.backTitleFontFamily) {
        attrs[NSFontAttributeName] = [UIFont fontWithName:config.backTitleFontFamily size:size];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:size];
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
#ifdef __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    UINavigationBarAppearance *appearance = [UINavigationBarAppearance new];

    if (config.backgroundColor && CGColorGetAlpha(config.backgroundColor.CGColor) == 0.) {
      // transparent background color
      [appearance configureWithTransparentBackground];
    } else {
      // non-transparent background or default background
      if (config.translucent) {
        [appearance configureWithDefaultBackground];
      } else {
        [appearance configureWithOpaqueBackground];
      }

      // set background color if specified
      if (config.backgroundColor) {
        appearance.backgroundColor = config.backgroundColor;
      }
    }

    if (config.backgroundColor && CGColorGetAlpha(config.backgroundColor.CGColor) == 0.) {
      appearance.backgroundColor = config.backgroundColor;
    }

    if (config.hideShadow) {
      appearance.shadowColor = nil;
    }

    if (config.titleFontFamily || config.titleFontSize || config.titleColor) {
      NSMutableDictionary *attrs = [NSMutableDictionary new];

      if (config.titleColor) {
        attrs[NSForegroundColorAttributeName] = config.titleColor;
      }

      CGFloat size = config.titleFontSize ? [config.titleFontSize floatValue] : 17;
      if (config.titleFontFamily) {
        attrs[NSFontAttributeName] = [UIFont fontWithName:config.titleFontFamily size:size];
      } else {
        attrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:size];
      }
      appearance.titleTextAttributes = attrs;
    }

    if (config.largeTitleFontFamily || config.largeTitleFontSize || config.titleColor) {
      NSMutableDictionary *largeAttrs = [NSMutableDictionary new];

      if (config.titleColor) {
        largeAttrs[NSForegroundColorAttributeName] = config.titleColor;
      }

      CGFloat largeSize = config.largeTitleFontSize ? [config.largeTitleFontSize floatValue] : 34;
      if (config.largeTitleFontFamily) {
        largeAttrs[NSFontAttributeName] = [UIFont fontWithName:config.largeTitleFontFamily size:largeSize];
      } else {
        largeAttrs[NSFontAttributeName] = [UIFont boldSystemFontOfSize:largeSize];
      }

      appearance.largeTitleTextAttributes = largeAttrs;
    }

    UIImage *backButtonImage = [self loadBackButtonImageInViewController:vc withConfig:config];
    if (backButtonImage) {
      [appearance setBackIndicatorImage:backButtonImage transitionMaskImage:backButtonImage];
    } else if (appearance.backIndicatorImage) {
      [appearance setBackIndicatorImage:nil transitionMaskImage:nil];
    }

    navitem.standardAppearance = appearance;
    navitem.compactAppearance = appearance;
    navitem.scrollEdgeAppearance = appearance;
  } else
#endif
  {
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
  }
  navitem.hidesBackButton = config.hideBackButton;
  navitem.leftBarButtonItem = nil;
  navitem.rightBarButtonItem = nil;
  navitem.titleView = nil;
  for (ABI37_0_0RNSScreenStackHeaderSubview *subview in config.ABI37_0_0ReactSubviews) {
    switch (subview.type) {
      case ABI37_0_0RNSScreenStackHeaderSubviewTypeLeft: {
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.leftBarButtonItem = buttonItem;
        break;
      }
      case ABI37_0_0RNSScreenStackHeaderSubviewTypeRight: {
        UIBarButtonItem *buttonItem = [[UIBarButtonItem alloc] initWithCustomView:subview];
        navitem.rightBarButtonItem = buttonItem;
        break;
      }
      case ABI37_0_0RNSScreenStackHeaderSubviewTypeCenter:
      case ABI37_0_0RNSScreenStackHeaderSubviewTypeTitle: {
        navitem.titleView = subview;
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
        ABI37_0_0RNSScreenStackHeaderConfig* config = nil;
        for (UIView *subview in fromVC.view.ABI37_0_0ReactSubviews) {
          if ([subview isKindOfClass:[ABI37_0_0RNSScreenStackHeaderConfig class]]) {
            config = (ABI37_0_0RNSScreenStackHeaderConfig*) subview;
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

@end

@implementation ABI37_0_0RNSScreenStackHeaderConfigManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI37_0_0RNSScreenStackHeaderConfig new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontFamily, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(titleFontSize, NSNumber)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(backTitle, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleFontFamily, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(backTitleFontSize, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitle, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontFamily, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(largeTitleFontSize, NSNumber)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(hideBackButton, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(hideShadow, BOOL)
// `hidden` is an UIView property, we need to use different name internally
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(hidden, hide, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(translucent, BOOL)

@end

@implementation ABI37_0_0RCTConvert (ABI37_0_0RNSScreenStackHeader)

ABI37_0_0RCT_ENUM_CONVERTER(ABI37_0_0RNSScreenStackHeaderSubviewType, (@{
   @"back": @(ABI37_0_0RNSScreenStackHeaderSubviewTypeBackButton),
   @"left": @(ABI37_0_0RNSScreenStackHeaderSubviewTypeLeft),
   @"right": @(ABI37_0_0RNSScreenStackHeaderSubviewTypeRight),
   @"title": @(ABI37_0_0RNSScreenStackHeaderSubviewTypeTitle),
   @"center": @(ABI37_0_0RNSScreenStackHeaderSubviewTypeCenter),
   }), ABI37_0_0RNSScreenStackHeaderSubviewTypeTitle, integerValue)

@end

@implementation ABI37_0_0RNSScreenStackHeaderSubviewManager

ABI37_0_0RCT_EXPORT_MODULE()

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(type, ABI37_0_0RNSScreenStackHeaderSubviewType)

- (UIView *)view
{
  return [[ABI37_0_0RNSScreenStackHeaderSubview alloc] initWithBridge:self.bridge];
}

@end
